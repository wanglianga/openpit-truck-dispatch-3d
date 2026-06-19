import type { RoadNode, RoadSegment } from './types';

export const ROAD_NODES: RoadNode[] = [
  { id: 'N0', x: 0, y: -40, z: 0 },
  { id: 'N1', x: 40, y: -38, z: -20 },
  { id: 'N2', x: 70, y: -32, z: 10 },
  { id: 'N3', x: 60, y: -24, z: 50 },
  { id: 'N4', x: 20, y: -18, z: 70 },
  { id: 'N5', x: -30, y: -12, z: 60 },
  { id: 'N6', x: -60, y: -6, z: 30 },
  { id: 'N7', x: -50, y: 0, z: -20 },
  { id: 'N8', x: -10, y: 0, z: -40 },
  { id: 'N9', x: 90, y: -30, z: 60 },
  { id: 'N10', x: 110, y: -18, z: 80 },
  { id: 'N11', x: 100, y: -6, z: 110 },
  { id: 'N12', x: 60, y: 6, z: 130 },
  { id: 'N13', x: 10, y: 12, z: 120 },
  { id: 'N14', x: -30, y: 18, z: 100 },
  { id: 'N15', x: -70, y: 24, z: 80 },
  { id: 'N16', x: -100, y: 30, z: 40 },
  { id: 'N17', x: -110, y: 36, z: -10 },
  { id: 'N18', x: -90, y: 42, z: -60 },
  { id: 'N19', x: -50, y: 48, z: -90 },
  { id: 'N20', x: 0, y: 54, z: -100 },
  { id: 'N21', x: 50, y: 60, z: -90 },
  { id: 'N22', x: 100, y: 66, z: -60 },
  { id: 'N23', x: 130, y: 72, z: -20 },
  { id: 'N24', x: 140, y: 78, z: 30 },
  { id: 'N25', x: 130, y: 84, z: 80 },
  { id: 'N26', x: 90, y: 90, z: 120 },
  { id: 'N27', x: 40, y: 96, z: 140 },
  { id: 'N28', x: -10, y: 100, z: 140 },
  { id: 'LP1_N', x: 25, y: -38, z: -5 },
  { id: 'LP2_N', x: -15, y: -38, z: 25 },
  { id: 'LP3_N', x: 100, y: -24, z: 95 },
  { id: 'UA1_N', x: -95, y: 44, z: -75 },
  { id: 'UA2_N', x: 135, y: 80, z: 55 },
  { id: 'UA3_N', x: -5, y: 98, z: 150 },
];

function nodeById(id: string): RoadNode {
  return ROAD_NODES.find((n) => n.id === id)!;
}

function segLen(a: RoadNode, b: RoadNode): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function slopeDir(from: RoadNode, to: RoadNode): 'up' | 'down' | 'flat' {
  const diff = to.y - from.y;
  if (diff > 0.5) return 'up';
  if (diff < -0.5) return 'down';
  return 'flat';
}

function slopePct(from: RoadNode, to: RoadNode): number {
  const dy = Math.abs(to.y - from.y);
  const d = segLen(from, to);
  if (d < 1) return 0;
  return Math.round((dy / d) * 1000) / 10;
}

type SegDef = {
  id: string;
  from: string;
  to: string;
  level: 0 | 1 | 2 | 3;
  limit: number;
  congestion: 0 | 1 | 2 | 3;
  danger?: boolean;
};

const DEFS: SegDef[] = [
  { id: 'S0', from: 'N0', to: 'N1', level: 0, limit: 30, congestion: 1 },
  { id: 'S1', from: 'N1', to: 'N2', level: 0, limit: 30, congestion: 0 },
  { id: 'S2', from: 'N2', to: 'N3', level: 0, limit: 30, congestion: 0 },
  { id: 'S3', from: 'N3', to: 'N4', level: 0, limit: 25, congestion: 1 },
  { id: 'S4', from: 'N4', to: 'N5', level: 0, limit: 25, congestion: 0, danger: true },
  { id: 'S5', from: 'N5', to: 'N6', level: 0, limit: 25, congestion: 0 },
  { id: 'S6', from: 'N6', to: 'N7', level: 0, limit: 30, congestion: 0 },
  { id: 'S7', from: 'N7', to: 'N8', level: 0, limit: 30, congestion: 2 },
  { id: 'S8', from: 'N8', to: 'N0', level: 0, limit: 30, congestion: 1 },

  { id: 'S9', from: 'N3', to: 'N9', level: 1, limit: 30, congestion: 1 },
  { id: 'S10', from: 'N9', to: 'N10', level: 1, limit: 25, congestion: 0 },
  { id: 'S11', from: 'N10', to: 'N11', level: 1, limit: 25, congestion: 0, danger: true },
  { id: 'S12', from: 'N11', to: 'N12', level: 1, limit: 30, congestion: 0 },
  { id: 'S13', from: 'N12', to: 'N13', level: 1, limit: 30, congestion: 0 },
  { id: 'S14', from: 'N13', to: 'N14', level: 1, limit: 30, congestion: 1 },
  { id: 'S15', from: 'N14', to: 'N15', level: 1, limit: 25, congestion: 0 },
  { id: 'S16', from: 'N15', to: 'N16', level: 1, limit: 25, congestion: 0 },
  { id: 'S17', from: 'N16', to: 'N17', level: 1, limit: 30, congestion: 0 },
  { id: 'S18', from: 'N17', to: 'N18', level: 1, limit: 25, congestion: 0, danger: true },
  { id: 'S19', from: 'N18', to: 'N19', level: 1, limit: 25, congestion: 0 },
  { id: 'S20', from: 'N19', to: 'N20', level: 1, limit: 30, congestion: 0 },
  { id: 'S21', from: 'N20', to: 'N21', level: 1, limit: 30, congestion: 1 },
  { id: 'S22', from: 'N21', to: 'N22', level: 1, limit: 25, congestion: 0 },
  { id: 'S23', from: 'N22', to: 'N23', level: 1, limit: 25, congestion: 0 },
  { id: 'S24', from: 'N23', to: 'N24', level: 1, limit: 30, congestion: 0 },
  { id: 'S25', from: 'N24', to: 'N25', level: 1, limit: 30, congestion: 0, danger: true },
  { id: 'S26', from: 'N25', to: 'N26', level: 1, limit: 25, congestion: 0 },
  { id: 'S27', from: 'N26', to: 'N27', level: 1, limit: 25, congestion: 0 },
  { id: 'S28', from: 'N27', to: 'N28', level: 1, limit: 30, congestion: 0 },

  { id: 'S29', from: 'N1', to: 'LP1_N', level: 3, limit: 10, congestion: 2 },
  { id: 'S30', from: 'N5', to: 'LP2_N', level: 3, limit: 10, congestion: 1 },
  { id: 'S31', from: 'N11', to: 'LP3_N', level: 3, limit: 10, congestion: 3 },

  { id: 'S32', from: 'N18', to: 'UA1_N', level: 2, limit: 15, congestion: 1 },
  { id: 'S33', from: 'N24', to: 'UA2_N', level: 2, limit: 15, congestion: 0 },
  { id: 'S34', from: 'N28', to: 'UA3_N', level: 2, limit: 15, congestion: 1 },

  { id: 'S35', from: 'N8', to: 'N20', level: 2, limit: 20, congestion: 0 },
  { id: 'S36', from: 'N13', to: 'N27', level: 2, limit: 20, congestion: 0 },
  { id: 'S37', from: 'N16', to: 'N6', level: 2, limit: 20, congestion: 0 },
];

export const ROAD_SEGMENTS: RoadSegment[] = DEFS.map((d) => {
  const a = nodeById(d.from);
  const b = nodeById(d.to);
  return {
    id: d.id,
    from: d.from,
    to: d.to,
    level: d.level,
    slope: slopePct(a, b),
    speedLimit: d.limit,
    direction: slopeDir(a, b),
    congestionLevel: d.congestion,
    dangerZone: d.danger,
    length: segLen(a, b),
  };
});

export function nodeMap(): Record<string, RoadNode> {
  const m: Record<string, RoadNode> = {};
  ROAD_NODES.forEach((n) => (m[n.id] = n));
  return m;
}

export function segmentMap(): Record<string, RoadSegment> {
  const m: Record<string, RoadSegment> = {};
  ROAD_SEGMENTS.forEach((s) => (m[s.id] = s));
  return m;
}

export function neighborsOf(
  nodeId: string
): { node: RoadNode; segment: RoadSegment }[] {
  const out: { node: RoadNode; segment: RoadSegment }[] = [];
  ROAD_SEGMENTS.forEach((s) => {
    if (s.from === nodeId) out.push({ node: nodeById(s.to), segment: s });
    else if (s.to === nodeId) out.push({ node: nodeById(s.from), segment: s });
  });
  return out;
}

export function shortestPath(
  startId: string,
  endId: string
): { nodes: string[]; segments: string[] } | null {
  if (startId === endId) return { nodes: [startId], segments: [] };
  const nm = nodeMap();
  const prev: Record<string, string | null> = {};
  const segPrev: Record<string, string | null> = {};
  const dist: Record<string, number> = {};
  Object.keys(nm).forEach((k) => {
    dist[k] = Infinity;
    prev[k] = null;
    segPrev[k] = null;
  });
  dist[startId] = 0;
  const queue = new Set(Object.keys(nm));

  while (queue.size) {
    let cur = '';
    let minD = Infinity;
    queue.forEach((q) => {
      if (dist[q] < minD) {
        minD = dist[q];
        cur = q;
      }
    });
    if (!cur || minD === Infinity) break;
    queue.delete(cur);
    if (cur === endId) break;

    for (const nb of neighborsOf(cur)) {
      const alt = dist[cur] + nb.segment.length + nb.segment.congestionLevel * 10;
      if (alt < dist[nb.node.id]) {
        dist[nb.node.id] = alt;
        prev[nb.node.id] = cur;
        segPrev[nb.node.id] = nb.segment.id;
      }
    }
  }

  if (!prev[endId] && startId !== endId) return null;
  const nodes: string[] = [];
  const segments: string[] = [];
  let cur: string | null = endId;
  while (cur) {
    nodes.unshift(cur);
    const s = segPrev[cur];
    if (s) segments.unshift(s);
    cur = prev[cur];
  }
  return { nodes, segments };
}
