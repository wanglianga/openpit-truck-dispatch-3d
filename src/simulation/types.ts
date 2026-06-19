export type MaterialType = 'coal' | 'ore' | 'waste';
export type Fleet = 'A' | 'B' | 'C' | 'D';
export type TruckStatus =
  | 'idle'
  | 'loading'
  | 'hauling'
  | 'queuing_load'
  | 'queuing_unload'
  | 'unloading'
  | 'returning'
  | 'broken';
export type RoadLevel = 0 | 1 | 2 | 3;
export type CongestionLevel = 0 | 1 | 2 | 3;
export type SlopeDirection = 'up' | 'down' | 'flat';
export type AccidentType = 'collision' | 'overspeed' | 'road_edge' | 'other';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface RoadNode {
  id: string;
  x: number;
  y: number;
  z: number;
}

export interface RoadSegment {
  id: string;
  from: string;
  to: string;
  level: RoadLevel;
  slope: number;
  speedLimit: number;
  direction: SlopeDirection;
  congestionLevel: CongestionLevel;
  dangerZone?: boolean;
  length: number;
}

export interface Truck {
  id: string;
  plateNo: string;
  fleet: Fleet;
  capacity: number;
  load: number;
  material: MaterialType | null;
  status: TruckStatus;
  speed: number;
  currentSegmentId: string | null;
  progressOnSegment: number;
  pathNodeIds: string[];
  pathIndex: number;
  position: Vec3;
  heading: number;
  distanceToNext: number;
  safetyAlert: 'too_close' | 'overspeed' | null;
  targetLoadingPointId?: string;
  targetUnloadingAreaId?: string;
  queueRank?: number;
  etaNextNode?: number;
}

export interface Excavator {
  id: string;
  name: string;
  loadingPointId: string;
  efficiency: number;
  swingAngle: number;
  armPitch: number;
  bucketOpen: number;
  cycleCount: number;
}

export interface LoadingPoint {
  id: string;
  name: string;
  position: Vec3;
  material: MaterialType;
  excavatorId: string;
  queue: string[];
  avgWaitTime: number;
  roadNodeId: string;
}

export interface UnloadingArea {
  id: string;
  name: string;
  position: Vec3;
  accepts: MaterialType[];
  queue: string[];
  avgWaitTime: number;
  roadNodeId: string;
}

export interface TrackSample {
  t: number;
  x: number;
  y: number;
  z: number;
  status: TruckStatus;
  load: number;
  speed: number;
}

export interface AccidentBookmark {
  id: string;
  truckId: string;
  timestamp: number;
  type: AccidentType;
  description: string;
}

export interface Stats {
  inTransitCount: number;
  avgLoad: number;
  totalQueueLen: number;
  loadingEfficiency: number;
  safetyAlertCount: number;
  fps: number;
}

export type PresetView = 'perspective' | 'top' | 'road' | 'closeup';
