// Core logic for "15 boshqotirma" (the 15 puzzle): a 4x4 grid of 15
// numbered tiles plus one blank cell, slid into row-major order. One
// deterministic scramble per day — every player starts from the exact
// same shuffled board, so "fewest moves" is a fair daily leaderboard
// metric, same as Xotira o'yini.

export const SIZE = 4;
export const TOTAL = SIZE * SIZE; // 16 cells: 15 numbered tiles + 1 blank

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

export function solvedBoard() {
  const board = Array.from({ length: TOTAL - 1 }, (_, i) => i + 1);
  board.push(null); // blank, bottom-right
  return board;
}

export function isSolved(board) {
  const solved = solvedBoard();
  return board.every((v, i) => v === solved[i]);
}

function neighbors(blank) {
  const r = Math.floor(blank / SIZE);
  const c = blank % SIZE;
  const out = [];
  if (r > 0) out.push(blank - SIZE);
  if (r < SIZE - 1) out.push(blank + SIZE);
  if (c > 0) out.push(blank - 1);
  if (c < SIZE - 1) out.push(blank + 1);
  return out;
}

// A raw random permutation of 16 tiles is only solvable half the time (the
// 15-puzzle has a strict parity constraint). Scrambling by performing a
// long seeded sequence of legal slides from the solved state sidesteps
// that entirely — the result is always solvable by construction — while
// still mixing the board thoroughly. Never immediately undoing the
// previous move keeps it from wasting moves shuffling in place.
const SCRAMBLE_MOVES = 120;

export function generateDaily(dailyIndex) {
  const rand = mulberry32(dailyIndex * 2654435761 + 23);
  let board = solvedBoard();
  let blank = TOTAL - 1;
  let lastBlank = -1;
  for (let i = 0; i < SCRAMBLE_MOVES; i++) {
    const options = neighbors(blank).filter((n) => n !== lastBlank);
    const pick = options[Math.floor(rand() * options.length)];
    const next = board.slice();
    next[blank] = next[pick];
    next[pick] = null;
    lastBlank = blank;
    board = next;
    blank = pick;
  }
  return board;
}

// Slides the tile at `index` into the blank if they're adjacent. Returns
// { board, moved } — `moved` is false (same board reference) for an
// illegal tap, so callers know not to count it as a move.
export function slide(board, index) {
  const blank = board.indexOf(null);
  if (!neighbors(blank).includes(index)) return { board, moved: false };
  const next = board.slice();
  next[blank] = next[index];
  next[index] = null;
  return { board: next, moved: true };
}
