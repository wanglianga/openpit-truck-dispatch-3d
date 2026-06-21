import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useScheduleStore } from '../store/useScheduleStore';
import { LOADING_POINTS } from '../simulation/vehicleFactory';
import { materialColor, COLORS } from '../utils/colors';
import type { Excavator, MaterialType } from '../simulation/types';

function ExcavatorMeshRef({
  excavatorId,
  material,
}: {
  excavatorId: string;
  material: MaterialType;
}) {
  const swingRef = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Group>(null);
  const bucketRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const ex = useScheduleStore.getState().excavators[excavatorId] as Excavator | undefined;
    if (!ex) return;
    if (swingRef.current) swingRef.current.rotation.y = ex.swingAngle;
    if (armRef.current) armRef.current.rotation.x = ex.armPitch;
    if (bucketRef.current) bucketRef.current.rotation.x = ex.bucketOpen;
  });

  const col = useMemo(() => materialColor(material), [material]);

  return (
    <group>
      <group position={[0, 0.5, 0]}>
        <mesh castShadow receiveShadow position={[0, -0.4, 0]}>
          <boxGeometry args={[4.5, 0.7, 2.8]} />
          <meshStandardMaterial color="#2b2b2b" roughness={0.8} />
        </mesh>
        {[-1.6, 1.6].map((x) => (
          <mesh key={x} position={[x, -0.4, 0]} castShadow>
            <boxGeometry args={[0.5, 0.7, 3.2]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        ))}
        <mesh position={[0, -0.2, 1.4]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.9, 0.35, 10, 20]} />
          <meshStandardMaterial color="#1f1f1f" />
        </mesh>
      </group>

      <group ref={swingRef} position={[0, 0.8, 0]}>
        <mesh castShadow position={[0, 1, 0]}>
          <boxGeometry args={[3.6, 2, 3.2]} />
          <meshStandardMaterial color="#E66A10" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[0, 2.2, 0]} castShadow>
          <boxGeometry args={[2.2, 0.8, 1.6]} />
          <meshStandardMaterial color="#1f2a3a" />
        </mesh>

        <group ref={armRef} position={[0, 1.8, 1.5]}>
          <mesh castShadow position={[0, 0.2, 2.2]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[1.1, 1.1, 4.4]} />
            <meshStandardMaterial color={COLORS.accent} roughness={0.5} metalness={0.4} />
          </mesh>
          <group position={[0, -0.2, 4.6]} rotation={[0.5, 0, 0]}>
            <mesh castShadow position={[0, 0, 1.6]} rotation={[-0.2, 0, 0]}>
              <boxGeometry args={[0.9, 0.9, 3.4]} />
              <meshStandardMaterial color="#B85A0C" />
            </mesh>
            <group ref={bucketRef} position={[0, -0.2, 3.6]}>
              <mesh castShadow position={[0, -0.6, 0]} rotation={[0.4, 0, 0]}>
                <boxGeometry args={[2.4, 1.4, 2.2]} />
                <meshStandardMaterial color={col} metalness={0.3} roughness={0.8} />
              </mesh>
              <mesh position={[-1, -0.5, -1.1]}>
                <boxGeometry args={[0.1, 1, 0.3]} />
                <meshStandardMaterial color="#888" metalness={0.8} />
              </mesh>
              <mesh position={[1, -0.5, -1.1]}>
                <boxGeometry args={[0.1, 1, 0.3]} />
                <meshStandardMaterial color="#888" metalness={0.8} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

export function LoadingPoints() {
  const htmlRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const setHtmlRef = (id: string) => (d: HTMLDivElement | null) => {
    htmlRefs.current[id] = d;
  };

  useFrame(() => {
    const state = useScheduleStore.getState();
    const { loadingPoints, trucks } = state;
    for (const lp of LOADING_POINTS) {
      const s = loadingPoints[lp.id] || lp;
      const d = htmlRefs.current[lp.id];
      if (!d) continue;
      const queueLen = s.queue.length;
      const queueTrucks = s.queue.map((id) => trucks[id]).filter(Boolean);
      const totalCapacity = queueTrucks.reduce((sum, t) => sum + (t?.capacity || 0), 0);
      d.innerHTML = `
        <div>${lp.name}</div>
        <div style="font-size:11px;opacity:0.95;margin-top:2px;">
          排队 ${queueLen} 辆 | ${totalCapacity} 吨 | 等待约 ${s.avgWaitTime.toFixed(0)} 分
        </div>
      `;
    }
  });

  return (
    <group name="loading-points">
      {LOADING_POINTS.map((lp) => (
        <group
          key={lp.id}
          position={[lp.position.x, lp.position.y, lp.position.z]}
          name={`lp-${lp.id}`}
        >
          <mesh position={[0, 0.04, 0]} receiveShadow>
            <cylinderGeometry args={[16, 16, 0.1, 32]} />
            <meshStandardMaterial color={COLORS.loadingZone} transparent opacity={0.5} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <ringGeometry args={[15.5, 16, 48]} />
            <meshBasicMaterial color={COLORS.accent} side={2} transparent opacity={0.7} />
          </mesh>

          <mesh position={[-14, 0.1, -14]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[5, 3]} />
            <meshBasicMaterial color={materialColor(lp.material)} />
          </mesh>

          <ExcavatorMeshRef excavatorId={lp.excavatorId} material={lp.material} />

          <Html
            position={[0, 18, 0]}
            center
            distanceFactor={10}
            style={{ pointerEvents: 'none' }}
          >
            <div
              ref={setHtmlRef(lp.id)}
              style={{
                background: 'rgba(255,122,26,0.9)',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: 6,
                border: '2px solid rgba(255,255,255,0.5)',
                fontFamily: 'Noto Sans SC, sans-serif',
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
            />
          </Html>
        </group>
      ))}
    </group>
  );
}
