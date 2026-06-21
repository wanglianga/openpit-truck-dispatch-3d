import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Truck as TruckT } from '../simulation/types';
import { useScheduleStore } from '../store/useScheduleStore';
import { fleetColor, materialColor, statusLabel, materialLabel, COLORS } from '../utils/colors';
import { distanceToCamera, shouldRenderLabel, LOD_DISTANCE_CLOSE, LOD_DISTANCE_MEDIUM } from '../utils/lod';

interface TruckProps {
  truck: TruckT;
  isNight: boolean;
  selected: boolean;
  hovered: boolean;
  staticTruckId?: string;
}

function useWheelSpinRef() {
  const ref = useRef<THREE.Group>(null);
  const lastSpeedRef = useRef(0);
  useFrame((_, delta) => {
    if (!ref.current) return;
    const speed = lastSpeedRef.current;
    if (speed > 0.1) {
      const rot = delta * (speed / 3.6) / 0.6;
      ref.current.children.forEach((c) => {
        if (c instanceof THREE.Group) c.rotation.x += rot;
      });
    }
  });
  return [ref, lastSpeedRef] as const;
}

export function TruckMesh({ truck, isNight: isNightProp, selected, hovered, staticTruckId }: TruckProps) {
  const rootGrp = useRef<THREE.Group>(null);
  const headLightLRef = useRef<THREE.SpotLight>(null);
  const headLightRRef = useRef<THREE.SpotLight>(null);
  const tailLightLRef = useRef<THREE.PointLight>(null);
  const tailLightRRef = useRef<THREE.PointLight>(null);
  const [wheelRef, wheelSpeedRef] = useWheelSpinRef();
  const labelDivRef = useRef<HTMLDivElement>(null);
  const showLabels = useScheduleStore((s) => s.showAllLabels);

  const headlightLEmissiveRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const headlightREmissiveRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const taillightLEmissiveRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const taillightREmissiveRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const loadMeshRef = useRef<THREE.Mesh | null>(null);
  const loadMeshTopRef = useRef<THREE.Mesh | null>(null);

  const safetyRingRef = useRef<THREE.Mesh>(null);
  const selectedRingRef = useRef<THREE.Mesh>(null);
  const hoveredRingRef = useRef<THREE.Mesh>(null);

  const fc0 = useMemo(() => fleetColor(truck.fleet), [truck.fleet]);
  const mc0 = useMemo(() => materialColor(truck.material), [truck.material]);

  useEffect(() => {
    if (!rootGrp.current) return;
    rootGrp.current.userData.staticTruckId = staticTruckId || null;
  }, [staticTruckId]);

  useFrame((state) => {
    const cam = state.camera;
    const curId = staticTruckId;
    let cur: TruckT | undefined = truck;
    let isNightNow = isNightProp;
    if (curId) {
      const s = useScheduleStore.getState();
      cur = s.trucks[curId];
      isNightNow = s.isNight;
    }
    if (!cur) return;
    wheelSpeedRef.current = cur.speed;

    const distance = distanceToCamera(cur.position, cam);
    const selectedNow = staticTruckId
      ? useScheduleStore.getState().selectedTruckId === staticTruckId
      : selected;
    const hoveredNow = staticTruckId
      ? useScheduleStore.getState().hoveredTruckId === staticTruckId
      : hovered;
    const showAllLabelsNow = staticTruckId ? useScheduleStore.getState().showAllLabels : showLabels;
    const showLabelNow = shouldRenderLabel(distance, selectedNow, hoveredNow, showAllLabelsNow);

    if (headlightLEmissiveRef.current) {
      const emiss = isNightNow ? 2.5 : 0.3;
      headlightLEmissiveRef.current.emissiveIntensity = emiss;
    }
    if (headlightREmissiveRef.current) {
      const emiss = isNightNow ? 2.5 : 0.3;
      headlightREmissiveRef.current.emissiveIntensity = emiss;
    }
    if (taillightLEmissiveRef.current) {
      const brake = cur.speed < 1;
      taillightLEmissiveRef.current.emissiveIntensity = isNightNow ? (brake ? 2 : 0.8) : 0.2;
    }
    if (taillightREmissiveRef.current) {
      const brake = cur.speed < 1;
      taillightREmissiveRef.current.emissiveIntensity = isNightNow ? (brake ? 2 : 0.8) : 0.2;
    }

    const onLight = isNightNow && (cur.status === 'hauling' || cur.status === 'returning');
    if (headLightLRef.current) headLightLRef.current.intensity = onLight ? 1.8 : 0;
    if (headLightRRef.current) headLightRRef.current.intensity = onLight ? 1.8 : 0;
    const tailIntensity = isNightNow ? (cur.speed < 1 ? 2.5 : 0.6) : 0;
    if (tailLightLRef.current) tailLightLRef.current.intensity = tailIntensity;
    if (tailLightRRef.current) tailLightRRef.current.intensity = tailIntensity;

    const cap = cur.load / Math.max(1, cur.capacity);
    if (loadMeshTopRef.current && loadMeshTopRef.current.visible) {
      loadMeshTopRef.current.position.y = 1.38 + cap * 0.8;
      const g = loadMeshTopRef.current.geometry as THREE.BoxGeometry;
      if (g && g.parameters) {
        const needH = cap * 1.5;
        if (Math.abs((g.parameters.height || 0) - needH) > 0.01) {
          loadMeshTopRef.current.geometry.dispose();
          loadMeshTopRef.current.geometry = new THREE.BoxGeometry(2.4, needH, 4.8);
        }
      }
    }
    if (loadMeshRef.current) {
      loadMeshRef.current.visible = cur.load > 0;
    }

    if (selectedRingRef.current) selectedRingRef.current.visible = !!selectedNow;
    if (hoveredRingRef.current) hoveredRingRef.current.visible = !!hoveredNow && !selectedNow;
    if (safetyRingRef.current) safetyRingRef.current.visible = !!cur.safetyAlert;

    if (labelDivRef.current) {
      const d = labelDivRef.current;
      const showHtml = showLabelNow;
      if (d.style.display === 'none' && showHtml) d.style.display = '';
      else if (!showHtml) d.style.display = 'none';
      if (showHtml) {
        const sel = selectedNow;
        const hov = hoveredNow;
        const alert = !!cur.safetyAlert;
        const alertType = cur.safetyAlert;
        const bg = sel
          ? 'rgba(255,122,26,0.95)'
          : hov
          ? 'rgba(41,182,246,0.95)'
          : alert
          ? 'rgba(229,57,53,0.95)'
          : 'rgba(30,42,58,0.92)';
        const border = sel || hov || alert ? '#fff' : 'rgba(255,255,255,0.35)';
        d.style.background = bg;
        d.style.border = `1.5px solid ${border}`;
        const fc = fleetColor(cur.fleet);
        const mc = materialColor(cur.material);
        const borderStyle = cur.material ? `2px solid ${mc}` : 'none';
        const extraLine = sel || hov
          ? `<div style="font-size:10px;opacity:0.9;margin-top:1px;border-top:1px solid rgba(255,255,255,0.2);padding-top:3px;">速度 ${cur.speed.toFixed(0)} km/h | 距前车 ${cur.distanceToNext.toFixed(0)}m</div>`
          : '';
        const alertLine = alert
          ? `<div style="font-size:10px;margin-top:2px;background:rgba(0,0,0,0.3);border-radius:3px;padding:1px 4px;">⚠ ${alertType === 'overspeed' ? '超速' : '距离过近'}</div>`
          : '';
        d.innerHTML = `
          <div style="display:flex;align-items:center;gap:4px;justify-content:center;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${fc};border:${borderStyle};"></span>
            <span>${cur.plateNo}</span>
          </div>
          <div style="font-size:10px;opacity:0.92;margin-top:2px;font-weight:500;">
            ${statusLabel(cur.status)} | ${materialLabel(cur.material)} ${cur.load > 0 ? `(${cur.load.toFixed(0)}t)` : ''}
          </div>
          ${extraLine}
          ${alertLine}
        `;
      }
    }
  });

  const capRatio0 = truck.load / Math.max(1, truck.capacity);

  return (
    <group ref={rootGrp} name={`truck-${truck.id}`} userData={{ truckId: truck.id }}>
      <group>
        <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.8, 1.4, 5.6]} />
          <meshStandardMaterial color={fc0} roughness={0.6} metalness={0.3} />
        </mesh>

        <mesh ref={loadMeshRef} position={[0, 1.38, 1.3]}>
          <boxGeometry args={[2.7, 0.1, 5.5]} />
          <meshStandardMaterial color={mc0} roughness={1} transparent opacity={0.95} />
        </mesh>

        <mesh ref={loadMeshTopRef} position={[0, 1.38 + capRatio0 * 0.8, 1.3]} visible={capRatio0 > 0.1}>
          <boxGeometry args={[2.4, capRatio0 * 1.5, 4.8]} />
          <meshStandardMaterial color={mc0} roughness={1} />
        </mesh>

        <mesh position={[0, 1.8, -2.2]} castShadow>
          <boxGeometry args={[2.6, 1.9, 2.4]} />
          <meshStandardMaterial color={fc0} roughness={0.5} metalness={0.4} />
        </mesh>

        <mesh position={[0, 2.2, -2.9]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[2.3, 0.05, 1.2]} />
          <meshStandardMaterial color="#0a0a0a" metalness={0.3} roughness={0.2} />
        </mesh>

        <mesh position={[-0.9, 2.5, -2.4]}>
          <boxGeometry args={[0.06, 0.8, 0.12]} />
          <meshStandardMaterial color="#555" />
        </mesh>

        <mesh position={[0, 3, -2.1]}>
          <boxGeometry args={[0.05, 0.7, 0.05]} />
          <meshStandardMaterial color="#222" />
        </mesh>

        <group ref={wheelRef}>
          {[-1.1, 1.1].map((x) =>
            [2.4, 0.6, -0.8, -2.2].map((z) => (
              <group key={`${x}-${z}`} position={[x, 0.6, z]}>
                <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[0.55, 0.55, 0.35, 14]} />
                  <meshStandardMaterial color="#151515" roughness={0.7} />
                </mesh>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.3, 0.3, 0.36, 8]} />
                  <meshStandardMaterial color="#777" metalness={0.7} roughness={0.4} />
                </mesh>
              </group>
            ))
          )}
        </group>

        <mesh position={[1.1, 2.3, -2]}>
          <boxGeometry args={[0.04, 0.9, 1.5]} />
          <meshStandardMaterial color="#111" metalness={0.2} roughness={0.2} />
        </mesh>
        <mesh position={[-1.1, 2.3, -2]}>
          <boxGeometry args={[0.04, 0.9, 1.5]} />
          <meshStandardMaterial color="#111" metalness={0.2} roughness={0.2} />
        </mesh>
        <mesh position={[0, 2.6, -0.8]}>
          <boxGeometry args={[2.5, 0.04, 0.04]} />
          <meshStandardMaterial color="#222" />
        </mesh>

        <mesh position={[-0.95, 2.3, -3]} rotation={[0, 0, Math.PI / 24]}>
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshStandardMaterial
            ref={(m) => {
              if (m) headlightLEmissiveRef.current = m;
            }}
            color={COLORS.headLight}
            emissive={COLORS.headLight}
            emissiveIntensity={isNightProp ? 2.5 : 0.3}
          />
        </mesh>
        <mesh position={[0.95, 2.3, -3]} rotation={[0, 0, -Math.PI / 24]}>
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshStandardMaterial
            ref={(m) => {
              if (m) headlightREmissiveRef.current = m;
            }}
            color={COLORS.headLight}
            emissive={COLORS.headLight}
            emissiveIntensity={isNightProp ? 2.5 : 0.3}
          />
        </mesh>
        <mesh position={[-0.95, 1.6, 2.85]}>
          <sphereGeometry args={[0.12, 10, 10]} />
          <meshStandardMaterial
            ref={(m) => {
              if (m) taillightLEmissiveRef.current = m;
            }}
            color={COLORS.tailLight}
            emissive={COLORS.tailLight}
            emissiveIntensity={isNightProp ? 2 : 0.2}
          />
        </mesh>
        <mesh position={[0.95, 1.6, 2.85]}>
          <sphereGeometry args={[0.12, 10, 10]} />
          <meshStandardMaterial
            ref={(m) => {
              if (m) taillightREmissiveRef.current = m;
            }}
            color={COLORS.tailLight}
            emissive={COLORS.tailLight}
            emissiveIntensity={isNightProp ? 2 : 0.2}
          />
        </mesh>

        <mesh
          ref={selectedRingRef}
          position={[0, 0.08, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={selected}
        >
          <ringGeometry args={[3.2, 3.8, 32]} />
          <meshBasicMaterial
            color={COLORS.accent}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh
          ref={hoveredRingRef}
          position={[0, 0.06, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={hovered && !selected}
        >
          <ringGeometry args={[3.0, 3.5, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.55} />
        </mesh>
        <mesh
          ref={safetyRingRef}
          position={[0, 0.12, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={!!truck.safetyAlert}
        >
          <ringGeometry args={[3.4, 4.2, 32]} />
          <meshBasicMaterial color={COLORS.statusDanger} transparent opacity={0.75} />
        </mesh>
      </group>

      {isNightProp && (
        <>
          <spotLight
            ref={headLightLRef}
            position={[-0.95, 2.4, -3.2]}
            angle={Math.PI / 6}
            penumbra={0.35}
            intensity={0}
            distance={90}
            color={COLORS.headLight}
            target-position={[-0.4, 0, -60]}
          />
          <spotLight
            ref={headLightRRef}
            position={[0.95, 2.4, -3.2]}
            angle={Math.PI / 6}
            penumbra={0.35}
            intensity={0}
            distance={90}
            color={COLORS.headLight}
            target-position={[0.4, 0, -60]}
          />
          <pointLight
            ref={tailLightLRef}
            position={[-0.95, 1.7, 2.9]}
            color={COLORS.tailLight}
            distance={18}
            intensity={0}
            decay={2}
          />
          <pointLight
            ref={tailLightRRef}
            position={[0.95, 1.7, 2.9]}
            color={COLORS.tailLight}
            distance={18}
            intensity={0}
            decay={2}
          />
        </>
      )}

      <Html
        position={[0, 5.5, 0]}
        center
        distanceFactor={16}
        zIndexRange={[10, 0]}
        occlude={false}
        style={{ pointerEvents: 'none' }}
      >
        <div
          ref={labelDivRef}
          style={{
            color: '#fff',
            padding: '5px 10px',
            borderRadius: 5,
            border: `1.5px solid rgba(255,255,255,0.35)`,
            fontFamily: 'Noto Sans SC, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            boxShadow: '0 3px 10px rgba(0,0,0,0.6)',
            minWidth: 80,
            textAlign: 'center',
            transition: 'all 0.15s',
            background: 'rgba(30,42,58,0.92)',
          }}
        />
      </Html>
    </group>
  );
}

export const LOD_THRESHOLDS = { close: LOD_DISTANCE_CLOSE, medium: LOD_DISTANCE_MEDIUM };
