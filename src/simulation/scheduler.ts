import type {
  Truck,
  TruckStatus,
  LoadingPoint,
  UnloadingArea,
  TrackSample,
  AccidentBookmark,
  AccidentType,
} from './types';
import {
  nodeMap,
  segmentMap,
  ROAD_NODES,
  ROAD_SEGMENTS,
  shortestPath,
} from './roadData';
import {
  LOADING_POINTS,
  UNLOADING_AREAS,
  EXCAVATORS,
  pickLoadingPointFor,
  pickUnloadingAreaFor,
} from './vehicleFactory';

export interface SchedulerState {
  trucks: Record<string, Truck>;
  loadingPoints: Record<string, LoadingPoint>;
  unloadingAreas: Record<string, UnloadingArea>;
  replayTracks: Record<string, TrackSample[]>;
  bookmarks: AccidentBookmark[];
  tickCount: number;
  elapsedSeconds: number;
}

const TICK_DT = 0.05;
const METERS_PER_SEC = (kmh: number) => kmh / 3.6;
const MIN_SAFETY_DISTANCE = 8;
const QUEUE_SPACING = 12;

export function createSchedulerState(initialTrucks: Truck[]): SchedulerState {
  const trucks: Record<string, Truck> = {};
  const tracks: Record<string, TrackSample[]> = {};
  initialTrucks.forEach((t) => {
    trucks[t.id] = t;
    tracks[t.id] = [
      {
        t: 0,
        x: t.position.x,
        y: t.position.y,
        z: t.position.z,
        status: t.status,
        load: t.load,
        speed: t.speed,
      },
    ];
  });
  const lp: Record<string, LoadingPoint> = {};
  LOADING_POINTS.forEach((l) => (lp[l.id] = { ...l, queue: [] }));
  const ua: Record<string, UnloadingArea> = {};
  UNLOADING_AREAS.forEach((u) => (ua[u.id] = { ...u, queue: [] }));
  return {
    trucks,
    loadingPoints: lp,
    unloadingAreas: ua,
    replayTracks: tracks,
    bookmarks: [],
    tickCount: 0,
    elapsedSeconds: 0,
  };
}

function posOnSegment(segId: string, progress: number, reverse: boolean) {
  const seg = segmentMap()[segId];
  const nm = nodeMap();
  const a = reverse ? nm[seg.to] : nm[seg.from];
  const b = reverse ? nm[seg.from] : nm[seg.to];
  return {
    x: a.x + (b.x - a.x) * progress,
    y: a.y + (b.y - a.y) * progress,
    z: a.z + (b.z - a.z) * progress,
    heading: Math.atan2(b.x - a.x, b.z - a.z),
  };
}

function isOnSegmentReverse(truck: Truck): boolean {
  if (!truck.currentSegmentId) return false;
  const seg = segmentMap()[truck.currentSegmentId];
  const cur = truck.pathNodeIds[truck.pathIndex];
  return seg.to === cur;
}

function findSegmentBetween(a: string, b: string): string | null {
  const s = ROAD_SEGMENTS.find(
    (s) => (s.from === a && s.to === b) || (s.from === b && s.to === a)
  );
  return s ? s.id : null;
}

function ensurePathTo(truck: Truck, destNode: string): void {
  if (truck.pathNodeIds.length >= 2) {
    const last = truck.pathNodeIds[truck.pathNodeIds.length - 1];
    if (last === destNode) return;
  }
  const cur = truck.pathNodeIds[truck.pathIndex] || truck.pathNodeIds[0] || 'N0';
  const p = shortestPath(cur, destNode);
  if (p) {
    truck.pathNodeIds = p.nodes;
    truck.pathIndex = 0;
  }
}

function setStatus(truck: Truck, s: TruckStatus) {
  truck.status = s;
}

function pushQueue(arr: string[], id: string) {
  if (!arr.includes(id)) arr.push(id);
}
function removeQueue(arr: string[], id: string) {
  const i = arr.indexOf(id);
  if (i >= 0) arr.splice(i, 1);
}

function addBookmark(
  state: SchedulerState,
  truckId: string,
  type: AccidentType,
  desc: string
) {
  state.bookmarks.push({
    id: `BK${state.bookmarks.length + 1}`,
    truckId,
    timestamp: state.elapsedSeconds,
    type,
    description: desc,
  });
}

export function simulateTick(state: SchedulerState): SchedulerState {
  state.tickCount++;
  state.elapsedSeconds += TICK_DT;

  const nm = nodeMap();
  const sm = segmentMap();

  EXCAVATORS.forEach((ex) => {
    ex.swingAngle = Math.sin(state.elapsedSeconds * 0.5 + parseInt(ex.id.slice(2), 10)) * 0.9;
    ex.armPitch = 0.3 + Math.sin(state.elapsedSeconds * 0.7 + 1) * 0.2;
    ex.bucketOpen = 0.5 + Math.sin(state.elapsedSeconds * 1.1 + 2) * 0.5;
    if (state.tickCount % 120 === 0) ex.cycleCount++;
  });

  const trucks = Object.values(state.trucks);

  for (const truck of trucks) {
    if (truck.status === 'broken') {
      truck.speed = 0;
      if (Math.random() < 0.0008) {
        setStatus(truck, 'idle');
        truck.safetyAlert = null;
      }
      continue;
    }

    const lp = state.loadingPoints[truck.targetLoadingPointId!];
    const ua = state.unloadingAreas[truck.targetUnloadingAreaId!];
    const lpNode = lp?.roadNodeId;
    const uaNode = ua?.roadNodeId;

    if (truck.status === 'idle') {
      if (!truck.targetLoadingPointId || !lp) {
        const mat = truck.material || (['coal', 'ore', 'waste'] as const)[Math.floor(Math.random() * 3)];
        const newLp = pickLoadingPointFor(mat);
        truck.targetLoadingPointId = newLp.id;
        truck.material = null;
      }
      ensurePathTo(truck, state.loadingPoints[truck.targetLoadingPointId!].roadNodeId);
      setStatus(truck, 'returning');
    }

    if (truck.status === 'returning') {
      if (truck.load > 0) {
        ensurePathTo(truck, uaNode!);
        setStatus(truck, 'hauling');
      } else {
        ensurePathTo(truck, lpNode!);
      }
    }

    if (truck.status === 'hauling') {
      ensurePathTo(truck, uaNode!);
    }

    const isHauling = truck.status === 'hauling';
    const isReturning = truck.status === 'returning';

    if (isHauling || isReturning) {
      if (truck.pathIndex >= truck.pathNodeIds.length - 1) {
        if (isHauling) {
          removeQueue(state.unloadingAreas[ua.id].queue, truck.id);
          pushQueue(state.unloadingAreas[ua.id].queue, truck.id);
          truck.queueRank = state.unloadingAreas[ua.id].queue.indexOf(truck.id) + 1;
          setStatus(truck, 'queuing_unload');
        } else {
          removeQueue(state.loadingPoints[lp.id].queue, truck.id);
          pushQueue(state.loadingPoints[lp.id].queue, truck.id);
          truck.queueRank = state.loadingPoints[lp.id].queue.indexOf(truck.id) + 1;
          setStatus(truck, 'queuing_load');
        }
        truck.speed = 0;
      } else {
        const from = truck.pathNodeIds[truck.pathIndex];
        const to = truck.pathNodeIds[truck.pathIndex + 1];
        const segId = findSegmentBetween(from, to);
        if (!segId) {
          truck.pathIndex++;
        } else {
          truck.currentSegmentId = segId;
          const seg = sm[segId];
          const segReverse = seg.from === to;
          let targetSpeed = seg.speedLimit;
          if (seg.congestionLevel === 1) targetSpeed *= 0.7;
          if (seg.congestionLevel === 2) targetSpeed *= 0.4;
          if (seg.congestionLevel === 3) targetSpeed *= 0.15;
          if (seg.direction !== 'flat') targetSpeed *= 0.75;
          if (truck.load > truck.capacity * 0.8) targetSpeed *= 0.85;

          const overspeed = Math.random() < 0.0005;
          if (overspeed) {
            targetSpeed = seg.speedLimit * 1.6;
            truck.safetyAlert = 'overspeed';
            addBookmark(state, truck.id, 'overspeed', `在${seg.id}段超速行驶`);
          } else if (truck.safetyAlert === 'overspeed' && Math.random() < 0.05) {
            truck.safetyAlert = null;
          }

          truck.speed = Math.max(
            2,
            truck.speed + (targetSpeed - truck.speed) * 0.08
          );

          const metersPerTick = METERS_PER_SEC(truck.speed) * TICK_DT;
          const delta = metersPerTick / seg.length;
          truck.progressOnSegment += delta;

          while (truck.progressOnSegment >= 1 && truck.pathIndex < truck.pathNodeIds.length - 1) {
            truck.progressOnSegment -= 1;
            truck.pathIndex++;
            const nf = truck.pathNodeIds[truck.pathIndex];
            const nt = truck.pathNodeIds[truck.pathIndex + 1];
            if (nt) {
              truck.currentSegmentId = findSegmentBetween(nf, nt);
            }
          }

          const curSeg = truck.currentSegmentId;
          if (curSeg) {
            const rev = truck.pathIndex < truck.pathNodeIds.length - 1
              ? sm[curSeg].from === truck.pathNodeIds[truck.pathIndex + 1]
              : false;
            const prog = Math.min(1, Math.max(0, truck.progressOnSegment));
            const info = posOnSegment(curSeg, prog, rev);
            truck.position = { x: info.x, y: info.y + 1.5, z: info.z };
            truck.heading = info.heading;
          }
        }
      }
    }

    if (truck.status === 'queuing_load') {
      pushQueue(lp.queue, truck.id);
      truck.queueRank = lp.queue.indexOf(truck.id) + 1;
      const rank = truck.queueRank;
      truck.speed = 0;
      const anchor = nm[lpNode!];
      const offset = rank * QUEUE_SPACING;
      truck.position = {
        x: anchor.x + Math.cos(rank * 0.6) * offset,
        y: anchor.y + 1.5,
        z: anchor.z + Math.sin(rank * 0.6) * offset - 10,
      };
      truck.heading = Math.atan2(anchor.x - truck.position.x, anchor.z - truck.position.z);
      if (rank === 1) {
        setStatus(truck, 'loading');
        truck.material = lp.material;
      }
    }

    if (truck.status === 'queuing_unload') {
      pushQueue(ua.queue, truck.id);
      truck.queueRank = ua.queue.indexOf(truck.id) + 1;
      const rank = truck.queueRank;
      truck.speed = 0;
      const anchor = nm[uaNode!];
      const offset = rank * QUEUE_SPACING;
      truck.position = {
        x: anchor.x + Math.cos(rank * 0.6) * offset,
        y: anchor.y + 1.5,
        z: anchor.z + Math.sin(rank * 0.6) * offset - 10,
      };
      truck.heading = Math.atan2(anchor.x - truck.position.x, anchor.z - truck.position.z);
      if (rank === 1) setStatus(truck, 'unloading');
    }

    if (truck.status === 'loading') {
      truck.speed = 0;
      const anchor = nm[lpNode!];
      truck.position = { x: anchor.x, y: anchor.y + 1.5, z: anchor.z - 6 };
      truck.heading = 0;
      truck.load = Math.min(truck.capacity, truck.load + (truck.capacity / 18));
      if (truck.load >= truck.capacity * 0.995) {
        truck.load = truck.capacity;
        removeQueue(lp.queue, truck.id);
        lp.queue.forEach((tid, i) => {
          state.trucks[tid].queueRank = i + 1;
        });
        ensurePathTo(truck, uaNode!);
        setStatus(truck, 'hauling');
      }
    }

    if (truck.status === 'unloading') {
      truck.speed = 0;
      const anchor = nm[uaNode!];
      truck.position = { x: anchor.x, y: anchor.y + 1.5, z: anchor.z - 6 };
      truck.heading = 0;
      truck.load = Math.max(0, truck.load - (truck.capacity / 14));
      if (truck.load <= 0.05) {
        truck.load = 0;
        removeQueue(ua.queue, truck.id);
        ua.queue.forEach((tid, i) => {
          state.trucks[tid].queueRank = i + 1;
        });
        const newLp = pickLoadingPointFor(truck.material || 'coal');
        truck.targetLoadingPointId = newLp.id;
        truck.material = null;
        ensurePathTo(truck, newLp.roadNodeId);
        setStatus(truck, 'returning');
      }
    }

    if (Math.random() < 0.00002 && truck.safetyAlert !== 'too_close') {
      truck.safetyAlert = 'too_close';
      truck.status = 'broken';
      truck.speed = 0;
      addBookmark(state, truck.id, 'collision', `疑似追尾碰撞，车速${truck.speed.toFixed(0)}km/h`);
    }

    if (state.tickCount % 2 === 0) {
      state.replayTracks[truck.id].push({
        t: state.elapsedSeconds,
        x: truck.position.x,
        y: truck.position.y,
        z: truck.position.z,
        status: truck.status,
        load: truck.load,
        speed: truck.speed,
      });
      const MAX = 2000;
      if (state.replayTracks[truck.id].length > MAX) {
        state.replayTracks[truck.id] = state.replayTracks[truck.id].slice(-MAX);
      }
    }

    truck.etaNextNode = truck.currentSegmentId
      ? Math.max(
          0,
          (sm[truck.currentSegmentId].length * (1 - truck.progressOnSegment)) /
            Math.max(0.001, METERS_PER_SEC(truck.speed || 1))
        )
      : 0;
  }

  for (const truck of trucks) {
    let minDist = 999;
    for (const other of trucks) {
      if (other.id === truck.id) continue;
      if (other.status === 'broken') continue;
      const dx = other.position.x - truck.position.x;
      const dy = other.position.y - truck.position.y;
      const dz = other.position.z - truck.position.z;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < minDist) minDist = d;
    }
    truck.distanceToNext = minDist;
    if (minDist < MIN_SAFETY_DISTANCE && truck.status !== 'broken') {
      truck.speed = Math.min(truck.speed, 5);
    }
  }

  Object.values(state.loadingPoints).forEach((l) => {
    l.avgWaitTime = l.queue.length * 1.5 + 4;
  });
  Object.values(state.unloadingAreas).forEach((u) => {
    u.avgWaitTime = u.queue.length * 1.2 + 3;
  });

  return state;
}

export function sampleTrackForRender(
  track: TrackSample[],
  maxPoints: number = 200
): TrackSample[] {
  if (track.length <= maxPoints) return track;
  const step = Math.ceil(track.length / maxPoints);
  const out: TrackSample[] = [];
  for (let i = 0; i < track.length; i += step) out.push(track[i]);
  if (out[out.length - 1] !== track[track.length - 1]) out.push(track[track.length - 1]);
  return out;
}

export function computeStats(state: SchedulerState, fps: number) {
  const trucks = Object.values(state.trucks);
  const inTransit = trucks.filter(
    (t) => t.status === 'hauling' || t.status === 'returning'
  ).length;
  const totalLoad = trucks.reduce((s, t) => s + t.load, 0);
  const loadedCount = trucks.filter((t) => t.load > 0).length || 1;
  const avgLoad = totalLoad / loadedCount;
  const totalQueue =
    Object.values(state.loadingPoints).reduce((s, l) => s + l.queue.length, 0) +
    Object.values(state.unloadingAreas).reduce((s, u) => s + u.queue.length, 0);
  const eff =
    (EXCAVATORS.reduce((s, e) => s + e.efficiency, 0) * (state.tickCount / 60000)) /
    Math.max(1, state.elapsedSeconds / 3600);
  const safetyCount = trucks.filter((t) => t.safetyAlert).length + trucks.filter((t) => t.status === 'broken').length;
  return {
    inTransitCount: inTransit,
    avgLoad: Math.round(avgLoad * 10) / 10,
    totalQueueLen: totalQueue,
    loadingEfficiency: Math.round(eff),
    safetyAlertCount: safetyCount,
    fps: Math.round(fps),
  };
}
