// Core logic for "Xotira o'yini" (Memory Match): a 4x4 grid of 8 emoji
// pairs, face down. Flip two at a time; a match stays face up, a mismatch
// flips back. One deterministic layout per day — every player sees the
// exact same board, so "fewest moves" is a fair daily leaderboard metric.

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

// A pool larger than PAIRS so different days pick a different subset, not
// just a different arrangement of the same 8 symbols.
const EMOJI_POOL = [
  "🍎", "🍋", "🍇", "🍓", "🍉", "🍒", "🍑", "🥝", "🍍", "🥑",
  "🌽", "🌸", "🌵", "🌙", "⭐", "🔥", "💧", "⚡", "🎈", "🎨",
  "🎵", "🎲", "🚀", "⚽", "🏀", "🎯", "🎁", "🔑", "💎", "🦋",
  "🐝", "🐢", "🐬", "🦄", "🐸", "🦁", "🐼", "🐨", "🦉", "🍕",
];

export const PAIRS = 8;
export const GRID_SIZE = PAIRS * 2;

function shuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Deterministic per dailyIndex — both which 8 emojis are chosen and how the
// 16 cards are laid out are seeded from the same day, so every player faces
// an identical board.
export function generateBoard(dailyIndex) {
  const rand = mulberry32(dailyIndex * 2654435761 + 11);
  const chosen = shuffle(EMOJI_POOL, rand).slice(0, PAIRS);
  const doubled = shuffle([...chosen, ...chosen], rand);
  return doubled.map((emoji, id) => ({ id, emoji }));
}
