import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { TruckMesh } from './Truck';
import { useScheduleStore, useVisibleTruckIds } from '../store/useScheduleStore';
import { fleetColor } from '../utils/colors';
import type { Truck as TruckT } from '../simulation/types';

const HIGH_COUNT = 22;
const MEDIUM_COUNT = 65;
const TOTAL_RENDERED = HIGH_COUNT + MEDIUM_COUNT;

function LowDetailFleet() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorBuf = useRef<Float32Array | null>(null);

  useFrame(() => {
    if (!ref.current) return;
    const mesh = ref.current;
    const state = useScheduleStore.getState();
    const allTrucks = state.trucks;
    const fleetFilter = state.fleetFilter;
    const materialFilter = state.materialFilter;
    const camPos = new THREE.Vector3(0, 80, 200);

    const visibleEntries: { t: TruckT; d: number }[] = [];
    for (const id in allTrucks) {
      const t = allTrucks[id];
      if (!t) continue;
      if (fleetFilter !== 'all' && t.fleet !== fleetFilter) continue;
      if (materialFilter !== 'all') {
        if (materialFilter === 'coal' && t.material !== 'coal' && t.material !== null) continue;
        if (materialFilter === 'ore' && t.material !== 'ore') continue;
        if (materialFilter === 'waste' && t.material !== 'waste') continue;
      }
      const dx = t.position.x - camPos.x;
      const dy = t.position.y - camPos.y;
      const dz = t.position.z - camPos.z;
      visibleEntries.push({ t, d: dx * dx + dy * dy + dz * dz });
    }
    visibleEntries.sort((a, b) => a.d - b.d);
    const lowSlice = visibleEntries.slice(TOTAL_RENDERED);
    if (mesh.count !== lowSlice.length) {
      mesh.count = Math.max(1, lowSlice.length);
      if (!colorBuf.current || colorBuf.current.length < lowSlice.length * 3) {
        colorBuf.current = new Float32Array(Math.max(lowSlice.length, 1) * 3);
      }
    }
    lowSlice.forEach((entry, i) => {
      const t = entry.t;
      dummy.position.set(t.position.x, t.position.y + 1.2, t.position.z);
      dummy.rotation.set(0, t.heading, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      const c = new THREE.Color(fleetColor(t.fleet));
      mesh.setColorAt?.(i, c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      (mesh.instanceColor as THREE.InstancedBufferAttribute).needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, 1]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[2.5, 2.3, 5]} />
      <meshStandardMaterial roughness={0.7} />
    </instancedMesh>
  );
}

interface ManagedTruckInnerProps {
  truckId: string;
  isNight: boolean;
  selected: boolean;
  hovered: boolean;
  registerRef: (id: string, g: THREE.Group | null) => void;
}

function ManagedTruckInner({
  truckId,
  isNight,
  selected,
  hovered,
  registerRef,
}: ManagedTruckInnerProps) {
  const grpRef = useRef<THREE.Group>(null);
  const initTruck = useScheduleStore.getState().trucks[truckId];

  useEffect(() => {
    registerRef(truckId, grpRef.current);
    return () => registerRef(truckId, null);
  }, [truckId, registerRef]);

  return (
    <group ref={grpRef}>
      <TruckMesh
        truck={initTruck}
        isNight={isNight}
        selected={selected}
        hovered={hovered}
        staticTruckId={truckId}
      />
    </group>
  );
}

export function TruckFleet() {
  const { camera } = useThree();
  const selectedId = useScheduleStore((s) => s.selectedTruckId);
  const hoveredId = useScheduleStore((s) => s.hoveredTruckId);
  const isNight = useScheduleStore((s) => s.isNight);
  const setHovered = useScheduleStore((s) => s.setHoveredTruck);
  const setSelected = useScheduleStore((s) => s.setSelectedTruck);

  const visibleIds = useVisibleTruckIds();

  const renderedIds = useMemo(() => {
    const allTrucks = useScheduleStore.getState().trucks;
    const cx = camera.position.x;
    const cy = camera.position.y;
    const cz = camera.position.z;
    const entries = visibleIds
      .map((id) => {
        const t = allTrucks[id];
        if (!t) return null;
        const dx = t.position.x - cx;
        const dy = t.position.y - cy;
        const dz = t.position.z - cz;
        return { id, d: dx * dx + dy * dy + dz * dz };
      })
      .filter(Boolean) as { id: string; d: number }[];
    entries.sort((a, b) => a.d - b.d);
    return entries.slice(0, TOTAL_RENDERED).map((e) => e.id);
  }, [camera.position.x, camera.position.y, camera.position.z, visibleIds]);

  const truckGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  const registerRef = (id: string, g: THREE.Group | null) => {
    if (g) truckGroupsRef.current.set(id, g);
    else truckGroupsRef.current.delete(id);
  };
  const registerRefMemo = useMemo(() => registerRef, []);

  useFrame(() => {
    const state = useScheduleStore.getState();
    const allTrucks = state.trucks;
    const fleetFilterNow = state.fleetFilter;
    const materialFilterNow = state.materialFilter;
    const cx = camera.position.x;
    const cy = camera.position.y;
    const cz = camera.position.z;

    const bucketMap = new Map<string, 'high' | 'medium' | 'low'>();
    const distEntries: { id: string; d: number }[] = [];
    for (const id in allTrucks) {
      const t = allTrucks[id];
      if (!t) continue;
      if (fleetFilterNow !== 'all' && t.fleet !== fleetFilterNow) continue;
      if (materialFilterNow !== 'all') {
        if (materialFilterNow === 'coal' && t.material !== 'coal' && t.material !== null) continue;
        if (materialFilterNow === 'ore' && t.material !== 'ore') continue;
        if (materialFilterNow === 'waste' && t.material !== 'waste') continue;
      }
      const dx = t.position.x - cx;
      const dy = t.position.y - cy;
      const dz = t.position.z - cz;
      distEntries.push({ id, d: dx * dx + dy * dy + dz * dz });
    }
    distEntries.sort((a, b) => a.d - b.d);
    for (let i = 0; i < distEntries.length; i++) {
      if (i < HIGH_COUNT) bucketMap.set(distEntries[i].id, 'high');
      else if (i < TOTAL_RENDERED) bucketMap.set(distEntries[i].id, 'medium');
      else bucketMap.set(distEntries[i].id, 'low');
    }

    truckGroupsRef.current.forEach((grp, id) => {
      const t = allTrucks[id];
      if (!t || !grp) return;
      grp.position.set(t.position.x, t.position.y, t.position.z);
      grp.rotation.y = t.heading;
      grp.visible = bucketMap.has(id) && bucketMap.get(id) !== 'low';
      grp.userData._lodBucket = bucketMap.get(id);
    });
  });

  const onPointerOver = (id: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(id);
    document.body.style.cursor = 'pointer';
  };
  const onPointerOut = () => {
    setHovered(null);
    document.body.style.cursor = '';
  };
  const onClick = (id: string) => (e: ThreeEvent<PointerEvent>) => {
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
      {renderedIds.map((id) => (
        <group
          key={id}
          onPointerOver={onPointerOver(id)}
          onPointerOut={onPointerOut}
          onClick={onClick(id)}
        >
          <ManagedTruckInner
            truckId={id}
            isNight={isNight}
            selected={selectedId === id}
            hovered={hoveredId === id}
            registerRef={registerRefMemo}
          />
        </group>
      ))}
      <LowDetailFleet />
    </group>
  );
}
