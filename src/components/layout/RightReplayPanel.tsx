import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  History,
  AlertOctagon,
  Gauge,
  Route,
  Package,
  X,
  ChevronRight,
} from 'lucide-react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { fleetColor, statusLabel, materialLabel, COLORS } from '../../utils/colors';
import dayjs from 'dayjs';

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const SPEEDS: (0.5 | 1 | 2 | 4)[] = [0.5, 1, 2, 4];

const BOOKMARK_TYPE_LABEL: Record<string, { label: string; color: string }> = {
  collision: { label: '碰撞风险', color: COLORS.statusDanger },
  overspeed: { label: '超速行驶', color: COLORS.statusWarning },
  road_edge: { label: '边坡越界', color: '#9C27B0' },
  other: { label: '其他事件', color: '#78909C' },
};

export function RightReplayPanel() {
  const isReplay = useScheduleStore((s) => s.isReplayMode);
  const exitReplay = useScheduleStore((s) => s.exitReplay);
  const replayTruckId = useScheduleStore((s) => s.replayTruckId);
  const replayTime = useScheduleStore((s) => s.replayTime);
  const replayDuration = useScheduleStore((s) => s.replayDuration);
  const setReplayTime = useScheduleStore((s) => s.setReplayTime);
  const replaySpeed = useScheduleStore((s) => s.replaySpeed);
  const setReplaySpeed = useScheduleStore((s) => s.setReplaySpeed);
  const isPlaying = useScheduleStore((s) => s.isPlaying);
  const setPlaying = useScheduleStore((s) => s.setPlaying);
  const trucks = useScheduleStore((s) => s.trucks);
  const bookmarks = useScheduleStore((s) => s.bookmarks);
  const tracks = useScheduleStore((s) => s.replayTracks);
  const jumpToBookmark = useScheduleStore((s) => s.jumpToBookmark);
  const enterReplay = useScheduleStore((s) => s.enterReplay);
  const selectedTruckId = useScheduleStore((s) => s.selectedTruckId);
  const setSelected = useScheduleStore((s) => s.setSelectedTruck);

  const activeTruck = replayTruckId
    ? trucks[replayTruckId]
    : selectedTruckId
    ? trucks[selectedTruckId]
    : null;
  const activeTrack = activeTruck ? tracks[activeTruck.id] || [] : [];
  const loadHistory = activeTrack.length > 1
    ? [
        activeTrack[0].load,
        activeTrack[Math.floor(activeTrack.length / 3)].load,
        activeTrack[Math.floor((activeTrack.length * 2) / 3)].load,
        activeTrack[activeTrack.length - 1].load,
      ]
    : [];

  return (
    <div className="absolute right-3 top-[88px] bottom-[88px] w-[300px] z-10 flex flex-col gap-2.5 pointer-events-auto">
      <div className="glass-panel rounded-lg p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-white/70 text-[11px] font-semibold uppercase tracking-wider">
            <History size={12} />
            <span>轨迹回放中心</span>
          </div>
          {isReplay && (
            <button
              onClick={exitReplay}
              className="text-white/50 hover:text-white/90 transition p-1 rounded hover:bg-white/10"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {!activeTruck ? (
          <div className="text-center py-6 text-white/40 text-[11px]">
            <Route size={28} className="mx-auto mb-2 opacity-40" />
            <div>请在场景中点击车辆</div>
            <div className="mt-0.5">或从下方书签列表选择事件</div>
          </div>
        ) : (
          <div className="space-y-3">
            <div
              className="p-2.5 rounded-lg"
              style={{ background: `${fleetColor(activeTruck.fleet)}22`, border: `1px solid ${fleetColor(activeTruck.fleet)}55` }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: fleetColor(activeTruck.fleet),
                      boxShadow: `0 0 8px ${fleetColor(activeTruck.fleet)}`,
                    }}
                  />
                  <span className="text-white font-bold text-sm">{activeTruck.plateNo}</span>
                  <span className="text-white/50 text-[10px]">
                    {activeTruck.fleet}队
                  </span>
                </div>
                {!isReplay && (
                  <button
                    onClick={() => {
                      enterReplay(activeTruck.id);
                      setSelected(activeTruck.id);
                    }}
                    className="text-[10.5px] px-2 py-0.5 rounded bg-orange-500/80 hover:bg-orange-500 text-white font-medium transition flex items-center gap-1"
                  >
                    <Play size={9} fill="currentColor" />
                    回放
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10.5px]">
                <div>
                  <div className="text-white/50">状态</div>
                  <div className="text-white/90 font-medium">{statusLabel(activeTruck.status)}</div>
                </div>
                <div>
                  <div className="text-white/50">载重</div>
                  <div className="text-white/90 font-medium">
                    {activeTruck.load.toFixed(0)}/{activeTruck.capacity}t
                  </div>
                </div>
                <div>
                  <div className="text-white/50">车速</div>
                  <div className="text-white/90 font-medium">{activeTruck.speed.toFixed(0)} km/h</div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <div className="text-[10.5px] text-white/60 flex items-center gap-1">
                  <Gauge size={10} />
                  回放进度
                </div>
                <span
                  className="text-[10.5px] text-white/80"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  {formatTime(Math.max(0, replayTime))} / {formatTime(replayDuration)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(1, replayDuration)}
                value={replayTime}
                onChange={(e) => setReplayTime(Number(e.target.value))}
                disabled={!isReplay}
                className="w-full h-1.5 accent-orange-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              />
              {bookmarks
                .filter((b) => b.truckId === activeTruck.id)
                .map((b) => (
                  <div
                    key={b.id}
                    className="absolute"
                    style={{
                      left: `${(b.timestamp / replayDuration) * 100}%`,
                      marginTop: -10,
                      width: 3,
                      height: 16,
                      background: BOOKMARK_TYPE_LABEL[b.type]?.color || '#999',
                      borderRadius: 2,
                      cursor: 'pointer',
                    }}
                    title={`${BOOKMARK_TYPE_LABEL[b.type]?.label} - ${formatTime(b.timestamp)}`}
                    onClick={() => jumpToBookmark(b)}
                  />
                ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={!isReplay}
                onClick={() => setReplayTime(Math.max(0, replayTime - 30))}
                className="p-1.5 rounded-md bg-white/8 hover:bg-white/15 text-white/80 disabled:opacity-40 transition"
                title="后退30秒"
              >
                <SkipBack size={14} />
              </button>
              <button
                disabled={!isReplay}
                onClick={() => setPlaying(!isPlaying)}
                className="flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 font-medium text-[11.5px] transition disabled:opacity-40"
                style={{
                  background: isPlaying
                    ? 'linear-gradient(135deg, #FF7A1A, #E65100)'
                    : 'linear-gradient(135deg, #43A047, #2E7D32)',
                  color: '#fff',
                  boxShadow: isPlaying
                    ? '0 3px 10px rgba(255,122,26,0.4)'
                    : '0 3px 10px rgba(67,160,71,0.4)',
                }}
              >
                {isPlaying ? (
                  <>
                    <Pause size={13} fill="currentColor" /> 暂停回放
                  </>
                ) : (
                  <>
                    <Play size={13} fill="currentColor" /> 开始回放
                  </>
                )}
              </button>
              <button
                disabled={!isReplay}
                onClick={() => setReplayTime(Math.min(replayDuration, replayTime + 30))}
                className="p-1.5 rounded-md bg-white/8 hover:bg-white/15 text-white/80 disabled:opacity-40 transition"
                title="快进30秒"
              >
                <SkipForward size={14} />
              </button>
            </div>

            <div className="flex gap-1 items-center justify-center">
              <span className="text-[10px] text-white/50 mr-1">速度:</span>
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => setReplaySpeed(s)}
                  className={`px-2 py-0.5 rounded text-[10.5px] transition ${
                    replaySpeed === s
                      ? 'bg-orange-500 text-white font-bold'
                      : 'bg-white/8 text-white/60 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {loadHistory.length > 0 && (
              <div className="pt-2 border-t border-white/8">
                <div className="flex items-center gap-1 text-[10.5px] text-white/60 mb-1.5">
                  <Package size={10} />
                  <span>载重变化（抽样）</span>
                </div>
                <div className="flex items-end gap-1 h-12">
                  {loadHistory.map((v, i) => {
                    const maxV = activeTruck.capacity;
                    const h = Math.max(8, (v / maxV) * 100);
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-t relative group"
                        style={{
                          height: `${h}%`,
                          background: `linear-gradient(180deg, ${fleetColor(activeTruck.fleet)}, ${fleetColor(activeTruck.fleet)}55)`,
                        }}
                      >
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] text-white/80 opacity-0 group-hover:opacity-100 transition">
                          {v.toFixed(0)}t
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="glass-panel rounded-lg p-3 flex-1 min-h-0 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-white/70 text-[11px] font-semibold uppercase tracking-wider">
            <AlertOctagon size={12} />
            <span>事故事件书签</span>
          </div>
          <span className="text-white/40 text-[9.5px]">{bookmarks.length} 起</span>
        </div>

        {bookmarks.length === 0 ? (
          <div className="text-center py-8 text-white/35 text-[11px] flex-1 flex flex-col items-center justify-center">
            <AlertOctagon size={24} className="mb-2 opacity-40" />
            <div>暂无事件记录</div>
            <div className="mt-0.5 text-[10px]">系统模拟中会随机生成事件</div>
          </div>
        ) : (
          <div className="space-y-1.5 flex-1 overflow-auto pr-1">
            {bookmarks.slice().reverse().slice(0, 30).map((b) => {
              const info = BOOKMARK_TYPE_LABEL[b.type] || BOOKMARK_TYPE_LABEL.other;
              const t = trucks[b.truckId];
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    jumpToBookmark(b);
                    setSelected(b.truckId);
                  }}
                  className="w-full text-left p-2 rounded-md bg-white/4 hover:bg-white/10 border border-white/4 hover:border-white/15 transition group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: info.color, boxShadow: `0 0 4px ${info.color}` }}
                      />
                      <span className="text-[10.5px] font-medium text-white/85">
                        {info.label}
                      </span>
                    </div>
                    <span
                      className="text-[10px] text-white/50"
                      style={{ fontFamily: 'Orbitron, sans-serif' }}
                    >
                      {formatTime(b.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1">
                      {t && (
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: fleetColor(t.fleet) }}
                        />
                      )}
                      <span className="text-white/65">
                        {t?.plateNo || b.truckId}
                      </span>
                    </div>
                    <ChevronRight
                      size={11}
                      className="text-white/30 group-hover:text-orange-400 transition"
                    />
                  </div>
                  <div className="text-[9.5px] text-white/40 mt-0.5 truncate">
                    {b.description}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
