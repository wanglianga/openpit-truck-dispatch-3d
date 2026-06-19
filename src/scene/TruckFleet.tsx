import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TruckMesh } from './Truck';
import { useScheduleStore, visibleTruckIdsSelector } from '../store/useScheduleStore';
import { fleetColor } from '../utils/colors';
import type { Fleet, Truck as TruckT } from '../simulation/types';

function LowDetailFleet({ trucks }: { trucks: TruckT[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!ref.current) return;
    const mesh = ref.current;
    trucks.forEach((t, i) => {
      dummy.position.set(t.position.x, t.position.y + 1.2, t.position.z);
      dummy.rotation.set(0, t.heading, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      const c = new THREE.Color(fleetColor(t.fleet));
      mesh.setColorAt?.(i, c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, trucks.length]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[2.5, 2.3, 5]} />
      <meshStandardMaterial roughness={0.7} />
    </instancedMesh>
  );
}

export function TruckFleet() {
  const { camera } = useThree();
  const trucks = useScheduleStore((s) => s.trucks);
  const selectedId = useScheduleStore((s) => s.selectedTruckId);
  const hoveredId = useScheduleStore((s) => s.hoveredTruckId);
  const isNight = useScheduleStore((s) => s.isNight);
  const visibleIds = useScheduleStore(visibleTruckIdsSelector);
  const setHovered = useScheduleStore((s) => s.setHoveredTruck);
  const setSelected = useScheduleStore((s) => s.setSelectedTruck);

  const byDistance = useMemo(() => {
    const cam = camera.position;
    const arr = visibleIds
      .map((id) => trucks[id])
      .filter(Boolean)
      .map((t) => {
        const dx = t.position.x - cam.x;
        const dy = t.position.y - cam.y;
        const dz = t.position.z - cam.z;
        return { t, d: Math.sqrt(dx * dx + dy * dy + dz * dz) };
      })
      .sort((a, b) => a.d - b.d);
    return arr;
  }, [visibleIds, trucks, camera.position.x, camera.position.y, camera.position.z]);

  const HIGH_MAX = 22;
  const MEDIUM_MAX = 65;
  const highTrucks = byDistance.slice(0, HIGH_MAX).map((x) => x.t);
  const mediumTrucks = byDistance.slice(HIGH_MAX, HIGH_MAX + MEDIUM_MAX).map((x) => x.t);
  const lowTrucks = byDistance.slice(HIGH_MAX + MEDIUM_MAX).map((x) => x.t);

  const allHighIds = useMemo(() => new Set(highTrucks.map((t) => t.id)), [highTrucks]);
  const allMediumIds = useMemo(() => new Set(mediumTrucks.map((t) => t.id)), [mediumTrucks]);
  const allLowIds = useMemo(() => new Set(lowTrucks.map((t) => t.id)), [lowTrucks]);

  const onPointerOver = (id: string) => (e: any) => {
    e.stopPropagation();
    setHovered(id);
    document.body.style.cursor = 'pointer';
  };
  const onPointerOut = () => {
    setHovered(null);
    document.body.style.cursor = '';
  };
  const onClick = (id: string) => (e: any) => {
    e.stopPropagation();
    setSelected(selectedId === id ? null : id);
  };

  return (
    <group
      name="truck-fleet"
      onPointerMissed={(e) => {
        if (e.button === 0) {
          setSelected(null);
          setHovered(null);
        }
      }}
    >
      {highTrucks.map((t) => (
        <group
          key={t.id}
          onPointerOver={onPointerOver(t.id)}
          onPointerOut={onPointerOut}
          onClick={onClick(t.id)}
        >
          <TruckMesh
            truck={t}
            isNight={isNight}
            selected={selectedId === t.id}
            hovered={hoveredId === t.id}
          />
        </group>
      ))}

      {mediumTrucks.map((t) => (
        <group
          key={t.id}
          onPointerOver={onPointerOver(t.id)}
          onPointerOut={onPointerOut}
          onClick={onClick(t.id)}
        >
          <TruckMesh
            truck={t}
            isNight={isNight}
            selected={selectedId === t.id}
            hovered={hoveredId === t.id}
          />
        </group>
      ))}

      {lowTrucks.length > 0 && (
        <group
          onPointerMissed={() => {}}
        >
          <LowDetailFleet trucks={lowTrucks} />
        </group>
      )}
    </group>
  );
}
