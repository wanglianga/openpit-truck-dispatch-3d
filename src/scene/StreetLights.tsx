import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { streetLightPositions } from '../simulation/vehicleFactory';
import { useScheduleStore } from '../store/useScheduleStore';
import { COLORS } from '../utils/colors';

const MAX_LIGHTS = 40;

export function StreetLights() {
  const positions = useMemo(() => streetLightPositions().slice(0, MAX_LIGHTS), []);
  const isNight = useScheduleStore((s) => s.isNight);
  const groupRef = useRef<THREE.Group>(null);
  const lightRefs = useRef<THREE.PointLight[]>([]);
  const bulbMatRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  useFrame(() => {
    lightRefs.current.forEach((l, i) => {
      if (l) {
        l.intensity = isNight ? 2.5 : 0;
        l.visible = isNight;
      }
      const m = bulbMatRefs.current[i];
      if (m) {
        m.emissiveIntensity = isNight ? 3.5 : 0.4;
        m.color.set(isNight ? COLORS.streetLamp : '#888');
      }
    });
  });

  return (
    <group ref={groupRef} name="street-lights">
      {positions.map((p, i) => (
        <group
          key={i}
          position={[p.x, p.y - 6, p.z]}
          name={`lamp-${i}`}
        >
          <mesh position={[0, 3, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.12, 6, 6]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.5} />
          </mesh>

          <mesh position={[0.6, 6, 0]} rotation={[0, 0, Math.PI / 3]}>
            <cylinderGeometry args={[0.06, 0.06, 1.4, 6]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.5} />
          </mesh>

          <mesh position={[1.2, 6.4, 0]} castShadow>
            <sphereGeometry args={[0.28, 12, 12]} />
            <meshStandardMaterial
              ref={(el) => {
                bulbMatRefs.current[i] = el as unknown as THREE.MeshStandardMaterial;
              }}
              color={COLORS.streetLamp}
              emissive={COLORS.streetLamp}
              emissiveIntensity={isNight ? 3.5 : 0.4}
              roughness={0.3}
            />
          </mesh>

          <mesh position={[1.2, 6.55, 0]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.5, 0.4, 12]} />
            <meshStandardMaterial
              color={isNight ? '#ffeecc' : '#555'}
              transparent
              opacity={isNight ? 0.85 : 0.4}
              emissive={COLORS.streetLamp}
              emissiveIntensity={isNight ? 1.5 : 0}
              side={THREE.DoubleSide}
            />
          </mesh>

          <pointLight
            ref={(el) => {
              if (el) lightRefs.current[i] = el;
            }}
            position={[1.2, 6, 0]}
            color={COLORS.streetLamp}
            intensity={isNight ? 2.5 : 0}
            distance={65}
            decay={2}
            castShadow={i % 6 === 0 ? true : false}
            shadow-mapSize-width={512}
            shadow-mapSize-height={512}
            shadow-camera-near={1}
            shadow-camera-far={80}
          />
        </group>
      ))}
    </group>
  );
}
