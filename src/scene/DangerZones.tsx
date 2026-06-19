import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { dangerZones } from '../simulation/vehicleFactory';
import { useScheduleStore } from '../store/useScheduleStore';
import { COLORS } from '../utils/colors';

export function DangerZones() {
  const zones = useMemo(() => dangerZones(), []);
  const show = useScheduleStore((s) => s.showDangerZones);
  const isNight = useScheduleStore((s) => s.isNight);
  const pulseRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const edgeRefs = useRef<(THREE.LineBasicMaterial | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = (Math.sin(t * 2.5) + 1) / 2;
    pulseRefs.current.forEach((m, i) => {
      if (m) {
        m.opacity = 0.2 + pulse * 0.35;
        m.emissiveIntensity = 0.3 + pulse * (isNight ? 1.2 : 0.5);
      }
      const e = edgeRefs.current[i];
      if (e) e.opacity = 0.6 + pulse * 0.4;
    });
  });

  if (!show) return null;

  return (
    <group name="danger-zones">
      {zones.map((z, i) => (
        <group
          key={i}
          position={[z.center.x, z.center.y + 0.15, z.center.z]}
          name={`danger-${i}`}
        >
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <ringGeometry args={[z.radius - 0.8, z.radius, 64]} />
            <meshBasicMaterial
              color={COLORS.dangerBorder}
              side={THREE.DoubleSide}
              transparent
              opacity={0.9}
            />
          </mesh>

          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[z.radius - 1, 48]} />
            <meshStandardMaterial
              ref={(el) => {
                pulseRefs.current[i] = el as unknown as THREE.MeshStandardMaterial;
              }}
              color={COLORS.dangerBorder}
              transparent
              opacity={0.35}
              emissive={COLORS.dangerBorder}
              emissiveIntensity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>

          {[0, 1, 2, 3, 4, 5, 6, 7].map((s) => {
            const angle = (s / 8) * Math.PI * 2;
            return (
              <mesh
                key={s}
                position={[
                  Math.cos(angle) * (z.radius - 2),
                  0.4,
                  Math.sin(angle) * (z.radius - 2),
                ]}
                rotation={[0, -angle, 0]}
              >
                <coneGeometry args={[0.6, 1.4, 3]} />
                <meshStandardMaterial
                  color="#FFB300"
                  emissive="#FFB300"
                  emissiveIntensity={isNight ? 0.8 : 0.3}
                />
              </mesh>
            );
          })}

          {Array.from({ length: 16 }, (_, k) => {
            const angle = (k / 16) * Math.PI * 2;
            const r = z.radius - 0.4;
            const next = ((k + 1) / 16) * Math.PI * 2;
            const pts = [
              new THREE.Vector3(Math.cos(angle) * r, 0.3, Math.sin(angle) * r),
              new THREE.Vector3(Math.cos(angle) * r, 3.2, Math.sin(angle) * r),
              new THREE.Vector3(Math.cos(next) * r, 3.2, Math.sin(next) * r),
              new THREE.Vector3(Math.cos(next) * r, 0.3, Math.sin(next) * r),
            ];
            const geom = new THREE.BufferGeometry().setFromPoints(pts);
            return (
              <lineSegments
                key={`edge-${k}`}
                geometry={geom}
              >
                <lineBasicMaterial
                  ref={(el) => {
                    edgeRefs.current[i * 16 + k] = el as unknown as THREE.LineBasicMaterial;
                  }}
                  color={COLORS.dangerBorder}
                  transparent
                  opacity={0.8}
                />
              </lineSegments>
            );
          })}

          <mesh position={[0, 0.3, z.radius - 2.8]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[8, 2.5]} />
            <meshBasicMaterial color="#000" transparent opacity={0} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
