import { useMemo } from 'react';
import * as THREE from 'three';
import { COLORS } from '../utils/colors';
import { terraces } from '../simulation/vehicleFactory';

export function MineTerrain() {
  const terraceInfo = useMemo(() => terraces(), []);

  const terraceMeshes = useMemo(() => {
    return terraceInfo.map((t, i) => {
      const outerGeom = new THREE.CylinderGeometry(
        t.outerR,
        t.outerR,
        0.5,
        48,
        1,
        false
      );
      const innerGeom = new THREE.CylinderGeometry(
        t.innerR,
        t.innerR,
        t === terraceInfo[0] ? 80 : 12.5,
        48,
        1,
        false
      );
      const innerWallGeom = new THREE.CylinderGeometry(
        t.innerR + 0.01,
        t.innerR + 0.01,
        t === terraceInfo[0] ? 80 : 12,
        48,
        1,
        true
      );
      return {
        outerGeom,
        innerGeom,
        innerWallGeom,
        innerR: t.innerR,
        outerR: t.outerR,
        y: t.y,
        index: i,
      };
    });
  }, [terraceInfo]);

  const bottomDisk = useMemo(() => {
    const t0 = terraceInfo[0];
    return new THREE.CylinderGeometry(t0.innerR, t0.innerR, 0.5, 48);
  }, [terraceInfo]);

  return (
    <group name="mine-terrain">
      <mesh
        position={[0, -40.25, 0]}
        receiveShadow
        castShadow
      >
        <cylinderGeometry args={[260, 260, 2, 64]} />
        <meshStandardMaterial color={COLORS.terrainTerraceDark} roughness={0.95} />
      </mesh>

      {terraceMeshes.map((m, i) => (
        <group key={i}>
          <mesh
            position={[0, m.y + 0.25, 0]}
            receiveShadow
          >
            <primitive object={m.outerGeom} attach="geometry" />
            <meshStandardMaterial
              color={i % 2 === 0 ? COLORS.terrainTerrace : COLORS.terrainTerraceDark}
              roughness={0.9}
            />
          </mesh>

          <mesh
            position={[0, m.y + 6.5, 0]}
            receiveShadow
          >
            <primitive object={m.innerWallGeom} attach="geometry" />
            <meshStandardMaterial
              color={COLORS.terrainSlope}
              roughness={1}
              side={THREE.DoubleSide}
            />
          </mesh>

          {m.index === 0 && (
            <mesh
              position={[0, -80.25, 0]}
              receiveShadow
            >
              <primitive object={bottomDisk} attach="geometry" />
              <meshStandardMaterial color={COLORS.terrainBottom} roughness={1} />
            </mesh>
          )}

          {[0, 1, 2, 3, 4, 5, 6, 7].map((s) => {
            const angle = (s / 8) * Math.PI * 2;
            const rampR = (m.innerR + m.outerR) / 2 + 0.3;
            return (
              <mesh
                key={`mark-${i}-${s}`}
                position={[
                  Math.cos(angle) * rampR,
                  m.y + 0.6,
                  Math.sin(angle) * rampR,
                ]}
                rotation={[0, -angle, 0]}
                receiveShadow
              >
                <boxGeometry args={[2.4, 0.12, 0.25]} />
                <meshStandardMaterial
                  color={i % 2 === 0 ? '#d4b87a' : '#a68b5a'}
                  roughness={0.7}
                  emissive={i % 4 === 0 ? '#ff7a1a' : '#000000'}
                  emissiveIntensity={i % 4 === 0 ? 0.2 : 0}
                />
              </mesh>
            );
          })}
        </group>
      ))}

      <mesh position={[0, -80, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[16, 32]} />
        <meshStandardMaterial color="#2a2014" roughness={1} />
      </mesh>
    </group>
  );
}
