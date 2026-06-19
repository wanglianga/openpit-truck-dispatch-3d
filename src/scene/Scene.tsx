import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, FXAA } from '@react-three/postprocessing';
import { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { MineTerrain } from './MineTerrain';
import { RoadNetwork } from './RoadNetwork';
import { LoadingPoints } from './LoadingPoints';
import { UnloadingAreas } from './UnloadingAreas';
import { DangerZones } from './DangerZones';
import { StreetLights } from './StreetLights';
import { TruckFleet } from './TruckFleet';
import { TruckTrack } from './TruckTrack';
import { DayNightCycle } from './DayNightCycle';
import { useScheduleStore } from '../store/useScheduleStore';
import { COLORS } from '../utils/colors';

function SimulationDriver() {
  const tickSim = useScheduleStore((s) => s.tickSim);
  const addFps = useScheduleStore((s) => s.addFps);
  const isReplay = useScheduleStore((s) => s.isReplayMode);
  const isPlaying = useScheduleStore((s) => s.isPlaying);
  const replaySpeed = useScheduleStore((s) => s.replaySpeed);
  const setReplayTime = useScheduleStore((s) => s.setReplayTime);
  const replayTime = useScheduleStore((s) => s.replayTime);
  const replayDuration = useScheduleStore((s) => s.replayDuration);
  const tickRef = useRef(0);
  const fpsRef = useRef({ last: performance.now(), frames: 0 });

  useFrame((_, delta) => {
    tickRef.current += delta * 1000;
    fpsRef.current.frames++;
    const now = performance.now();
    if (now - fpsRef.current.last >= 500) {
      const fps = (fpsRef.current.frames * 1000) / (now - fpsRef.current.last);
      addFps(fps);
      fpsRef.current.frames = 0;
      fpsRef.current.last = now;
    }
    if (!isReplay && tickRef.current >= 50) {
      const ticks = Math.min(3, Math.floor(tickRef.current / 50));
      for (let i = 0; i < ticks; i++) tickSim();
      tickRef.current -= ticks * 50;
    }
    if (isReplay && isPlaying) {
      const next = Math.min(replayDuration, replayTime + delta * replaySpeed * 12);
      setReplayTime(next);
    }
  });
  return null;
}

function FogSetter() {
  const { scene } = useThree() as any;
  const isNight = useScheduleStore((s) => s.isNight);
  useEffect(() => {
    scene.fog = new THREE.Fog(isNight ? COLORS.nightFog : COLORS.dayFog, 80, 520);
    scene.background = new THREE.Color(isNight ? COLORS.nightSky : COLORS.daySky);
  }, [scene, isNight]);
  return null;
}

import { useThree } from '@react-three/fiber';

function SceneInner() {
  const isNight = useScheduleStore((s) => s.isNight);
  return (
    <>
      <FogSetter />
      <SimulationDriver />
      <DayNightCycle />

      <Suspense fallback={null}>
        <MineTerrain />
        <RoadNetwork />
        <LoadingPoints />
        <UnloadingAreas />
        <DangerZones />
        <StreetLights />
        <TruckFleet />
        <TruckTrack />
      </Suspense>

      <EffectComposer>
        <FXAA />
        <Bloom
          intensity={isNight ? 1.1 : 0.55}
          luminanceThreshold={0.78}
          luminanceSmoothing={0.35}
          mipmapBlur
          radius={0.5}
        />
      </EffectComposer>
    </>
  );
}

export function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
        powerPreference: 'high-performance',
      }}
      style={{ position: 'absolute', inset: 0, background: COLORS.bg }}
    >
      <PerspectiveCamera
        makeDefault
        position={[200, 160, 200]}
        fov={55}
        near={0.5}
        far={1200}
      />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={25}
        maxDistance={500}
        maxPolarAngle={Math.PI / 2 - 0.04}
        target={[0, 10, 0]}
        makeDefault
      />
      <SceneInner />
    </Canvas>
  );
}
