import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useScheduleStore } from '../store/useScheduleStore';
import { UNLOADING_AREAS } from '../simulation/vehicleFactory';
import { materialColor, COLORS } from '../utils/colors';

export function UnloadingAreas() {
  const htmlRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const setHtmlRef = (id: string) => (d: HTMLDivElement | null) => {
    htmlRefs.current[id] = d;
  };

  useFrame(() => {
    const state = useScheduleStore.getState();
    const { unloadingAreas, trucks } = state;
    for (const ua of UNLOADING_AREAS) {
      const s = unloadingAreas[ua.id] || ua;
      const d = htmlRefs.current[ua.id];
      if (!d) continue;
      const queueLen = s.queue.length;
      const queueTrucks = s.queue.map((id) => trucks[id]).filter(Boolean);
      const totalLoad = queueTrucks.reduce((sum, t) => sum + (t?.load || 0), 0);
      const accepts = ua.accepts.map((m) => (m === 'coal' ? '煤' : m === 'ore' ? '矿石' : '废石')).join('/');
      d.innerHTML = `
        <div>${ua.name}</div>
        <div style="font-size:11px;opacity:0.95;margin-top:2px;">
          排队 ${queueLen} 辆 | ${totalLoad.toFixed(0)} 吨待卸 | 等待约 ${s.avgWaitTime.toFixed(0)} 分
        </div>
        <div style="font-size:10px;margin-top:2px;">接收：${accepts}</div>
      `;
    }
  });

  return (
    <group name="unloading-areas">
      {UNLOADING_AREAS.map((ua) => (
        <group
          key={ua.id}
          position={[ua.position.x, ua.position.y, ua.position.z]}
          name={`ua-${ua.id}`}
        >
          <mesh position={[0, 0.04, 0]} receiveShadow>
            <boxGeometry args={[28, 0.1, 20]} />
            <meshStandardMaterial color={COLORS.unloadingZone} transparent opacity={0.5} />
          </mesh>

          <mesh position={[0, 0.06, 10]}>
            <boxGeometry args={[28, 0.1, 0.3]} />
            <meshBasicMaterial color="#29b6f6" transparent opacity={0.8} />
          </mesh>
          <mesh position={[0, 0.06, -10]}>
            <boxGeometry args={[28, 0.1, 0.3]} />
            <meshBasicMaterial color="#29b6f6" transparent opacity={0.8} />
          </mesh>
          <mesh position={[14, 0.06, 0]}>
            <boxGeometry args={[0.3, 0.1, 20]} />
            <meshBasicMaterial color="#29b6f6" transparent opacity={0.8} />
          </mesh>
          <mesh position={[-14, 0.06, 0]}>
            <boxGeometry args={[0.3, 0.1, 20]} />
            <meshBasicMaterial color="#29b6f6" transparent opacity={0.8} />
          </mesh>

          {[0, 1, 2, 3].map((i) => {
            const offset = (i - 1.5) * 6;
            return (
              <group key={i} position={[offset, 0, -6]}>
                <mesh position={[0, 2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[2.5, 4, 0.6]} />
                  <meshStandardMaterial color="#6a5a45" roughness={0.9} />
                </mesh>
                <mesh position={[0, 4.3, 0]} castShadow>
                  <boxGeometry args={[3.5, 0.4, 1]} />
                  <meshStandardMaterial color="#3d3020" />
                </mesh>
                <mesh position={[0, 3, 0.32]}>
                  <boxGeometry args={[2, 1.6, 0.05]} />
                  <meshStandardMaterial color="#1a2838" metalness={0.3} roughness={0.4} />
                </mesh>
              </group>
            );
          })}

          <group position={[-8, 0, 4]}>
            <mesh position={[0, 3, 0]} castShadow>
              <cylinderGeometry args={[1.5, 1.8, 6, 12]} />
              <meshStandardMaterial color="#5a6a7a" metalness={0.5} roughness={0.5} />
            </mesh>
            <mesh position={[0, 6.2, 0]} castShadow>
              <coneGeometry args={[2, 1.5, 12]} />
              <meshStandardMaterial color="#3d4a5a" />
            </mesh>
          </group>

          <mesh position={[14, 0.1, -10]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[8, 4]} />
            <meshStandardMaterial color={materialColor(ua.accepts[0])} />
          </mesh>

          <Html
            position={[0, 22, 0]}
            center
            distanceFactor={10}
            style={{ pointerEvents: 'none' }}
          >
            <div
              ref={setHtmlRef(ua.id)}
              style={{
                background: 'rgba(41,182,246,0.92)',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: 6,
                border: '2px solid rgba(255,255,255,0.5)',
                fontFamily: 'Noto Sans SC, sans-serif',
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
            />
          </Html>
        </group>
      ))}
    </group>
  );
}
