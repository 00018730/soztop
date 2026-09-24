// Core logic for the Color Match daily game: a deterministic target color
// for the day, and a perceptual closeness score between two RGB colors.
// No word list involved, so unlike words.js's dailyIndexForDate (which
// wraps around a finite list), this index only ever grows — it's a seed,
// not a lookup position.

const DAILY_EPOCH_UTC = Date.UTC(2024, 0, 1);

export function colorDailyIndex(date) {
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.max(0, Math.floor((today - DAILY_EPOCH_UTC) / 86400000));
}

// Small seeded PRNG (mulberry32) so the same dailyIndex always produces the
// same color for every player, without needing a stored word list.
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

// Channels are clamped away from the very extremes (pure black/white) so
// every day's color is actually distinguishable and fun to match.
const CHANNEL_MIN = 16;
const CHANNEL_MAX = 239;

export function colorForDailyIndex(dailyIndex) {
  const rand = mulberry32(dailyIndex * 2654435761 + 1);
  const chan = () => Math.round(CHANNEL_MIN + rand() * (CHANNEL_MAX - CHANNEL_MIN));
  return { r: chan(), g: chan(), b: chan() };
}

export function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export function rgbToCss({ r, g, b }) {
  return `rgb(${r}, ${g}, ${b})`;
}

// "Redmean" perceptual RGB distance — a cheap, well-known approximation of
// how different two colors actually look to the eye, weighting each channel
// by how much red is involved (https://www.compuphase.com/cmetric.htm).
function redmeanDistance(a, b) {
  const rmean = (a.r + b.r) / 2;
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt((2 + rmean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rmean) / 256) * db * db);
}

const MAX_DISTANCE = redmeanDistance({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });

// 0-100 closeness score, 100 = exact match.
export function colorScore(target, guess) {
  const distance = redmeanDistance(target, guess);
  const score = Math.round(100 * (1 - distance / MAX_DISTANCE));
  return Math.max(0, Math.min(100, score));
}

export function scoreLabel(score) {
  if (score >= 97) return "Mukammal!";
  if (score >= 90) return "Aʼlo!";
  if (score >= 75) return "Yaxshi";
  if (score >= 50) return "Yomon emas";
  return "Keyingi safar aniqroq boʻladi";
}

export const REVEAL_SECONDS = 5;
