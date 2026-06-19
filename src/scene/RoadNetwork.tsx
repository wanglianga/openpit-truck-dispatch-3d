import { useMemo } from 'react';
import * as THREE from 'three';
import { ROAD_SEGMENTS, ROAD_NODES, nodeMap, segmentMap } from '../simulation/roadData';
import { useScheduleStore } from '../store/useScheduleStore';
import { roadColor, congestionColor, COLORS } from '../utils/colors';

function RoadSegmentMesh({
  segmentId,
  showCongestion,
}: {
  segmentId: string;
  showCongestion: boolean;
}) {
  const seg = segmentMap()[segmentId];
  const nm = nodeMap();
  const a = nm[seg.from];
  const b = nm[seg.to];

  const { position, quaternion, length } = useMemo(() => {
    const va = new THREE.Vector3(a.x, a.y + 0.08, a.z);
    const vb = new THREE.Vector3(b.x, b.y + 0.08, b.z);
    const dir = new THREE.Vector3().subVectors(vb, va);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(va, vb).multiplyScalar(0.5);
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const dirNorm = dir.clone().normalize();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dirNorm);
    const temp = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    const cross = new THREE.Vector3().crossVectors(temp, up);
    const dot = temp.dot(up);
    const q2 = new THREE.Quaternion().setFromAxisAngle(
      cross.normalize(),
      Math.acos(dot)
    );
    q2.multiply(q);
    return { position: mid, quaternion: q2, length: len };
  }, [a.x, a.y, a.z, b.x, b.y, b.z]);

  const width = seg.level === 0 ? 12 : seg.level === 1 ? 10 : seg.level === 2 ? 7 : 5;
  const baseColor = roadColor(seg.level);

  const congestion = useScheduleStore((s) => {
    if (!showCongestion) return 0;
    return s.loadingPoints && s.schedulerState
      ? s.schedulerState['roadSegments']?.[segmentId]?.congestionLevel ?? seg.congestionLevel
      : seg.congestionLevel;
  });

  const arrows = useMemo(() => {
    const count = Math.max(1, Math.floor(length / 30));
    const arr: { t: number }[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({ t: (i + 0.5) / count });
    }
    return arr;
  }, [length]);

  return (
    <group>
      <mesh position={position} quaternion={quaternion} receiveShadow>
        <boxGeometry args={[width, 0.16, length + 0.5]} />
        <meshStandardMaterial color={baseColor} roughness={0.85} />
      </mesh>

      <mesh
        position={[position.x, position.y + 0.01, position.z]}
        quaternion={quaternion}
      >
        <boxGeometry args={[width * 0.9, 0.15, length + 0.5]} />
        <meshStandardMaterial
          color={showCongestion ? congestionColor(congestion) : baseColor}
          roughness={0.8}
          transparent
          opacity={showCongestion ? 0.55 : 0.95}
        />
      </mesh>

      <mesh
        position={[position.x, position.y + 0.02, position.z]}
        quaternion={quaternion}
      >
        <boxGeometry args={[0.15, 0.02, length + 0.5]} />
        <meshStandardMaterial color="#f0e0b0" emissive="#f0e0b0" emissiveIntensity={0.08} />
      </mesh>

      <mesh
        position={[position.x - width * 0.42, position.y + 0.03, position.z]}
        quaternion={quaternion}
      >
        <boxGeometry args={[0.08, 0.02, length + 0.5]} />
        <meshStandardMaterial color={COLORS.roadEdge} />
      </mesh>
      <mesh
        position={[position.x + width * 0.42, position.y + 0.03, position.z]}
        quaternion={quaternion}
      >
        <boxGeometry args={[0.08, 0.02, length + 0.5]} />
        <meshStandardMaterial color={COLORS.roadEdge} />
      </mesh>

      {seg.direction !== 'flat' && (
        <>
          {arrows.map((o, i) => {
            const t = seg.direction === 'up' ? o.t : 1 - o.t;
            const pos = new THREE.Vector3(
              a.x + (b.x - a.x) * t,
              a.y + (b.y - a.y) * t + 0.1,
              a.z + (b.z - a.z) * t
            );
            return (
              <mesh
                key={i}
                position={pos}
                quaternion={quaternion}
              >
                <coneGeometry args={[0.6, 1.4, 3]} />
                <meshStandardMaterial
                  color={seg.direction === 'up' ? '#ff7a1a' : '#29b6f6'}
                  emissive={seg.direction === 'up' ? '#ff7a1a' : '#29b6f6'}
                  emissiveIntensity={0.18}
                />
              </mesh>
            );
          })}
        </>
      )}

      {(seg.speedLimit <= 20 || seg.slope >= 8 || seg.dangerZone) && (
        <>
          {arrows.slice(0, Math.ceil(arrows.length / 2)).map((o, i) => {
            const t = o.t;
            const pos = new THREE.Vector3(
              a.x + (b.x - a.x) * t,
              a.y + (b.y - a.y) * t + 0.12,
              a.z + (b.z - a.z) * t
            );
            return (
              <mesh key={`sig-${i}`} position={pos}>
                <cylinderGeometry args={[0.05, 0.05, 2.2, 6]} />
                <meshStandardMaterial color="#555" />
              </mesh>
            );
          })}
        </>
      )}
    </group>
  );
}

export function RoadNetwork() {
  const showCongestion = useScheduleStore((s) => s.showCongestion);
  const segs = useMemo(() => ROAD_SEGMENTS.map((s) => s.id), []);
  const nm = useMemo(() => nodeMap(), []);

  return (
    <group name="road-network">
      {segs.map((sid) => (
        <RoadSegmentMesh key={sid} segmentId={sid} showCongestion={showCongestion} />
      ))}

      {ROAD_NODES.map((n) => (
        <mesh
          key={n.id}
          position={[nm[n.id].x, nm[n.id].y + 0.2, nm[n.id].z]}
        >
          <cylinderGeometry args={[1.2, 1.2, 0.1, 12]} />
          <meshStandardMaterial
            color={n.id.startsWith('LP') || n.id.startsWith('UA') ? '#ff7a1a' : '#aaa'}
            emissive={n.id.startsWith('LP') || n.id.startsWith('UA') ? '#ff7a1a' : '#000'}
            emissiveIntensity={n.id.startsWith('LP') || n.id.startsWith('UA') ? 0.3 : 0}
            roughness={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}
