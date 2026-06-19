export const COLORS = {
  bg: '#0A1628',
  panel: '#1E2A3A',
  panelBorder: '#2A3A50',
  accent: '#FF7A1A',
  accentGlow: 'rgba(255,122,26,0.35)',

  materialCoal: '#1A1A1A',
  materialOre: '#C23B22',
  materialWaste: '#6B8E23',

  statusOk: '#43A047',
  statusWarning: '#FFB300',
  statusDanger: '#E53935',
  statusIdle: '#78909C',

  fleetA: '#FF7A1A',
  fleetB: '#29B6F6',
  fleetC: '#AB47BC',
  fleetD: '#66BB6A',

  roadMain: '#8B7355',
  roadSecondary: '#6B5B45',
  roadBranch: '#5A4A38',
  roadWork: '#4A3A28',
  roadEdge: '#C9A86C',

  congestion0: '#43A047',
  congestion1: '#FFB300',
  congestion2: '#FB8C00',
  congestion3: '#E53935',

  terrainTerrace: '#8D7A5B',
  terrainTerraceDark: '#6B5A40',
  terrainSlope: '#5D4E37',
  terrainBottom: '#3E3325',

  danger: 'rgba(229,57,53,0.35)',
  dangerBorder: '#E53935',
  loadingZone: 'rgba(255,122,26,0.25)',
  unloadingZone: 'rgba(41,182,246,0.25)',

  nightSky: '#080E1A',
  nightFog: '#0A1628',
  daySky: '#87CEEB',
  dayFog: '#E0E8F0',

  streetLamp: '#FFD27F',
  headLight: '#FFF4D6',
  tailLight: '#FF4444',
} as const;

export function fleetColor(f: string): string {
  switch (f) {
    case 'A':
      return COLORS.fleetA;
    case 'B':
      return COLORS.fleetB;
    case 'C':
      return COLORS.fleetC;
    case 'D':
      return COLORS.fleetD;
    default:
      return COLORS.accent;
  }
}

export function materialColor(m: string | null): string {
  switch (m) {
    case 'coal':
      return COLORS.materialCoal;
    case 'ore':
      return COLORS.materialOre;
    case 'waste':
      return COLORS.materialWaste;
    default:
      return '#555';
  }
}

export function roadColor(level: number): string {
  switch (level) {
    case 0:
      return COLORS.roadMain;
    case 1:
      return COLORS.roadSecondary;
    case 2:
      return COLORS.roadBranch;
    default:
      return COLORS.roadWork;
  }
}

export function congestionColor(c: number): string {
  switch (c) {
    case 0:
      return COLORS.congestion0;
    case 1:
      return COLORS.congestion1;
    case 2:
      return COLORS.congestion2;
    default:
      return COLORS.congestion3;
  }
}

export function statusLabel(s: string): string {
  const map: Record<string, string> = {
    idle: '待命',
    loading: '装载中',
    hauling: '运输中',
    queuing_load: '装载排队',
    queuing_unload: '卸料排队',
    unloading: '卸料中',
    returning: '空返中',
    broken: '故障',
  };
  return map[s] || s;
}

export function materialLabel(m: string | null): string {
  switch (m) {
    case 'coal':
      return '原煤';
    case 'ore':
      return '矿石';
    case 'waste':
      return '废石';
    default:
      return '空车';
  }
}
