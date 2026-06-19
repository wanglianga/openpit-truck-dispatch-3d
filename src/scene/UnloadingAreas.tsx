import { Html } from '@react-three/drei';
import { useScheduleStore } from '../store/useScheduleStore';
import { UNLOADING_AREAS } from '../simulation/vehicleFactory';
import { materialColor, COLORS } from '../utils/colors';

export function UnloadingAreas() {
  const unloadingAreas = useScheduleStore((s) => s.unloadingAreas);
  const trucks = useScheduleStore((s) => s.trucks);

  return (
    <group name="unloading-areas">
      {UNLOADING_AREAS.map((ua) => {
        const state = unloadingAreas[ua.id] || ua;
        const queueLen = state.queue.length;
        const queueTrucks = state.queue.map((id) => trucks[id]).filter(Boolean);
        const totalLoad = queueTrucks.reduce((s, t) => s + (t?.load || 0), 0);

        return (
          <group
            key={ua.id}
            position={[ua.position.x, ua.position.y, ua.position.z]}
            name={`ua-${ua.id}`}
          >
            <mesh position={[0, 0.04, 0]} receiveShadow>
              <boxGeometry args={[28, 0.1, 20]} />
              <meshStandardMaterial
                color={COLORS.unloadingZone}
                transparent
                opacity={0.5}
              />
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
                    <meshStandardMaterial
                      color="#1a2838"
                      metalness={0.3}
                      roughness={0.4}
                    />
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
              >
                <div>{ua.name}</div>
                <div style={{ fontSize: 11, opacity: 0.95, marginTop: 2 }}>
                  排队 {queueLen} 辆 | {totalLoad.toFixed(0)} 吨待卸 | 等待约 {state.avgWaitTime.toFixed(0)} 分
                </div>
                <div style={{ fontSize: 10, marginTop: 2 }}>
                  接收：{ua.accepts.map((m) => (m === 'coal' ? '煤' : m === 'ore' ? '矿石' : '废石')).join('/')}
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
