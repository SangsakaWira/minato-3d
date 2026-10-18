const KEY = 'minato-save-v1';
export const PLOT_COUNT = 12;

export function freshState() {
  return {
    v: 1,
    day: 1,
    minutes: 360,
    weather: 'cerah',
    coins: 100,
    inv: { seed_lobak: 6 },
    selectedSeed: 'seed_lobak',
    rod: 1,
    plots: Array.from({ length: PLOT_COUNT }, () => ({ tilled: false, crop: null, stage: 0, watered: false })),
    friend: {},
    met: {},
    talked: {},
    gifted: {},
    quests: {},
    stats: { fish: 0, harvest: 0 },
    player: null,
  };
}

// One shared, mutable object so every module sees the same save.
export const state = freshState();

function replace(data) {
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, data);
}

export function resetState() { replace(freshState()); }

export function hasSave() {
  try { return !!localStorage.getItem(KEY); } catch { return false; }
}

export function load() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    if (data?.v !== 1) return false;
    const base = freshState();
    replace({ ...base, ...data, stats: { ...base.stats, ...data.stats } });
    if (!Array.isArray(state.plots) || state.plots.length !== PLOT_COUNT) state.plots = base.plots;
    return true;
  } catch {
    return false;
  }
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable: play without saving */ }
}

export const count = id => state.inv[id] ?? 0;
export function addItem(id, n = 1) { state.inv[id] = count(id) + n; }
export function removeItem(id, n = 1) {
  const left = count(id) - n;
  if (left > 0) state.inv[id] = left; else delete state.inv[id];
}
