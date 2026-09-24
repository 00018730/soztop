// Core 2048 logic: a 4x4 grid of power-of-two tiles (or null), slid and
// merged in one of 4 directions. Free play, not a daily puzzle — every
// board is randomly generated, so there's no seeded-per-day determinism
// here unlike the other daily games.

export const SIZE = 4;
export const WIN_VALUE = 2048;

export function emptyBoard() {
  return Array.from({ length: SIZE }, () => new Array(SIZE).fill(null));
}

function emptyCells(board) {
  const out = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] == null) out.push([r, c]);
    }
  }
  return out;
}

// Mutates nothing — returns a new board with one random tile placed in an
// empty cell (90% a 2, 10% a 4), or the same board unchanged if it's full.
export function addRandomTile(board) {
  const cells = emptyCells(board);
  if (cells.length === 0) return board;
  const [r, c] = cells[Math.floor(Math.random() * cells.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  const next = board.map((row) => row.slice());
  next[r][c] = value;
  return next;
}

export function startingBoard() {
  return addRandomTile(addRandomTile(emptyBoard()));
}

// Slides+merges one line (array of SIZE cells) toward index 0. Each tile
// merges at most once per move (the classic 2048 rule — a freshly-merged
// tile doesn't merge again in the same move). Returns { line, gained }.
function collapseLine(line) {
  const values = line.filter((v) => v != null);
  const out = [];
  let gained = 0;
  for (let i = 0; i < values.length; i++) {
    if (i + 1 < values.length && values[i] === values[i + 1]) {
      const merged = values[i] * 2;
      out.push(merged);
      gained += merged;
      i++; // consume the pair
    } else {
      out.push(values[i]);
    }
  }
  while (out.length < SIZE) out.push(null);
  return { line: out, gained };
}

function transpose(board) {
  return board[0].map((_, c) => board.map((row) => row[c]));
}

// direction: "left" | "right" | "up" | "down". Returns { board, moved,
// gained } — `moved` is false (and `board` the identical reference) when
// the move changes nothing, so callers know not to spawn a new tile.
export function moveBoard(board, direction) {
  let rows =
    direction === "up" || direction === "down" ? transpose(board) : board.map((row) => row.slice());

  if (direction === "right" || direction === "down") {
    rows = rows.map((row) => row.slice().reverse());
  }

  let gained = 0;
  rows = rows.map((row) => {
    const { line, gained: g } = collapseLine(row);
    gained += g;
    return line;
  });

  if (direction === "right" || direction === "down") {
    rows = rows.map((row) => row.slice().reverse());
  }

  const next = direction === "up" || direction === "down" ? transpose(rows) : rows;

  const moved = JSON.stringify(next) !== JSON.stringify(board);
  return { board: moved ? next : board, moved, gained };
}

const DIRECTIONS = ["left", "right", "up", "down"];

export function hasMoves(board) {
  if (emptyCells(board).length > 0) return true;
  return DIRECTIONS.some((dir) => moveBoard(board, dir).moved);
}

export function highestTile(board) {
  let max = 0;
  for (const row of board) {
    for (const v of row) {
      if (v != null && v > max) max = v;
    }
  }
  return max;
}

export function hasWinningTile(board) {
  return highestTile(board) >= WIN_VALUE;
}
