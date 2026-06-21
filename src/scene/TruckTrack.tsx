import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScheduleStore } from '../store/useScheduleStore';
import { fleetColor } from '../utils/colors';
import { sampleTrackForRender } from '../simulation/scheduler';
import type { TrackSample } from '../simulation/types';

export function TruckTrack() {
  const lineGeomRef = useRef<THREE.BufferGeometry | null>(null);
  const replayGeomRef = useRef<THREE.BufferGeometry | null>(null);
  const dotsGroupRef = useRef<THREE.Group>(null);
  const lineColorRef = useRef<THREE.LineBasicMaterial | null>(null);
  const replayColorRef = useRef<THREE.LineBasicMaterial | null>(null);
  const sampledRef = useRef<TrackSample[]>([]);
  const startMeshRef = useRef<THREE.Mesh>(null);
  const endMeshRef = useRef<THREE.Mesh>(null);
  const containerRef = useRef<THREE.Group>(null);

  const lastActiveRef = useRef<{ id: string | null; trackHash: string; replayTime: number; isReplay: boolean }>({
    id: null,
    trackHash: '',
    replayTime: -1,
    isReplay: false,
  });

  const selectedId = useScheduleStore((s) => s.selectedTruckId);
  const hoveredId = useScheduleStore((s) => s.hoveredTruckId);
  const isReplayMode = useScheduleStore((s) => s.isReplayMode);
  const replayTruckId = useScheduleStore((s) => s.replayTruckId);

  useFrame(() => {
    const state = useScheduleStore.getState();
    const tracks = state.replayTracks;
    const activeNow = isReplayMode ? replayTruckId : selectedId || hoveredId;
    const activeTrack = activeNow ? tracks[activeNow] : undefined;
    const replayTimeNow = state.replayTime;
    const activeTruck = activeNow ? state.trucks[activeNow] : undefined;

    if (!activeTrack || !activeTruck || !activeNow) {
      if (containerRef.current) containerRef.current.visible = false;
      lastActiveRef.current = { id: null, trackHash: '', replayTime: -1, isReplay: false };
      return;
    }
    if (containerRef.current) containerRef.current.visible = true;

    const hash = `${activeTrack.length}-${activeTrack[activeTrack.length - 1]?.t || 0}-${activeTrack[0]?.t || 0}`;
    const trackChanged =
      lastActiveRef.current.id !== activeNow || lastActiveRef.current.trackHash !== hash;
    const replayChanged =
      isReplayMode &&
      Math.abs(lastActiveRef.current.replayTime - replayTimeNow) > 0.5;

    if (trackChanged) {
      const sampled = sampleTrackForRender(activeTrack, 400);
      const pts = sampled.map((p) => new THREE.Vector3(p.x, p.y + 0.15, p.z));

      if (!lineGeomRef.current) lineGeomRef.current = new THREE.BufferGeometry();
      lineGeomRef.current.setFromPoints(pts);
      sampledRef.current = sampled;

      const col = fleetColor(activeTruck.fleet);
      if (lineColorRef.current) lineColorRef.current.color.set(col);
      if (replayColorRef.current) replayColorRef.current.color.set(col);

      if (dotsGroupRef.current) {
        dotsGroupRef.current.clear();
        const step = Math.max(1, Math.floor(pts.length / 24));
        for (let i = 0; i < pts.length; i += step) {
          const p = pts[i];
          const m = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 8),
            new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.6 })
          );
          m.position.set(p.x, p.y + 0.3, p.z);
          dotsGroupRef.current.add(m);
        }
      }

      if (startMeshRef.current && pts.length > 1) {
        startMeshRef.current.position.set(pts[0].x, pts[0].y + 0.4, pts[0].z);
        startMeshRef.current.visible = true;
      }
      if (endMeshRef.current && pts.length > 1) {
        const last = pts[pts.length - 1];
        endMeshRef.current.position.set(last.x, last.y + 0.4, last.z);
        endMeshRef.current.visible = true;
      }
      lastActiveRef.current.id = activeNow;
      lastActiveRef.current.trackHash = hash;
    }

    if (trackChanged || replayChanged) {
      const sampled = sampledRef.current.length > 0
        ? sampledRef.current
        : sampleTrackForRender(activeTrack, 400);
      let replayEndIdx = sampled.length;
      if (isReplayMode) {
        for (let i = 0; i < sampled.length; i++) {
          if (sampled[i].t >= replayTimeNow) {
            replayEndIdx = i;
            break;
          }
        }
      }
      const replayed = sampled.slice(0, replayEndIdx).map(
        (p) => new THREE.Vector3(p.x, p.y + 0.15, p.z)
      );
      if (!replayGeomRef.current) replayGeomRef.current = new THREE.BufferGeometry();
      if (replayed.length > 1) replayGeomRef.current.setFromPoints(replayed);

      if (replayColorRef.current) {
        replayColorRef.current.opacity = isReplayMode ? 1 : 0;
        replayColorRef.current.visible = isReplayMode && replayed.length > 1;
      }
      lastActiveRef.current.replayTime = replayTimeNow;
      lastActiveRef.current.isReplay = isReplayMode;
    }
  });

  return (
    <group name="truck-track" ref={containerRef}>
      <line>
        <primitive object={lineGeomRef.current || new THREE.BufferGeometry()} attach="geometry" />
        <lineBasicMaterial
          ref={(m) => {
            if (m) lineColorRef.current = m;
          }}
          color="#ffffff"
          transparent
          opacity={0.35}
          linewidth={2}
        />
      </line>

      <line>
        <primitive object={replayGeomRef.current || new THREE.BufferGeometry()} attach="geometry" />
        <lineBasicMaterial
          ref={(m) => {
            if (m) replayColorRef.current = m;
          }}
          color="#ffffff"
          transparent
          opacity={0}
          linewidth={3}
        />
      </line>

      <group ref={dotsGroupRef} />

      <mesh ref={startMeshRef} visible={false}>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshBasicMaterial color="#43A047" transparent opacity={0.85} />
      </mesh>
      <mesh ref={endMeshRef} visible={false}>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshBasicMaterial color="#E53935" transparent opacity={0.85} />
      </mesh>
    </group>
  );
}
