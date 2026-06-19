import {
  X,
  MapPin,
  Gauge,
  Ruler,
  Clock,
  Activity,
  AlertTriangle,
  RefreshCw,
  Route,
  History,
  Package,
  Truck as TruckIcon,
} from 'lucide-react';
import { useScheduleStore } from '../../store/useScheduleStore';
import {
  fleetColor,
  materialColor,
  statusLabel,
  materialLabel,
  COLORS,
} from '../../utils/colors';
import { LOADING_POINTS, UNLOADING_AREAS } from '../../simulation/vehicleFactory';
import { sampleTrack } from '../../utils/lod';

export function VehicleDetail() {
  const selectedId = useScheduleStore((s) => s.selectedTruckId);
  const setSelected = useScheduleStore((s) => s.setSelectedTruck);
  const trucks = useScheduleStore((s) => s.trucks);
  const tracks = useScheduleStore((s) => s.replayTracks);
  const loadingPoints = useScheduleStore((s) => s.loadingPoints);
  const unloadingAreas = useScheduleStore((s) => s.unloadingAreas);
  const enterReplay = useScheduleStore((s) => s.enterReplay);

  if (!selectedId) return null;
  const t = trucks[selectedId];
  if (!t) return null;

  const track = tracks[t.id] || [];
  const sampled = sampleTrack(track, 30);
  const maxLoad = t.capacity;
  const loadPct = (t.load / maxLoad) * 100;

  const lp = t.targetLoadingPointId
    ? loadingPoints[t.targetLoadingPointId] || LOADING_POINTS.find((l) => l.id === t.targetLoadingPointId)
    : null;
  const ua = t.targetUnloadingAreaId
    ? unloadingAreas[t.targetUnloadingAreaId] || UNLOADING_AREAS.find((u) => u.id === t.targetUnloadingAreaId)
    : null;

  const statusBg: Record<string, string> = {
    idle: 'bg-slate-500/40 text-slate-200',
    loading: 'bg-orange-500/40 text-orange-100',
    hauling: 'bg-green-500/40 text-green-100',
    queuing_load: 'bg-amber-500/40 text-amber-100',
    queuing_unload: 'bg-sky-500/40 text-sky-100',
    unloading: 'bg-cyan-500/40 text-cyan-100',
    returning: 'bg-blue-500/40 text-blue-100',
    broken: 'bg-red-500/40 text-red-100',
  };

  return (
    <div className="absolute bottom-[88px] left-[284px] w-[320px] z-10 pointer-events-auto">
      <div className="glass-panel rounded-xl overflow-hidden shadow-2xl"
        style={{ border: `1px solid ${fleetColor(t.fleet)}66` }}
      >
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{
            background: `linear-gradient(135deg, ${fleetColor(t.fleet)}44, ${fleetColor(t.fleet)}11)`,
            borderBottom: `1px solid ${fleetColor(t.fleet)}44`,
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${fleetColor(t.fleet)}, ${fleetColor(t.fleet)}cc)`,
                boxShadow: `0 4px 12px ${fleetColor(t.fleet)}55`,
              }}
            >
              <TruckIcon size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm">{t.plateNo}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-medium ${
                    statusBg[t.status] || 'bg-white/10 text-white/70'
                  }`}
                >
                  {statusLabel(t.status)}
                </span>
              </div>
              <div className="text-[10.5px] text-white/60 mt-0.5 flex items-center gap-2">
                <span>{t.fleet} 车队</span>
                <span>·</span>
                <span>额定载重 {t.capacity} 吨</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelected(null)}
            className="text-white/50 hover:text-white hover:bg-white/10 p-1.5 rounded-md transition"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-4 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-white/50 uppercase tracking-wider">
                <Package size={10} />
                <span>当前载重</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-2xl font-bold leading-none"
                  style={{
                    fontFamily: 'Orbitron, sans-serif',
                    color: t.material ? materialColor(t.material) : '#78909C',
                  }}
                >
                  {t.load.toFixed(0)}
                </span>
                <span className="text-[10px] text-white/50">
                  / {t.capacity} t
                </span>
              </div>
              <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${loadPct}%`,
                    background: t.material
                      ? `linear-gradient(90deg, ${materialColor(t.material)}, ${materialColor(t.material)}88)`
                      : '#555',
                  }}
                />
              </div>
              <div className="text-[10px] text-white/55">
                物料: <span className="text-white/80 font-medium">{materialLabel(t.material)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-white/50 uppercase tracking-wider">
                <Gauge size={10} />
                <span>行驶速度</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-2xl font-bold leading-none ${
                    t.safetyAlert === 'overspeed' ? 'text-red-400' : 'text-white'
                  }`}
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  {t.speed.toFixed(0)}
                </span>
                <span className="text-[10px] text-white/50">km/h</span>
              </div>
              <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (t.speed / 40) * 100)}%`,
                    background:
                      t.safetyAlert === 'overspeed'
                        ? 'linear-gradient(90deg, #E53935, #FF5252)'
                        : 'linear-gradient(90deg, #43A047, #81C784)',
                  }}
                />
              </div>
              {t.safetyAlert === 'overspeed' && (
                <div className="text-[10px] text-red-400 font-medium flex items-center gap-1">
                  <AlertTriangle size={10} /> 超速预警
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/8">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-white/50 uppercase tracking-wider">
                <MapPin size={10} />
                <span>下一目标</span>
              </div>
              <div className="text-[11px] text-white/85">
                {t.status === 'hauling' || t.status === 'queuing_unload' || t.status === 'unloading'
                  ? ua?.name || '卸料区'
                  : lp?.name || '装载点'}
              </div>
              <div className="text-[10px] text-white/45">
                预计 <span style={{ fontFamily: 'Orbitron, sans-serif' }}>{t.etaNextNode?.toFixed(0) || '--'}</span> 秒到达
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-white/50 uppercase tracking-wider">
                <Ruler size={10} />
                <span>安全车距</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-lg font-bold leading-none ${
                    t.distanceToNext < 10
                      ? 'text-red-400'
                      : t.distanceToNext < 20
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  }`}
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  {t.distanceToNext.toFixed(0)}
                </span>
                <span className="text-[10px] text-white/50">米</span>
              </div>
              {t.distanceToNext < 15 && (
                <div className="text-[10px] text-yellow-400 flex items-center gap-1">
                  <AlertTriangle size={10} /> 请保持距离
                </div>
              )}
            </div>
          </div>

          {lp && ua && (
            <div className="pt-2 border-t border-white/8">
              <div className="flex items-center gap-1 text-[10px] text-white/50 uppercase tracking-wider mb-1.5">
                <RefreshCw size={10} />
                <span>装卸循环</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="flex-1 px-2 py-1.5 rounded-md text-[10.5px] text-center"
                  style={{ background: `${COLORS.accent}22`, border: `1px solid ${COLORS.accent}44` }}
                >
                  <div className="font-medium text-white/90">{lp.name}</div>
                  <div className="text-[9px] text-white/50 mt-0.5">排队 {lp.queue.length} 辆</div>
                </div>
                <Route size={14} className="text-orange-400 shrink-0" />
                <div
                  className="flex-1 px-2 py-1.5 rounded-md text-[10.5px] text-center"
                  style={{ background: 'rgba(41,182,246,0.15)', border: '1px solid rgba(41,182,246,0.35)' }}
                >
                  <div className="font-medium text-white/90">{ua.name}</div>
                  <div className="text-[9px] text-white/50 mt-0.5">排队 {ua.queue.length} 辆</div>
                </div>
              </div>
            </div>
          )}

          {sampled.length > 2 && (
            <div className="pt-2 border-t border-white/8">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1 text-[10px] text-white/50 uppercase tracking-wider">
                  <History size={10} />
                  <span>速度轨迹 ({sampled.length} 抽样点)</span>
                </div>
              </div>
              <div className="h-10 flex items-end gap-0.5">
                {sampled.map((s: any, i) => {
                  const h = Math.max(4, (s.speed / 40) * 100);
                  const color =
                    s.status === 'broken'
                      ? '#E53935'
                      : s.status === 'hauling' || s.status === 'returning'
                      ? '#43A047'
                      : s.load > 0
                      ? '#FF7A1A'
                      : '#78909C';
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm transition-all hover:opacity-100 opacity-80"
                      style={{
                        height: `${h}%`,
                        minHeight: 3,
                        background: color,
                        boxShadow: `0 0 4px ${color}66`,
                      }}
                      title={`${i}: ${s.speed.toFixed(0)} km/h · ${statusLabel(s.status)} · ${s.load.toFixed(0)}t`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[9px] text-white/35 mt-0.5">
                <span>起点</span>
                <span>当前</span>
              </div>
            </div>
          )}

          <button
            onClick={() => enterReplay(t.id)}
            className="w-full mt-1 py-2 rounded-lg font-semibold text-[11.5px] text-white flex items-center justify-center gap-1.5 transition hover:opacity-90"
            style={{
              background: `linear-gradient(135deg, ${fleetColor(t.fleet)}, ${fleetColor(t.fleet)}aa)`,
              boxShadow: `0 4px 12px ${fleetColor(t.fleet)}55`,
            }}
          >
            <History size={12} />
            查看完整轨迹回放
          </button>
        </div>
      </div>
    </div>
  );
}
