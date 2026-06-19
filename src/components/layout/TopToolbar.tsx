import {
  Sun,
  Moon,
  Eye,
  EyeOff,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Map,
  Layers,
  Truck as TruckIcon,
} from 'lucide-react';
import { useScheduleStore } from '../../store/useScheduleStore';
import type { Fleet, MaterialType, PresetView } from '../../simulation/types';
import { fleetColor, materialColor, COLORS } from '../../utils/colors';

const PRESETS: { id: PresetView; label: string; icon: typeof Sun }[] = [
  { id: 'perspective', label: '斜视全景', icon: Map },
  { id: 'top', label: '俯视总览', icon: Layers },
  { id: 'road', label: '主运输道', icon: BarChart3 },
  { id: 'closeup', label: '工作面', icon: TrendingUp },
];

const FLEETS: { id: Fleet | 'all'; label: string }[] = [
  { id: 'all', label: '全部车队' },
  { id: 'A', label: 'A队' },
  { id: 'B', label: 'B队' },
  { id: 'C', label: 'C队' },
  { id: 'D', label: 'D队' },
];

const MATERIALS: { id: MaterialType | 'all'; label: string }[] = [
  { id: 'all', label: '全部物料' },
  { id: 'coal', label: '原煤' },
  { id: 'ore', label: '矿石' },
  { id: 'waste', label: '废石' },
];

export function TopToolbar() {
  const isNight = useScheduleStore((s) => s.isNight);
  const toggleNight = useScheduleStore((s) => s.toggleNight);
  const fleetFilter = useScheduleStore((s) => s.fleetFilter);
  const setFleet = useScheduleStore((s) => s.setFleetFilter);
  const materialFilter = useScheduleStore((s) => s.materialFilter);
  const setMaterial = useScheduleStore((s) => s.setMaterialFilter);
  const presetView = useScheduleStore((s) => s.presetView);
  const setPreset = useScheduleStore((s) => s.setPresetView);
  const showAllLabels = useScheduleStore((s) => s.showAllLabels);
  const setShowAllLabels = useScheduleStore((s) => s.setShowAllLabels);
  const showCongestion = useScheduleStore((s) => s.showCongestion);
  const setShowCongestion = useScheduleStore((s) => s.setShowCongestion);
  const showDangerZones = useScheduleStore((s) => s.showDangerZones);
  const setShowDangerZones = useScheduleStore((s) => s.setShowDangerZones);
  const stats = useScheduleStore((s) => s.stats);

  return (
    <div className="absolute top-0 left-0 right-0 z-20 p-3 pointer-events-none">
      <div className="max-w-[1800px] mx-auto flex items-start justify-between gap-3 pointer-events-auto">
        <div className="glass-panel px-4 py-2.5 rounded-lg flex items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-white/10">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${COLORS.accent}, #d05a00)` }}
            >
              <TruckIcon size={18} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                OPENPIT MINE DISPATCH
              </div>
              <div className="text-white/60 text-[10px] leading-none mt-0.5">
                露天矿卡车调度三维可视化系统 · v1.0
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2">
            {PRESETS.map((p) => {
              const Icon = p.icon;
              const active = presetView === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id)}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] flex items-center gap-1.5 transition-all ${
                    active
                      ? 'bg-orange-500/90 text-white shadow-md shadow-orange-500/30'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={13} />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass-panel px-3 py-2 rounded-lg flex items-center gap-2">
          <div className="text-white/60 text-[10px] pr-2 border-r border-white/10" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            <div>FPS</div>
            <div className={`text-base font-bold ${stats.fps > 45 ? 'text-green-400' : stats.fps > 30 ? 'text-yellow-400' : 'text-red-400'}`}>
              {stats.fps}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex gap-1 items-center">
              <span className="text-white/60 text-[10px] w-14">车队</span>
              <select
                value={fleetFilter}
                onChange={(e) => setFleet(e.target.value as Fleet | 'all')}
                className="bg-white/8 text-white text-[11px] px-2 py-1 rounded border border-white/10 outline-none focus:border-orange-400/60"
              >
                {FLEETS.map((f) => (
                  <option key={f.id} value={f.id} className="bg-slate-900">
                    {f.label}
                    {f.id !== 'all' && ` · ${f.id}队`}
                  </option>
                ))}
              </select>
              {fleetFilter !== 'all' && (
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: fleetColor(fleetFilter), boxShadow: `0 0 6px ${fleetColor(fleetFilter)}` }}
                />
              )}
            </div>
            <div className="flex gap-1 items-center">
              <span className="text-white/60 text-[10px] w-14">物料</span>
              <select
                value={materialFilter}
                onChange={(e) => setMaterial(e.target.value as MaterialType | 'all')}
                className="bg-white/8 text-white text-[11px] px-2 py-1 rounded border border-white/10 outline-none focus:border-orange-400/60"
              >
                {MATERIALS.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900">
                    {m.label}
                  </option>
                ))}
              </select>
              {materialFilter !== 'all' && (
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: materialColor(materialFilter) }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="glass-panel px-3 py-2 rounded-lg flex items-center gap-2">
          <button
            onClick={toggleNight}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all text-[11px] font-medium ${
              isNight
                ? 'bg-indigo-600/80 text-white shadow-md shadow-indigo-500/30'
                : 'bg-amber-500/80 text-white shadow-md shadow-amber-500/30'
            }`}
          >
            {isNight ? <Moon size={14} /> : <Sun size={14} />}
            {isNight ? '夜班模式' : '白班模式'}
          </button>

          <div className="w-px h-7 bg-white/10" />

          <button
            onClick={() => setShowAllLabels(!showAllLabels)}
            className={`p-1.5 rounded-md transition-all ${
              showAllLabels ? 'bg-white/15 text-white' : 'bg-white/5 text-white/50 hover:text-white/80'
            }`}
            title="切换车辆标签"
          >
            {showAllLabels ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
          <button
            onClick={() => setShowCongestion(!showCongestion)}
            className={`p-1.5 rounded-md transition-all ${
              showCongestion ? 'bg-white/15 text-orange-300' : 'bg-white/5 text-white/50 hover:text-white/80'
            }`}
            title="切换道路拥堵着色"
          >
            <BarChart3 size={15} />
          </button>
          <button
            onClick={() => setShowDangerZones(!showDangerZones)}
            className={`p-1.5 rounded-md transition-all ${
              showDangerZones ? 'bg-white/15 text-red-300 animate-pulse' : 'bg-white/5 text-white/50 hover:text-white/80'
            }`}
            title="切换危险边坡显示"
          >
            <AlertTriangle size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
