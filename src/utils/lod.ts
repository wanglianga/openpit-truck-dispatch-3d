import * as THREE from 'three';

export const LOD_DISTANCE_CLOSE = 80;
export const LOD_DISTANCE_MEDIUM = 180;

export type LodLevel = 'high' | 'medium' | 'low';

export function distanceToCamera(
  worldPos: { x: number; y: number; z: number },
  camera: THREE.Camera
): number {
  const dx = worldPos.x - camera.position.x;
  const dy = worldPos.y - camera.position.y;
  const dz = worldPos.z - camera.position.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function lodLevel(distance: number): LodLevel {
  if (distance < LOD_DISTANCE_CLOSE) return 'high';
  if (distance < LOD_DISTANCE_MEDIUM) return 'medium';
  return 'low';
}

export const HIGH_DETAIL_MAX = 25;
export const MEDIUM_DETAIL_MAX = 80;

export function shouldRenderLabel(
  distance: number,
  isSelected: boolean,
  isHovered: boolean,
  showAll: boolean
): boolean {
  if (isSelected || isHovered) return true;
  if (!showAll) return false;
  return distance < LOD_DISTANCE_MEDIUM * 1.2;
}

export function sampleTrack<T extends { x: number; y: number; z: number }>(
  pts: T[],
  maxPts: number
): T[] {
  if (pts.length <= maxPts) return pts;
  const step = Math.ceil(pts.length / maxPts);
  const out: T[] = [];
  for (let i = 0; i < pts.length; i += step) out.push(pts[i]);
  if (out[out.length - 1] !== pts[pts.length - 1]) out.push(pts[pts.length - 1]);
  return out;
}
