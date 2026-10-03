// Core logic for Sanoq (Counting): a cup fills with a random number of
// shapes — balls, cubes, pyramids, stars, mixed together at higher rounds —
// and the player guesses the total. One "oʻyin" is ROUNDS rounds, each
// harder than the last (more shapes, more shape kinds mixed in, and in
// Tezkor mode, less time to look before the cup is covered). Scoring gives
// partial credit the closer a guess is, rather than pass/fail, so every
// round contributes to the run's total score.

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

function shuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const SHAPE_KINDS = [
  { id: "ball", emoji: "⚫" },
  { id: "cube", emoji: "🟧" },
  { id: "pyramid", emoji: "🔺" },
  { id: "star", emoji: "⭐" },
];

export const ROUNDS = 8;
export const MAX_SCORE = ROUNDS * 100;

// Each round steps up difficulty: a wider shape-count range, more distinct
// shape kinds mixed into the same cup, and (Tezkor mode only) fewer seconds
// to study the cup before it's covered.
const LEVELS = [
  { range: [4, 6], kinds: 1, reveal: 6 },
  { range: [6, 9], kinds: 1, reveal: 5 },
  { range: [8, 12], kinds: 2, reveal: 5 },
  { range: [10, 14], kinds: 2, reveal: 4 },
  { range: [12, 16], kinds: 2, reveal: 4 },
  { range: [14, 18], kinds: 3, reveal: 3 },
  { range: [16, 20], kinds: 3, reveal: 3 },
  { range: [18, 24], kinds: 4, reveal: 3 },
];

const GRID_COLS = 6;
const GRID_ROWS = 5;
const GRID_CELLS = GRID_COLS * GRID_ROWS;

export function levelFor(roundIndex) {
  return LEVELS[Math.min(roundIndex, LEVELS.length - 1)];
}

// A fresh random seed per run (not tied to the calendar day) — unlimited
// replay, so every run gets a genuinely different sequence of cups.
export function randomSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

// Lays shapes out on a loose grid (shuffled cell order, each with a little
// jitter) so they never overlap, instead of fully free-form coordinates.
export function generateRound(seed, roundIndex) {
  const level = levelFor(roundIndex);
  const rand = mulberry32((seed * 2654435761 + roundIndex * 7919 + 13) >>> 0);
  const [min, max] = level.range;
  const actual = min + Math.floor(rand() * (max - min + 1));
  const kinds = SHAPE_KINDS.slice(0, level.kinds);

  const cells = shuffle(
    Array.from({ length: GRID_CELLS }, (_, i) => i),
    rand
  ).slice(0, actual);

  const items = cells.map((cell) => {
    const col = cell % GRID_COLS;
    const row = Math.floor(cell / GRID_COLS);
    const jitterX = (rand() - 0.5) * 9;
    const jitterY = (rand() - 0.5) * 9;
    const leftPct = ((col + 0.5) / GRID_COLS) * 100 + jitterX;
    const topPct = ((row + 0.5) / GRID_ROWS) * 100 + jitterY;
    const kind = kinds[Math.floor(rand() * kinds.length)];
    return { kind: kind.id, emoji: kind.emoji, leftPct, topPct };
  });

  return { actual, items, reveal: level.reveal };
}

// Full points for an exact guess; partial credit shrinking with how far off
// (as a fraction of the true count) the guess is, floored at 0.
export function scoreForGuess(guess, actual) {
  if (!Number.isFinite(guess) || guess < 0) return 0;
  if (guess === actual) return 100;
  const pct = Math.abs(guess - actual) / actual;
  return Math.max(0, Math.round(100 * (1 - pct)));
}
