import { create } from 'zustand';
import { shallow } from 'zustand/shallow';
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
import { createFleet, excavatorMap } from '../simulation/vehicleFactory';
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

function shallowSameRecord<T extends Record<string, unknown>>(a: T, b: T): boolean {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (let i = 0; i < ka.length; i++) {
    if (a[ka[i]] !== b[ka[i]]) return false;
  }
  return true;
}

function shallowSameArr<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

const TRUCK_COUNT = 60;
const initialTrucks = createFleet(TRUCK_COUNT);
const initialScheduler = createSchedulerState(initialTrucks);
const initialExcavators = excavatorMap();

export const useScheduleStore = create<ScheduleStoreState>((set, get) => ({
  schedulerState: initialScheduler,
  trucks: initialScheduler.trucks,
  loadingPoints: initialScheduler.loadingPoints,
  unloadingAreas: initialScheduler.unloadingAreas,
  excavators: initialExcavators,
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
    const prev = get();
    const s = prev.schedulerState;
    const next = simulateTick(s);
    const fpsAvg =
      prev.fpsHistory.length > 0
        ? prev.fpsHistory.reduce((a, b) => a + b, 0) / prev.fpsHistory.length
        : 60;
    const stats = computeStats(next, fpsAvg);

    const nextTrucks = shallowSameRecord(prev.trucks, next.trucks)
      ? prev.trucks
      : next.trucks;
    const nextLp = shallowSameRecord(prev.loadingPoints, next.loadingPoints)
      ? prev.loadingPoints
      : next.loadingPoints;
    const nextUa = shallowSameRecord(prev.unloadingAreas, next.unloadingAreas)
      ? prev.unloadingAreas
      : next.unloadingAreas;
    const nextTracks = shallowSameRecord(prev.replayTracks, next.replayTracks)
      ? prev.replayTracks
      : next.replayTracks;
    const nextBms = shallowSameArr(prev.bookmarks, next.bookmarks)
      ? prev.bookmarks
      : next.bookmarks;
    const nextExc = shallowSameRecord(prev.excavators, initialExcavators)
      ? prev.excavators
      : initialExcavators;

    set({
      schedulerState: next,
      trucks: nextTrucks,
      loadingPoints: nextLp,
      unloadingAreas: nextUa,
      excavators: nextExc,
      replayTracks: nextTracks,
      bookmarks: nextBms,
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

export const visibleTruckIdsSelector = {
  deps: (s: ScheduleStoreState) =>
    [s.fleetFilter, s.materialFilter, s.trucks] as const,
  compute: (
    fleetFilter: Fleet | 'all',
    materialFilter: MaterialType | 'all',
    trucks: Record<string, Truck>
  ): string[] => {
    return Object.keys(trucks).filter((id) => {
      const t = trucks[id];
      if (!t) return false;
      if (fleetFilter !== 'all' && t.fleet !== fleetFilter) return false;
      if (materialFilter !== 'all') {
        if (materialFilter === 'coal' && t.material !== 'coal' && t.material !== null) return false;
        if (materialFilter === 'ore' && t.material !== 'ore') return false;
        if (materialFilter === 'waste' && t.material !== 'waste') return false;
      }
      return true;
    });
  },
};

export function useVisibleTruckIds(): string[] {
  const fleetFilter = useScheduleStore((s) => s.fleetFilter);
  const materialFilter = useScheduleStore((s) => s.materialFilter);
  const trucks = useScheduleStore((s) => s.trucks);
  return visibleTruckIdsSelector.compute(fleetFilter, materialFilter, trucks);
}

export { segmentMap, shallow };

declare global {
  interface Window { __scheduleStore: typeof useScheduleStore; }
}
if (import.meta.env.DEV) {
  window.__scheduleStore = useScheduleStore;
}
