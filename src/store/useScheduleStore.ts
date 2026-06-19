import { create } from 'zustand';
import type {
  Truck,
  Fleet,
  MaterialType,
  Stats,
  PresetView,
  TrackSample,
  AccidentBookmark,
  LoadingPoint,
  UnloadingArea,
  Excavator,
} from '../simulation/types';
import { createFleet, loadingPointMap, unloadingAreaMap, excavatorMap } from '../simulation/vehicleFactory';
import {
  createSchedulerState,
  simulateTick,
  computeStats,
  type SchedulerState,
} from '../simulation/scheduler';
import { segmentMap } from '../simulation/roadData';

interface ScheduleStoreState {
  schedulerState: SchedulerState;
  trucks: Record<string, Truck>;
  loadingPoints: Record<string, LoadingPoint>;
  unloadingAreas: Record<string, UnloadingArea>;
  excavators: Record<string, Excavator>;
  replayTracks: Record<string, TrackSample[]>;
  bookmarks: AccidentBookmark[];

  isNight: boolean;
  fleetFilter: Fleet | 'all';
  materialFilter: MaterialType | 'all';
  selectedTruckId: string | null;
  hoveredTruckId: string | null;
  showAllLabels: boolean;
  showCongestion: boolean;
  showDangerZones: boolean;

  isReplayMode: boolean;
  replayTruckId: string | null;
  replayTime: number;
  replayDuration: number;
  replaySpeed: 0.5 | 1 | 2 | 4;
  isPlaying: boolean;

  presetView: PresetView;
  stats: Stats;
  fpsHistory: number[];

  tickSim: () => void;
  addFps: (v: number) => void;
  toggleNight: () => void;
  setNight: (v: boolean) => void;
  setFleetFilter: (f: Fleet | 'all') => void;
  setMaterialFilter: (m: MaterialType | 'all') => void;
  setSelectedTruck: (id: string | null) => void;
  setHoveredTruck: (id: string | null) => void;
  setShowAllLabels: (v: boolean) => void;
  setShowCongestion: (v: boolean) => void;
  setShowDangerZones: (v: boolean) => void;
  setPresetView: (v: PresetView) => void;

  enterReplay: (truckId: string) => void;
  exitReplay: () => void;
  setReplayTime: (t: number) => void;
  setReplaySpeed: (s: 0.5 | 1 | 2 | 4) => void;
  setPlaying: (v: boolean) => void;
  jumpToBookmark: (b: AccidentBookmark) => void;
}

const TRUCK_COUNT = 60;
const initialTrucks = createFleet(TRUCK_COUNT);
const initialScheduler = createSchedulerState(initialTrucks);

export const useScheduleStore = create<ScheduleStoreState>((set, get) => ({
  schedulerState: initialScheduler,
  trucks: initialScheduler.trucks,
  loadingPoints: initialScheduler.loadingPoints,
  unloadingAreas: initialScheduler.unloadingAreas,
  excavators: excavatorMap(),
  replayTracks: initialScheduler.replayTracks,
  bookmarks: initialScheduler.bookmarks,

  isNight: false,
  fleetFilter: 'all',
  materialFilter: 'all',
  selectedTruckId: null,
  hoveredTruckId: null,
  showAllLabels: true,
  showCongestion: true,
  showDangerZones: true,

  isReplayMode: false,
  replayTruckId: null,
  replayTime: 0,
  replayDuration: 600,
  replaySpeed: 1,
  isPlaying: false,

  presetView: 'perspective',
  stats: {
    inTransitCount: 0,
    avgLoad: 0,
    totalQueueLen: 0,
    loadingEfficiency: 0,
    safetyAlertCount: 0,
    fps: 60,
  },
  fpsHistory: [],

  tickSim: () => {
    const s = get().schedulerState;
    const next = simulateTick(s);
    const fpsAvg =
      get().fpsHistory.length > 0
        ? get().fpsHistory.reduce((a, b) => a + b, 0) / get().fpsHistory.length
        : 60;
    const stats = computeStats(next, fpsAvg);
    const newExc = excavatorMap();
    set({
      schedulerState: next,
      trucks: { ...next.trucks },
      loadingPoints: { ...next.loadingPoints },
      unloadingAreas: { ...next.unloadingAreas },
      excavators: newExc,
      replayTracks: next.replayTracks,
      bookmarks: [...next.bookmarks],
      stats,
    });
  },

  addFps: (v) => {
    const hist = [...get().fpsHistory, v].slice(-60);
    set({ fpsHistory: hist });
  },

  toggleNight: () => set((s) => ({ isNight: !s.isNight })),
  setNight: (v) => set({ isNight: v }),
  setFleetFilter: (f) => set({ fleetFilter: f }),
  setMaterialFilter: (m) => set({ materialFilter: m }),
  setSelectedTruck: (id) => set({ selectedTruckId: id }),
  setHoveredTruck: (id) => set({ hoveredTruckId: id }),
  setShowAllLabels: (v) => set({ showAllLabels: v }),
  setShowCongestion: (v) => set({ showCongestion: v }),
  setShowDangerZones: (v) => set({ showDangerZones: v }),
  setPresetView: (v) => set({ presetView: v }),

  enterReplay: (truckId) => {
    const tracks = get().replayTracks[truckId] || [];
    const dur = tracks.length > 0 ? tracks[tracks.length - 1].t : 600;
    set({
      isReplayMode: true,
      replayTruckId: truckId,
      replayTime: dur,
      replayDuration: dur,
      isPlaying: false,
    });
  },
  exitReplay: () =>
    set({
      isReplayMode: false,
      replayTruckId: null,
      isPlaying: false,
    }),
  setReplayTime: (t) => set({ replayTime: t }),
  setReplaySpeed: (s) => set({ replaySpeed: s }),
  setPlaying: (v) => set({ isPlaying: v }),
  jumpToBookmark: (b) => {
    set({
      isReplayMode: true,
      replayTruckId: b.truckId,
      replayTime: Math.max(0, b.timestamp - 30),
      isPlaying: false,
    });
  },
}));

export const visibleTruckIdsSelector = (s: ScheduleStoreState): string[] => {
  const { trucks, fleetFilter, materialFilter } = s;
  return Object.keys(trucks).filter((id) => {
    const t = trucks[id];
    if (fleetFilter !== 'all' && t.fleet !== fleetFilter) return false;
    if (materialFilter !== 'all') {
      if (materialFilter === 'coal' && t.material !== 'coal' && t.material !== null) return false;
      if (materialFilter === 'ore' && t.material !== 'ore') return false;
      if (materialFilter === 'waste' && t.material !== 'waste') return false;
    }
    return true;
  });
};

export { segmentMap };
