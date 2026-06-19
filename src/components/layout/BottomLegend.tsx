import {
  Layers,
  Car,
  AlertTriangle,
  Activity,
  Mountain,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { COLORS, roadColor, fleetColor, materialColor, congestionColor } from '../../utils/colors';

const ROAD_LEVELS = [
  { level: 0, name: '主运输道', desc: '限速 30km/h' },
  { level: 1, name: '次运输道', desc: '限速 25km/h' },
  { level: 2, name: '连接支路', desc: '限速 20km/h' },
  { level: 3, name: '工作面路', desc: '限速 10km/h' },
];

const CONGESTIONS = [
  { level: 0, name: '畅通', desc: '> 25 km/h' },
  { level: 1, name: '缓行', desc: '15 ~ 25 km/h' },
  { level: 2, name: '拥堵', desc: '5 ~ 15 km/h' },
  { level: 3, name: '堵塞', desc: '< 5 km/h' },
];

export function BottomLegend() {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 p-3 pointer-events-none">
      <div className="max-w-[1800px] mx-auto flex items-end justify-between gap-3 pointer-events-auto">
        <div className="glass-panel rounded-lg px-4 py-2.5 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 pr-3 border-r border-white/10">
            <Layers size={13} className="text-orange-300" />
            <span className="text-white/65 text-[10.5px] font-semibold uppercase tracking-wider">
              道路层级
            </span>
          </div>
          {ROAD_LEVELS.map((r) => (
            <div key={r.level} className="flex items-center gap-1.5 group cursor-help">
              <div
                className="w-7 h-3 rounded-sm"
                style={{
                  background: roadColor(r.level),
                  boxShadow: `inset 0 -1px 0 ${COLORS.roadEdge}`,
                }}
              />
              <div className="leading-tight">
                <div className="text-[10px] text-white/80 font-medium">{r.name}</div>
                <div className="text-[9px] text-white/40 group-hover:text-white/60 transition">
                  {r.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-panel rounded-lg px-4 py-2.5 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 pr-3 border-r border-white/10">
            <Mountain size={13} className="text-amber-300" />
            <span className="text-white/65 text-[10.5px] font-semibold uppercase tracking-wider">
              坡道方向
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowUp size={12} className="text-orange-400" />
            <span className="text-[10.5px] text-white/75">上坡</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowDown size={12} className="text-sky-400" />
            <span className="text-[10.5px] text-white/75">下坡</span>
          </div>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <div className="flex items-center gap-2 pr-2 border-r border-white/10">
            <Car size={12} className="text-sky-300" />
            <span className="text-white/65 text-[10.5px] font-semibold uppercase tracking-wider">
              车队
            </span>
          </div>
          {(['A', 'B', 'C', 'D'] as const).map((f) => (
            <div key={f} className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded-sm"
                style={{
                  background: fleetColor(f),
                  boxShadow: `0 0 5px ${fleetColor(f)}66`,
                }}
              />
              <span className="text-[10.5px] text-white/75 font-medium">{f}队</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 items-end">
          <div className="glass-panel rounded-lg px-4 py-2 flex items-center gap-3">
            <div className="flex items-center gap-2 pr-3 border-r border-white/10">
              <Activity size={12} className="text-green-300" />
              <span className="text-white/65 text-[10.5px] font-semibold uppercase tracking-wider">
                拥堵
              </span>
            </div>
            {CONGESTIONS.map((c) => (
              <div key={c.level} className="flex items-center gap-1.5">
                <div
                  className="w-5 h-2.5 rounded-sm"
                  style={{
                    background: congestionColor(c.level),
                    boxShadow: `0 0 4px ${congestionColor(c.level)}55`,
                  }}
                />
                <span className="text-[10px] text-white/75">{c.name}</span>
              </div>
            ))}
          </div>
          <div className="glass-panel rounded-lg px-4 py-2 flex items-center gap-3">
            <div className="flex items-center gap-2 pr-3 border-r border-white/10">
              <AlertTriangle size={12} className="text-red-400" />
              <span className="text-white/65 text-[10.5px] font-semibold uppercase tracking-wider">
                物料 / 安全
              </span>
            </div>
            {(['coal', 'ore', 'waste'] as const).map((m) => {
              const label = m === 'coal' ? '煤' : m === 'ore' ? '矿' : '废';
              return (
                <div key={m} className="flex items-center gap-1">
                  <span
                    className="w-3.5 h-3.5 rounded border border-white/20"
                    style={{ background: materialColor(m) }}
                  />
                  <span className="text-[10px] text-white/75">{label}</span>
                </div>
              );
            })}
            <div className="w-px h-4 bg-white/10 mx-1" />
            <div className="flex items-center gap-1">
              <span
                className="w-3.5 h-3.5 rounded-sm border animate-pulse"
                style={{
                  background: 'rgba(229,57,53,0.3)',
                  borderColor: COLORS.statusDanger,
                }}
              />
              <span className="text-[10px] text-white/75">危险区</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
