// localStorage persistence: only progression, cash and a safe respawn point are stored.
import { SAVE_KEY } from './config.js';
export function loadSavedGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data.cash !== 'number' || typeof data.missionIndex !== 'number') return null;
    return data;
  } catch { return null; }
}
export function writeSavedGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      cash: Math.round(state.cash),
      missionIndex: state.missionIndex,
      storyComplete: Boolean(state.storyComplete),
      taxiFares: state.taxiFares || 0,
      position: { x: state.player.position.x, z: state.player.position.z },
      savedAt: new Date().toISOString(),
    }));
    return true;
  } catch { return false; }
}
export function clearSavedGame() { try { localStorage.removeItem(SAVE_KEY); } catch { /* private mode */ } }
