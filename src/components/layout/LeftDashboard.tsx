import {
  Truck,
  Package,
  Clock,
  Gauge,
  AlertCircle,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { fleetColor, statusLabel, COLORS } from '../../utils/colors';
import type { Truck as TruckT } from '../../simulation/types';

interface StatCardProps {
  icon: typeof Truck;
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  trend?: 'up' | 'down' | 'flat';
  color?: string;
  glow?: boolean;
}

function StatCard({ icon: Icon, label, value, unit, sub, trend, color, glow }: StatCardProps) {
  return (
    <div className="glass-panel rounded-lg p-3 relative overflow-hidden group">
      {glow && (
        <div
          className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity"
          style={{ background: `radial-gradient(circle at 80% 20%, ${color || COLORS.accent}, transparent 70%)` }}
        />
      )}
      <div className="relative flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-white/55 text-[10.5px] mb-1.5 uppercase tracking-wider">
            <Icon size={12} />
            <span>{label}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className="text-2xl font-bold text-white leading-none"
              style={{ fontFamily: 'Orbitron, sans-serif', color: color || '#fff' }}
            >
              {value}
            </span>
            {unit && <span className="text-white/50 text-[10px]">{unit}</span>}
          </div>
          {sub && (
            <div className="text-[10.5px] text-white/50 mt-1 flex items-center gap-1">
              {trend === 'up' && <TrendingUp size={10} className="text-green-400" />}
              {trend === 'down' && <TrendingUp size={10} className="text-red-400 rotate-180" />}
              {sub}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniQueueBar({ lp, ua }: { lp: number; ua: number }) {
  const total = lp + ua;
  const max = 12;
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] text-white/55 mb-1">
        <span>装载队: {lp}</span>
        <span>卸料队: {ua}</span>
      </div>
      <div className="h-2 bg-white/8 rounded-full overflow-hidden flex">
        <div
          className="bg-gradient-to-r from-orange-500 to-amber-400"
          style={{ width: `${Math.min(100, (lp / max) * 100)}%` }}
        />
        <div
          className="bg-gradient-to-r from-sky-500 to-cyan-400"
          style={{ width: `${Math.min(100, (ua / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function FleetBar({ trucks }: { trucks: Record<string, TruckT> }) {
  const counts: Record<string, { total: number; moving: number; broken: number }> = {
    A: { total: 0, moving: 0, broken: 0 },
    B: { total: 0, moving: 0, broken: 0 },
    C: { total: 0, moving: 0, broken: 0 },
    D: { total: 0, moving: 0, broken: 0 },
  };
  Object.values(trucks).forEach((t) => {
    counts[t.fleet].total++;
    if (t.status === 'hauling' || t.status === 'returning') counts[t.fleet].moving++;
    if (t.status === 'broken') counts[t.fleet].broken++;
  });
  const max = Math.max(1, ...Object.values(counts).map((c) => c.total));
  return (
    <div className="space-y-1.5">
      {(['A', 'B', 'C', 'D'] as const).map((f) => (
        <div key={f}>
          <div className="flex justify-between items-center text-[10.5px] mb-0.5">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ background: fleetColor(f), boxShadow: `0 0 4px ${fleetColor(f)}` }}
              />
              <span className="text-white/75 font-medium">
                {f} 车队
              </span>
            </div>
            <span className="text-white/60" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <span className="text-green-400">{counts[f].moving}</span>
              <span className="text-white/40">/</span>
              <span>{counts[f].total}</span>
              {counts[f].broken > 0 && (
                <span className="text-red-400 ml-1">⚠{counts[f].broken}</span>
              )}
            </span>
          </div>
          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(counts[f].total / max) * 100}%`,
                background: `linear-gradient(90deg, ${fleetColor(f)}, ${fleetColor(f)}cc)`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EfficiencyGauge({ value }: { value: number }) {
  const pct = Math.min(100, (value / 15000) * 100);
  const circumference = 2 * Math.PI * 28;
  const offset = circumference * (1 - pct / 100);
  return (
    <div className="relative w-[92px] h-[92px] flex items-center justify-center">
      <svg viewBox="0 0 72 72" className="absolute inset-0">
        <circle
          cx="36"
          cy="36"
          r="28"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="5"
          fill="none"
        />
        <circle
          cx="36"
          cy="36"
          r="28"
          stroke={`url(#grad-gauge)`}
          strokeWidth="5"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <defs>
          <linearGradient id="grad-gauge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#43A047" />
            <stop offset="50%" stopColor="#FFB300" />
            <stop offset="100%" stopColor="#FF7A1A" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center z-10">
        <div
          className="text-xl font-bold text-white leading-none"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          {value.toLocaleString()}
        </div>
        <div className="text-[9px] text-white/55 mt-0.5">吨/小时</div>
      </div>
    </div>
  );
}

export function LeftDashboard() {
  const stats = useScheduleStore((s) => s.stats);
  const trucks = useScheduleStore((s) => s.trucks) as Record<string, TruckT>;
  const loadingPoints = useScheduleStore((s) => s.loadingPoints) as Record<string, any>;
  const unloadingAreas = useScheduleStore((s) => s.unloadingAreas) as Record<string, any>;
  const totalTrucks = Object.keys(trucks).length;
  const lpQueue = Object.values(loadingPoints).reduce<number>((s, l: any) => s + l.queue.length, 0);
  const uaQueue = Object.values(unloadingAreas).reduce<number>((s, u: any) => s + u.queue.length, 0);

  const activeAlerts = Object.values(trucks).filter(
    (t) => t.safetyAlert || t.status === 'broken'
  );

  return (
    <div className="absolute left-3 top-[88px] bottom-[88px] w-[268px] z-10 flex flex-col gap-2.5 pointer-events-auto">
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={Truck}
          label="在途车辆"
          value={stats.inTransitCount.toString()}
          unit={`/ ${totalTrucks}`}
          sub={`运行率 ${((stats.inTransitCount / totalTrucks) * 100).toFixed(0)}%`}
          trend="up"
          color={COLORS.fleetB}
          glow
        />
        <StatCard
          icon={Package}
          label="平均载重"
          value={stats.avgLoad.toString()}
          unit="吨"
          sub="含排队车辆均值"
          color={COLORS.accent}
          glow
        />
        <StatCard
          icon={Clock}
          label="排队长度"
          value={stats.totalQueueLen.toString()}
          unit="辆"
          sub={`装载${lpQueue}·卸料${uaQueue}`}
          trend={stats.totalQueueLen > 20 ? 'up' : 'flat'}
          color={stats.totalQueueLen > 20 ? COLORS.statusWarning : COLORS.statusOk}
        />
        <StatCard
          icon={AlertCircle}
          label="安全预警"
          value={stats.safetyAlertCount.toString()}
          unit="起"
          sub={stats.safetyAlertCount > 0 ? '请关注!' : '状态良好'}
          color={stats.safetyAlertCount > 0 ? COLORS.statusDanger : COLORS.statusOk}
          glow={stats.safetyAlertCount > 0}
        />
      </div>

      <div className="glass-panel rounded-lg p-3">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-white/70 text-[11px] font-semibold uppercase tracking-wider">
            <Gauge size={12} />
            <span>装卸效率</span>
          </div>
          <span className="text-white/40 text-[9.5px]">实时指标</span>
        </div>
        <div className="flex items-center justify-around">
          <EfficiencyGauge value={stats.loadingEfficiency} />
          <div className="flex-1 space-y-2 pl-2">
            {Object.values(loadingPoints).map((lp) => (
              <div key={lp.id}>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-white/70">{lp.name}</span>
                  <span
                    className="text-white/60"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    {lp.avgWaitTime.toFixed(0)}分
                  </span>
                </div>
                <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                    style={{ width: `${Math.min(100, (lp.avgWaitTime / 20) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-lg p-3">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-white/70 text-[11px] font-semibold uppercase tracking-wider">
            <Activity size={12} />
            <span>排队概况</span>
          </div>
        </div>
        <MiniQueueBar lp={lpQueue} ua={uaQueue} />
      </div>

      <div className="glass-panel rounded-lg p-3 flex-1 min-h-0 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-white/70 text-[11px] font-semibold uppercase tracking-wider">
            <Truck size={12} />
            <span>车队状态</span>
          </div>
        </div>
        <div className="overflow-auto pr-1">
          <FleetBar trucks={trucks} />
        </div>
      </div>

      {activeAlerts.length > 0 && (
        <div className="glass-panel rounded-lg p-3 border border-red-500/30">
          <div className="flex items-center gap-1.5 text-red-300 text-[11px] font-bold mb-2">
            <AlertCircle size={12} className="animate-pulse" />
            <span>安全预警 ({activeAlerts.length})</span>
          </div>
          <div className="space-y-1.5 max-h-28 overflow-auto pr-1">
            {activeAlerts.slice(0, 5).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between bg-red-500/10 rounded px-2 py-1.5 text-[10.5px]"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: fleetColor(t.fleet) }}
                  />
                  <span className="text-white/85">{t.plateNo}</span>
                </div>
                <span className="text-red-300 font-medium">
                  {t.safetyAlert
                    ? t.safetyAlert === 'overspeed'
                      ? '超速'
                      : '车距过近'
                    : statusLabel(t.status)}
                </span>              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
