import { Html } from '@react-three/drei';
import { useScheduleStore } from '../store/useScheduleStore';
import { LOADING_POINTS } from '../simulation/vehicleFactory';
import { fleetColor, materialColor, COLORS } from '../utils/colors';

function ExcavatorMesh({
  excavatorId,
  position,
  angle,
  armPitch,
  bucketOpen,
  material,
}: {
  excavatorId: string;
  position: [number, number, number];
  angle: number;
  armPitch: number;
  bucketOpen: number;
  material: string;
}) {
  return (
    <group position={position} name={`excavator-${excavatorId}`}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 1, 4]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.1, -2.2]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.4, 12]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      <group position={[0, 1.2, 0]} rotation={[0, angle, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[2.6, 1.2, 2.6]} />
          <meshStandardMaterial color={fleetColor('A')} roughness={0.5} metalness={0.4} />
        </mesh>

        <group
          position={[0, 0.6, 1.6]}
          rotation={[-armPitch - 0.2, 0, 0]}
        >
          <mesh position={[0, 0, 1.5]} castShadow>
            <boxGeometry args={[0.5, 0.5, 3]} />
            <meshStandardMaterial color="#555" roughness={0.5} metalness={0.5} />
          </mesh>

          <group
            position={[0, -0.3, 3]}
            rotation={[-0.4 + armPitch * 0.5, 0, 0]}
          >
            <mesh position={[0, 0, 1.2]} castShadow>
              <boxGeometry args={[0.4, 0.4, 2.4]} />
              <meshStandardMaterial color="#666" roughness={0.5} metalness={0.5} />
            </mesh>

            <group position={[0, -0.4, 2.6]} rotation={[bucketOpen * 0.4, 0, 0]}>
              <mesh castShadow>
                <boxGeometry args={[1.4, 0.3, 1.4]} />
                <meshStandardMaterial color="#888" roughness={0.5} metalness={0.6} />
              </mesh>
              <mesh position={[0, 0.5, 0.65]}>
                <boxGeometry args={[1.3, 0.8, 0.1]} />
                <meshStandardMaterial color="#999" />
              </mesh>
              <mesh position={[0, 0.5, -0.65]}>
                <boxGeometry args={[1.3, 0.8, 0.1]} />
                <meshStandardMaterial color="#999" />
              </mesh>
              <mesh position={[0, 0.9, 0]}>
                <boxGeometry args={[1.3, 0.1, 1.3]} />
                <meshStandardMaterial
                  color={materialColor(material)}
                  roughness={1}
                />
              </mesh>
            </group>
          </group>
        </group>

        <mesh position={[-1, 1.4, -0.6]}>
          <boxGeometry args={[0.5, 0.7, 1.2]} />
          <meshStandardMaterial color="#1a3b6b" metalness={0.2} roughness={0.3} />
        </mesh>
      </group>

      <mesh position={[-1.4, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.8, 0.25, 8, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[1.4, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.8, 0.25, 8, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
}

export function LoadingPoints() {
  const loadingPoints = useScheduleStore((s) => s.loadingPoints);
  const excavators = useScheduleStore((s) => s.excavators);
  const trucks = useScheduleStore((s) => s.trucks);

  return (
    <group name="loading-points">
      {LOADING_POINTS.map((lp) => {
        const state = loadingPoints[lp.id] || lp;
        const ex = excavators[lp.excavatorId];
        const queueLen = state.queue.length;
        const queueTrucks = state.queue.map((id) => trucks[id]).filter(Boolean);
        const totalCapacity = queueTrucks.reduce((s, t) => s + (t?.capacity || 0), 0);

        return (
          <group
            key={lp.id}
            position={[lp.position.x, lp.position.y, lp.position.z]}
            name={`lp-${lp.id}`}
          >
            <mesh position={[0, 0.04, 0]} receiveShadow>
              <cylinderGeometry args={[16, 16, 0.1, 32]} />
              <meshStandardMaterial
                color={COLORS.loadingZone}
                transparent
                opacity={0.5}
              />
            </mesh>
            <mesh position={[0, 0.06, 0]}>
              <ringGeometry args={[15.5, 16, 48]} />
              <meshBasicMaterial
                color={COLORS.accent}
                side={2}
                transparent
                opacity={0.7}
              />
            </mesh>

            <mesh position={[-14, 0.1, -14]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[5, 3]} />
              <meshBasicMaterial color={materialColor(lp.material)} />
            </mesh>

            {ex && (
              <ExcavatorMesh
                excavatorId={lp.excavatorId}
                position={[0, lp.position.y, 0]}
                angle={ex.swingAngle}
                armPitch={ex.armPitch}
                bucketOpen={ex.bucketOpen}
                material={lp.material}
              />
            )}

            <Html
              position={[0, 18, 0]}
              center
              distanceFactor={10}
              style={{ pointerEvents: 'none' }}
            >
              <div
                style={{
                  background: 'rgba(255,122,26,0.9)',
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
                <div>{lp.name}</div>
                <div style={{ fontSize: 11, opacity: 0.95, marginTop: 2 }}>
                  排队 {queueLen} 辆 | {totalCapacity} 吨 | 等待约 {state.avgWaitTime.toFixed(0)} 分
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
