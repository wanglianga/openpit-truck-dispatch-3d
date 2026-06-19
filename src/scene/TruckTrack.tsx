import { useMemo } from 'react';
import * as THREE from 'three';
import { useScheduleStore } from '../store/useScheduleStore';
import { sampleTrack } from '../utils/lod';
import { fleetColor } from '../utils/colors';
import { sampleTrackForRender } from '../simulation/scheduler';

export function TruckTrack() {
  const selectedId = useScheduleStore((s) => s.selectedTruckId);
  const hoveredId = useScheduleStore((s) => s.hoveredTruckId);
  const trucks = useScheduleStore((s) => s.trucks);
  const tracks = useScheduleStore((s) => s.replayTracks);
  const isReplayMode = useScheduleStore((s) => s.isReplayMode);
  const replayTruckId = useScheduleStore((s) => s.replayTruckId);
  const replayTime = useScheduleStore((s) => s.replayTime);

  const activeId = isReplayMode ? replayTruckId : selectedId || hoveredId;
  const activeTrack = activeId ? tracks[activeId] : undefined;
  const activeTruck = activeId ? trucks[activeId] : undefined;

  const { positions, replayPositions, color } = useMemo(() => {
    if (!activeTrack || !activeTruck) {
      return { positions: null, replayPositions: null, color: '#fff' };
    }
    const sampled = sampleTrackForRender(activeTrack, 400);
    const pts = sampled.map(
      (p) => new THREE.Vector3(p.x, p.y + 0.15, p.z)
    );
    let replayEndIdx = sampled.length;
    if (isReplayMode) {
      for (let i = 0; i < sampled.length; i++) {
        if (sampled[i].t >= replayTime) {
          replayEndIdx = i;
          break;
        }
      }
    }
    const replayed = pts.slice(0, replayEndIdx);
    return {
      positions: pts,
      replayPositions: replayed,
      color: fleetColor(activeTruck.fleet),
    };
  }, [activeTrack, activeTruck, isReplayMode, replayTime]);

  if (!positions) return null;

  const lineGeom = new THREE.BufferGeometry().setFromPoints(positions);
  const replayGeom = replayPositions
    ? new THREE.BufferGeometry().setFromPoints(replayPositions)
    : null;

  return (
    <group name="truck-track">
      <line>
        <primitive object={lineGeom} attach="geometry" />
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.35}
          linewidth={2}
        />
      </line>

      {isReplayMode && replayGeom && replayPositions && replayPositions.length > 1 && (
        <line>
          <primitive object={replayGeom} attach="geometry" />
          <lineBasicMaterial
            color={color}
            transparent
            opacity={1}
            linewidth={3}
          />
        </line>
      )}

      {positions.filter((_, i) => i % Math.max(1, Math.floor(positions.length / 24)) === 0).map((p, i) => (
        <mesh
          key={i}
          position={[p.x, p.y + 0.3, p.z]}
        >
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
      ))}

      {positions.length > 1 && (
        <>
          <mesh position={[positions[0].x, positions[0].y + 0.4, positions[0].z]}>
            <sphereGeometry args={[0.6, 12, 12]} />
            <meshBasicMaterial color="#43A047" transparent opacity={0.85} />
          </mesh>
          <mesh position={[positions[positions.length - 1].x, positions[positions.length - 1].y + 0.4, positions[positions.length - 1].z]}>
            <sphereGeometry args={[0.6, 12, 12]} />
            <meshBasicMaterial color="#E53935" transparent opacity={0.85} />
          </mesh>
        </>
      )}
    </group>
  );
}
