// Core logic for "Farqni top" (Spot the Difference): a 3x3 grid where 8
// tiles share one color and one tile is a subtly different shade. Levels
// get harder — the odd tile's lightness delta shrinks each level — until
// the player picks wrong. Whole run (however many levels cleared) is one
// day's play, same deterministic sequence for every player.

const LEVEL_SEED_PRIME = 7919;
const DAY_SEED_PRIME = 100003;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GRID_SIZE = 9;
const START_DELTA = 26; // lightness points at level 1 — obvious
const MIN_DELTA = 3; // floor — stays this hard forever past ~level 15
const DECAY = 0.85;

export function deltaForLevel(level) {
  return Math.max(MIN_DELTA, START_DELTA * Math.pow(DECAY, level - 1));
}

function clampL(l) {
  return Math.max(8, Math.min(92, l));
}

// Deterministic per (day, level) — every player sees the same grid.
export function generateLevel(dailyIndex, level) {
  const seed = dailyIndex * DAY_SEED_PRIME + level * LEVEL_SEED_PRIME;
  const rand = mulberry32(seed);
  const base = {
    h: Math.round(rand() * 360),
    s: Math.round(55 + rand() * 25),
    l: Math.round(45 + rand() * 15),
  };
  const delta = deltaForLevel(level);
  const direction = rand() < 0.5 ? -1 : 1;
  const odd = { ...base, l: clampL(base.l + direction * delta) };
  const oddIndex = Math.floor(rand() * GRID_SIZE);

  const grid = new Array(GRID_SIZE).fill(base);
  grid[oddIndex] = odd;

  return { grid, oddIndex, base, odd };
}

export function hslToCss({ h, s, l }) {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export { GRID_SIZE };
