import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useScheduleStore } from '../store/useScheduleStore';
import { COLORS } from '../utils/colors';
import type { PresetView } from '../simulation/types';

const PRESETS: Record<PresetView, { pos: [number, number, number]; target: [number, number, number] }> = {
  perspective: { pos: [200, 160, 200], target: [0, 10, 0] },
  top: { pos: [0, 400, 0.1], target: [0, 0, 0] },
  road: { pos: [140, 80, 140], target: [40, 20, 40] },
  closeup: { pos: [80, 50, 80], target: [0, 0, 0] },
};

function LerpCam({ preset }: { preset: PresetView }) {
  const { camera, controls } = useThree() as any;
  const currentTarget = useRef({ pos: new THREE.Vector3(...PRESETS.perspective.pos), tgt: new THREE.Vector3(...PRESETS.perspective.target) });

  useFrame((_, delta) => {
    const p = PRESETS[preset];
    const targetPos = new THREE.Vector3(...p.pos);
    const targetTgt = new THREE.Vector3(...p.target);
    currentTarget.current.pos.lerp(targetPos, Math.min(1, delta * 1.8));
    currentTarget.current.tgt.lerp(targetTgt, Math.min(1, delta * 1.8));
    camera.position.copy(currentTarget.current.pos);
    if (controls?.target) {
      controls.target.copy(currentTarget.current.tgt);
      controls.update?.();
    }
  });
  return null;
}

export function DayNightCycle() {
  const isNight = useScheduleStore((s) => s.isNight);
  const preset = useScheduleStore((s) => s.presetView);
  const transitionRef = useRef(1);
  const { scene } = useThree();

  const sunPos = useMemo(() => {
    const base = isNight ? [-80, -10, -80] : [100, 80, 80];
    return base as [number, number, number];
  }, [isNight]);

  useFrame((_, delta) => {
    const target = isNight ? 0 : 1;
    transitionRef.current += (target - transitionRef.current) * Math.min(1, delta * 1.8);
    const t = transitionRef.current;

    if (scene.fog instanceof THREE.Fog) {
      const c1 = new THREE.Color(COLORS.dayFog);
      const c2 = new THREE.Color(COLORS.nightFog);
      scene.fog.color.lerpColors(c2, c1, t);
    }
    if (scene.background instanceof THREE.Color) {
      const c1 = new THREE.Color(COLORS.daySky);
      const c2 = new THREE.Color(COLORS.nightSky);
      scene.background.lerpColors(c2, c1, t);
    }
  });

  const ambientIntensity = 0.12 + transitionRef.current * 0.28;
  const hemiIntensity = transitionRef.current * 0.45;
  const dirIntensity = transitionRef.current * 1.15 + 0.05;
  const starsOpacity = Math.max(0, 1 - transitionRef.current * 1.5);

  return (
    <>
      <LerpCam preset={preset} />

      {!isNight && transitionRef.current > 0.3 && (
        <Sky
          distance={450000}
          sunPosition={sunPos}
          inclination={0.48}
          azimuth={0.25}
          turbidity={4}
          rayleigh={1.2}
        />
      )}
      {transitionRef.current < 0.95 && (
        <Stars
          radius={200}
          depth={60}
          count={4000}
          factor={5}
          saturation={0}
          fade
          speed={0.6}
        />
      )}

      <ambientLight intensity={ambientIntensity} color={isNight ? '#7080a0' : '#ffffff'} />
      <hemisphereLight
        args={[isNight ? '#2a3a5a' : '#88b7e5', isNight ? '#1a1a1a' : '#8a7258', hemiIntensity]}
      />

      <directionalLight
        position={sunPos}
        intensity={dirIntensity}
        color={isNight ? '#6078a0' : '#fff8e0'}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-250}
        shadow-camera-right={250}
        shadow-camera-top={250}
        shadow-camera-bottom={-250}
        shadow-camera-near={1}
        shadow-camera-far={800}
        shadow-bias={-0.00015}
      />
    </>
  );
}
