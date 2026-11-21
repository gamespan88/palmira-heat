// Small deterministic helpers shared by every Palmira Heat system.
export function createSeededRandom(seed = 20261121) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
export function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function distance2D(a, b) { const dx = a.x - b.x; const dz = a.z - b.z; return Math.hypot(dx, dz); }
export function angleLerp(a, b, t) {
  let delta = (b - a) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return a + delta * clamp(t, 0, 1);
}
export function headingVector(yaw, target) { target.set(Math.sin(yaw), 0, Math.cos(yaw)); return target; }
export function isOnRoad(position, roads, width = 8) {
  return roads.some((coordinate) => Math.abs(position.x - coordinate) < width || Math.abs(position.z - coordinate) < width);
}
export function nearestRoadCoordinate(value, roads) {
  return roads.reduce((best, coordinate) => Math.abs(coordinate - value) < Math.abs(best - value) ? coordinate : best, roads[0]);
}
export function formatCash(amount) { return '$' + Math.round(amount).toLocaleString('en-US'); }
