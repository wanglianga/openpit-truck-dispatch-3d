import type {
  Truck,
  Fleet,
  MaterialType,
  Excavator,
  LoadingPoint,
  UnloadingArea,
  Vec3,
} from './types';
import { nodeMap, ROAD_NODES, shortestPath } from './roadData';

const FLEETS: Fleet[] = ['A', 'B', 'C', 'D'];
const MATERIALS: MaterialType[] = ['coal', 'ore', 'waste'];

function fleetMaterial(fleet: Fleet): MaterialType {
  switch (fleet) {
    case 'A':
      return 'coal';
    case 'B':
      return 'ore';
    case 'C':
      return 'waste';
    case 'D':
      return 'coal';
  }
}

export const LOADING_POINTS: LoadingPoint[] = [
  {
    id: 'LP1',
    name: '1号采煤工作面',
    position: { x: 25, y: -38, z: -5 },
    material: 'coal',
    excavatorId: 'EX1',
    queue: [],
    avgWaitTime: 8,
    roadNodeId: 'LP1_N',
  },
  {
    id: 'LP2',
    name: '2号采煤工作面',
    position: { x: -15, y: -38, z: 25 },
    material: 'ore',
    excavatorId: 'EX2',
    queue: [],
    avgWaitTime: 6,
    roadNodeId: 'LP2_N',
  },
  {
    id: 'LP3',
    name: '3号剥离工作面',
    position: { x: 100, y: -24, z: 95 },
    material: 'waste',
    excavatorId: 'EX3',
    queue: [],
    avgWaitTime: 10,
    roadNodeId: 'LP3_N',
  },
];

export const UNLOADING_AREAS: UnloadingArea[] = [
  {
    id: 'UA1',
    name: '1号选煤厂',
    position: { x: -95, y: 44, z: -75 },
    accepts: ['coal'],
    queue: [],
    avgWaitTime: 5,
    roadNodeId: 'UA1_N',
  },
  {
    id: 'UA2',
    name: '2号矿石堆场',
    position: { x: 135, y: 80, z: 55 },
    accepts: ['ore'],
    queue: [],
    avgWaitTime: 4,
    roadNodeId: 'UA2_N',
  },
  {
    id: 'UA3',
    name: '3号排土场',
    position: { x: -5, y: 98, z: 150 },
    accepts: ['waste', 'ore'],
    queue: [],
    avgWaitTime: 6,
    roadNodeId: 'UA3_N',
  },
];

export const EXCAVATORS: Excavator[] = [
  {
    id: 'EX1',
    name: 'CAT-6060-01',
    loadingPointId: 'LP1',
    efficiency: 800,
    swingAngle: 0,
    armPitch: 0.3,
    bucketOpen: 0.5,
    cycleCount: 0,
  },
  {
    id: 'EX2',
    name: 'CAT-6060-02',
    loadingPointId: 'LP2',
    efficiency: 750,
    swingAngle: 0,
    armPitch: 0.3,
    bucketOpen: 0.5,
    cycleCount: 0,
  },
  {
    id: 'EX3',
    name: 'PC-2000-03',
    loadingPointId: 'LP3',
    efficiency: 650,
    swingAngle: 0,
    armPitch: 0.3,
    bucketOpen: 0.5,
    cycleCount: 0,
  },
];

export function loadingPointMap(): Record<string, LoadingPoint> {
  const m: Record<string, LoadingPoint> = {};
  LOADING_POINTS.forEach((l) => (m[l.id] = l));
  return m;
}

export function unloadingAreaMap(): Record<string, UnloadingArea> {
  const m: Record<string, UnloadingArea> = {};
  UNLOADING_AREAS.forEach((u) => (m[u.id] = u));
  return m;
}

export function excavatorMap(): Record<string, Excavator> {
  const m: Record<string, Excavator> = {};
  EXCAVATORS.forEach((e) => (m[e.id] = e));
  return m;
}

export function pickLoadingPointFor(material: MaterialType): LoadingPoint {
  const options = LOADING_POINTS.filter((l) => l.material === material);
  return options[Math.floor(Math.random() * options.length)] || LOADING_POINTS[0];
}

export function pickUnloadingAreaFor(material: MaterialType): UnloadingArea {
  const options = UNLOADING_AREAS.filter((u) => u.accepts.includes(material));
  return options[Math.floor(Math.random() * options.length)] || UNLOADING_AREAS[0];
}

const CAPACITIES = [91, 108, 136, 172, 220, 290];

export function createTruck(index: number): Truck {
  const fleet = FLEETS[index % FLEETS.length];
  const material = fleetMaterial(fleet);
  const capacity = CAPACITIES[index % CAPACITIES.length];

  const startNodes = ['N0', 'N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8'];
  const startNode = startNodes[index % startNodes.length];
  const node = nodeMap()[startNode];

  const lp = pickLoadingPointFor(material);
  const ua = pickUnloadingAreaFor(material);

  const path = shortestPath(startNode, lp.roadNodeId);
  const pathNodeIds = path ? path.nodes : [startNode, lp.roadNodeId];

  return {
    id: `T${String(index + 1).padStart(3, '0')}`,
    plateNo: `矿${fleet}-${String(1000 + index)}`,
    fleet,
    capacity,
    load: 0,
    material: null,
    status: 'returning',
    speed: 0,
    currentSegmentId: null,
    progressOnSegment: 0,
    pathNodeIds,
    pathIndex: 0,
    position: { x: node.x, y: node.y, z: node.z },
    heading: Math.random() * Math.PI * 2,
    distanceToNext: 50 + Math.random() * 30,
    safetyAlert: null,
    targetLoadingPointId: lp.id,
    targetUnloadingAreaId: ua.id,
    queueRank: undefined,
    etaNextNode: 0,
  };
}

export function createFleet(count: number): Truck[] {
  return Array.from({ length: count }, (_, i) => createTruck(i));
}

export const TERRACE_RADIUS = 200;
export const TERRACE_HEIGHT_STEP = 12;
export const TERRACE_LEVELS = 8;
export const TERRACE_WIDTH = 14;

export interface TerraceInfo {
  index: number;
  y: number;
  innerR: number;
  outerR: number;
}

export function terraces(): TerraceInfo[] {
  const arr: TerraceInfo[] = [];
  for (let i = 0; i < TERRACE_LEVELS; i++) {
    const outerR = 30 + (TERRACE_LEVELS - i) * TERRACE_WIDTH;
    arr.push({
      index: i,
      y: -40 + i * TERRACE_HEIGHT_STEP,
      innerR: outerR - TERRACE_WIDTH,
      outerR,
    });
  }
  return arr;
}

export function streetLightPositions(): Vec3[] {
  const lights: Vec3[] = [];
  const ringNodes = [
    ['N0', 'N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8'],
    ['N9', 'N10', 'N11', 'N12', 'N13', 'N14', 'N15', 'N16', 'N17', 'N18', 'N19', 'N20', 'N21', 'N22', 'N23', 'N24', 'N25', 'N26', 'N27', 'N28'],
  ];
  const nm = nodeMap();
  ringNodes.forEach((ring) => {
    for (let i = 0; i < ring.length; i++) {
      const a = nm[ring[i]];
      const b = nm[ring[(i + 1) % ring.length]];
      const steps = 4;
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        lights.push({
          x: a.x + (b.x - a.x) * t,
          y: Math.max(a.y, b.y) + 6,
          z: a.z + (b.z - a.z) * t,
        });
      }
    }
  });
  return lights;
}

export function dangerZones(): { center: Vec3; radius: number }[] {
  return [
    { center: { x: -10, y: -15, z: 70 }, radius: 32 },
    { center: { x: 105, y: -15, z: 90 }, radius: 28 },
    { center: { x: -95, y: 38, z: -50 }, radius: 34 },
    { center: { x: 135, y: 82, z: 55 }, radius: 30 },
  ];
}
