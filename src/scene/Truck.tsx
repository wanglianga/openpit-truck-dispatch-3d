import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Truck as TruckT } from '../simulation/types';
import { useScheduleStore } from '../store/useScheduleStore';
import { fleetColor, materialColor, statusLabel, materialLabel, COLORS } from '../utils/colors';
import { lodLevel, distanceToCamera, shouldRenderLabel, LOD_DISTANCE_CLOSE, LOD_DISTANCE_MEDIUM } from '../utils/lod';

interface TruckProps {
  truck: TruckT;
  isNight: boolean;
  selected: boolean;
  hovered: boolean;
}

function useWheelSpin(truck: TruckT) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current && truck.speed > 0.1) {
      const rot = delta * (truck.speed / 3.6) / 0.6;
      ref.current.children.forEach((c) => {
        if (c instanceof THREE.Group) c.rotation.x += rot;
      });
    }
  });
  return ref;
}

export function TruckMesh({ truck, isNight, selected, hovered }: TruckProps) {
  const { camera } = useThree();
  const headLightLRef = useRef<THREE.SpotLight>(null);
  const headLightRRef = useRef<THREE.SpotLight>(null);
  const tailLightLRef = useRef<THREE.PointLight>(null);
  const tailLightRRef = useRef<THREE.PointLight>(null);
  const wheelRef = useWheelSpin(truck);
  const showLabels = useScheduleStore((s) => s.showAllLabels);

  const { level, distance } = useMemo(() => {
    const d = distanceToCamera(truck.position, camera);
    return { level: lodLevel(d), distance: d };
  }, [truck.position.x, truck.position.y, truck.position.z, camera.position.x, camera.position.y, camera.position.z]);

  const fc = fleetColor(truck.fleet);
  const mc = materialColor(truck.material);
  const capRatio = truck.load / Math.max(1, truck.capacity);
  const showLabel = shouldRenderLabel(distance, selected, hovered, showLabels);

  useFrame(() => {
    const on = isNight && (truck.status === 'hauling' || truck.status === 'returning');
    if (headLightLRef.current) headLightLRef.current.intensity = on ? 1.8 : 0;
    if (headLightRRef.current) headLightRRef.current.intensity = on ? 1.8 : 0;
    const brake = truck.speed < 1;
    const tailIntensity = isNight ? (brake ? 2.5 : 0.6) : 0;
    if (tailLightLRef.current) tailLightLRef.current.intensity = tailIntensity;
    if (tailLightRRef.current) tailLightRRef.current.intensity = tailIntensity;
  });

  const scale = level === 'high' ? 1 : level === 'medium' ? 1 : 0.95;
  const showDetails = level !== 'low';
  const showVeryDetails = level === 'high';

  return (
    <group
      position={[truck.position.x, truck.position.y, truck.position.z]}
      rotation={[0, truck.heading, 0]}
      scale={scale}
      name={`truck-${truck.id}`}
      userData={{ truckId: truck.id }}
    >
      {level !== 'low' ? (
        <>
          <group>
            <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.8, 1.4, 5.6]} />
              <meshStandardMaterial color={fc} roughness={0.6} metalness={0.3} />
            </mesh>

            <mesh position={[0, 1.38, 1.3]}>
              <boxGeometry args={[2.7, 0.1, 5.5]} />
              <meshStandardMaterial color={mc} roughness={1} transparent opacity={0.95} />
            </mesh>

            {showVeryDetails && capRatio > 0.1 && (
              <mesh position={[0, 1.38 + capRatio * 0.8, 1.3]}>
                <boxGeometry args={[2.4, capRatio * 1.5, 4.8]} />
                <meshStandardMaterial color={mc} roughness={1} />
              </mesh>
            )}

            <mesh position={[0, 1.8, -2.2]} castShadow>
              <boxGeometry args={[2.6, 1.9, 2.4]} />
              <meshStandardMaterial color={fc} roughness={0.5} metalness={0.4} />
            </mesh>

            <mesh position={[0, 2.2, -2.9]} rotation={[0.2, 0, 0]}>
              <boxGeometry args={[2.3, 0.05, 1.2]} />
              <meshStandardMaterial color="#0a0a0a" metalness={0.3} roughness={0.2} />
            </mesh>

            {showVeryDetails && (
              <mesh position={[-0.9, 2.5, -2.4]}>
                <boxGeometry args={[0.06, 0.8, 0.12]} />
                <meshStandardMaterial color="#555" />
              </mesh>
            )}

            <mesh position={[0, 3, -2.1]}>
              <boxGeometry args={[0.05, 0.7, 0.05]} />
              <meshStandardMaterial color="#222" />
            </mesh>

            {showDetails && (
              <group ref={wheelRef}>
                {[-1.1, 1.1].map((x) =>
                  [2.4, 0.6, -0.8, -2.2].map((z, idx) => (
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
            )}

            {showDetails && (
              <>
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
              </>
            )}

            {showVeryDetails && (
              <>
                <mesh position={[-0.95, 2.3, -3]} rotation={[0, 0, Math.PI / 24]}>
                  <sphereGeometry args={[0.15, 12, 12]} />
                  <meshStandardMaterial
                    color={COLORS.headLight}
                    emissive={COLORS.headLight}
                    emissiveIntensity={isNight ? 2.5 : 0.3}
                  />
                </mesh>
                <mesh position={[0.95, 2.3, -3]} rotation={[0, 0, -Math.PI / 24]}>
                  <sphereGeometry args={[0.15, 12, 12]} />
                  <meshStandardMaterial
                    color={COLORS.headLight}
                    emissive={COLORS.headLight}
                    emissiveIntensity={isNight ? 2.5 : 0.3}
                  />
                </mesh>
                <mesh position={[-0.95, 1.6, 2.85]}>
                  <sphereGeometry args={[0.12, 10, 10]} />
                  <meshStandardMaterial
                    color={COLORS.tailLight}
                    emissive={COLORS.tailLight}
                    emissiveIntensity={isNight ? 2 : 0.2}
                  />
                </mesh>
                <mesh position={[0.95, 1.6, 2.85]}>
                  <sphereGeometry args={[0.12, 10, 10]} />
                  <meshStandardMaterial
                    color={COLORS.tailLight}
                    emissive={COLORS.tailLight}
                    emissiveIntensity={isNight ? 2 : 0.2}
                  />
                </mesh>
              </>
            )}

            {selected && (
              <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[3.2, 3.8, 32]} />
                <meshBasicMaterial
                  color={COLORS.accent}
                  transparent
                  opacity={0.85}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
            {hovered && !selected && (
              <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[3.0, 3.5, 32]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.55} />
              </mesh>
            )}
            {truck.safetyAlert && (
              <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[3.4, 4.2, 32]} />
                <meshBasicMaterial
                  color={COLORS.statusDanger}
                  transparent
                  opacity={0.75}
                />
              </mesh>
            )}
          </group>

          {isNight && showVeryDetails && (
            <>
              <spotLight
                ref={headLightLRef}
                position={[-0.95, 2.4, -3.2]}
                angle={Math.PI / 6}
                penumbra={0.35}
                intensity={1.8}
                distance={90}
                color={COLORS.headLight}
                castShadow
                target-position={[-0.4, 0, -60]}
              />
              <spotLight
                ref={headLightRRef}
                position={[0.95, 2.4, -3.2]}
                angle={Math.PI / 6}
                penumbra={0.35}
                intensity={1.8}
                distance={90}
                color={COLORS.headLight}
                castShadow
                target-position={[0.4, 0, -60]}
              />
              <pointLight
                ref={tailLightLRef}
                position={[-0.95, 1.7, 2.9]}
                color={COLORS.tailLight}
                distance={18}
                intensity={0.6}
                decay={2}
              />
              <pointLight
                ref={tailLightRRef}
                position={[0.95, 1.7, 2.9]}
                color={COLORS.tailLight}
                distance={18}
                intensity={0.6}
                decay={2}
              />
            </>
          )}

          {showLabel && (
            <Html
              position={[0, 5.5, 0]}
              center
              distanceFactor={16}
              zIndexRange={[10, 0]}
              occlude={false}
              style={{ pointerEvents: 'none' }}
            >
              <div
                style={{
                  background: selected
                    ? 'rgba(255,122,26,0.95)'
                    : hovered
                    ? 'rgba(41,182,246,0.95)'
                    : truck.safetyAlert
                    ? 'rgba(229,57,53,0.95)'
                    : 'rgba(30,42,58,0.92)',
                  color: '#fff',
                  padding: '5px 10px',
                  borderRadius: 5,
                  border: `1.5px solid ${
                    selected
                      ? '#fff'
                      : hovered
                      ? '#fff'
                      : truck.safetyAlert
                      ? '#fff'
                      : 'rgba(255,255,255,0.35)'
                  }`,
                  fontFamily: 'Noto Sans SC, sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.6)',
                  minWidth: 80,
                  textAlign: 'center',
                  transition: 'all 0.15s',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: fc,
                      border: truck.material ? `2px solid ${mc}` : 'none',
                    }}
                  />
                  <span>{truck.plateNo}</span>
                </div>
                <div
                  style={{
                    fontSize: 10,
                    opacity: 0.92,
                    marginTop: 2,
                    fontWeight: 500,
                  }}
                >
                  {statusLabel(truck.status)} | {materialLabel(truck.material)}{' '}
                  {truck.load > 0 && `(${truck.load.toFixed(0)}t)`}
                </div>
                {(selected || hovered) && (
                  <div
                    style={{
                      fontSize: 10,
                      opacity: 0.9,
                      marginTop: 1,
                      borderTop: '1px solid rgba(255,255,255,0.2)',
                      paddingTop: 3,
                    }}
                  >
                    速度 {truck.speed.toFixed(0)} km/h | 距前车{' '}
                    {truck.distanceToNext.toFixed(0)}m
                  </div>
                )}
                {truck.safetyAlert && (
                  <div
                    style={{
                      fontSize: 10,
                      marginTop: 2,
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 3,
                      padding: '1px 4px',
                    }}
                  >
                    ⚠ {truck.safetyAlert === 'overspeed' ? '超速' : '距离过近'}
                  </div>
                )}
              </div>
            </Html>
          )}
        </>
      ) : (
        <group>
          <mesh castShadow>
            <boxGeometry args={[2.6, 2.2, 5.2]} />
            <meshStandardMaterial color={fc} roughness={0.7} />
          </mesh>
          {truck.load > 0 && (
            <mesh position={[0, 1.3, 1.2]}>
              <boxGeometry args={[2.2, capRatio * 1.5, 4.2]} />
              <meshStandardMaterial color={mc} />
            </mesh>
          )}
          {(selected || truck.safetyAlert) && (
            <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[3.2, 3.8, 32]} />
              <meshBasicMaterial
                color={truck.safetyAlert ? COLORS.statusDanger : COLORS.accent}
                transparent
                opacity={0.7}
              />
            </mesh>
          )}
        </group>
      )}
    </group>
  );
}

export const LOD_THRESHOLDS = { close: LOD_DISTANCE_CLOSE, medium: LOD_DISTANCE_MEDIUM };
