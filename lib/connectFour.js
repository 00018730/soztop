// Core Connect Four logic, shared by every mode (vs computer, two players
// local, and — via the server-side mirror in the Supabase migration —
// online). Board is a ROWS x COLS grid, row 0 = top, each cell
// "x" | "o" | null. Discs drop to the lowest empty row in a column.

export const ROWS = 6;
export const COLS = 7;

export function emptyBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(null));
}

// The online match's board comes from Postgres as a flat 42-cell array
// (row-major) — see the connectfour_online migration — while every local
// function here works on the 2D ROWS x COLS shape. These convert between
// the two without either side needing to know about the other's layout.
export function flatToBoard(flat) {
  const board = emptyBoard();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      board[r][c] = flat[r * COLS + c] ?? null;
    }
  }
  return board;
}

export function validColumns(board) {
  const out = [];
  for (let c = 0; c < COLS; c++) if (board[0][c] == null) out.push(c);
  return out;
}

// Returns { board, row } for the new state after dropping `mark` into
// `col`, or null if the column is already full.
export function dropDisc(board, col, mark) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] == null) {
      const next = board.map((row) => row.slice());
      next[r][col] = mark;
      return { board: next, row: r };
    }
  }
  return null;
}

const DIRECTIONS = [
  [0, 1], // horizontal
  [1, 0], // vertical
  [1, 1], // diagonal down-right
  [1, -1], // diagonal down-left
];

// Returns null (game continues), or { winner: "x" | "o", line } / { winner: "draw", line: null }.
export function checkWinner(board) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const mark = board[r][c];
      if (!mark) continue;
      for (const [dr, dc] of DIRECTIONS) {
        const line = [[r, c]];
        for (let i = 1; i < 4; i++) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== mark) break;
          line.push([nr, nc]);
        }
        if (line.length === 4) return { winner: mark, line };
      }
    }
  }
  if (validColumns(board).length === 0) return { winner: "draw", line: null };
  return null;
}

function other(mark) {
  return mark === "x" ? "o" : "x";
}

function winningColumn(board, mark) {
  for (const col of validColumns(board)) {
    const { board: next } = dropDisc(board, col, mark);
    const result = checkWinner(next);
    if (result && result.winner === mark) return col;
  }
  return null;
}

// "Easy": mostly random, occasionally smart enough to take an obvious win
// or block an obvious loss — pure randomness feels like a broken button
// rather than an opponent.
export function easyMove(board, mark) {
  const cols = validColumns(board);
  if (Math.random() < 0.35) {
    const win = winningColumn(board, mark);
    if (win != null) return win;
  }
  if (Math.random() < 0.35) {
    const block = winningColumn(board, other(mark));
    if (block != null) return block;
  }
  return cols[Math.floor(Math.random() * cols.length)];
}

// --- "Hard": depth-limited minimax with alpha-beta pruning + a positional
// heuristic. Full-depth search is infeasible for Connect Four (~4.5 trillion
// positions), so this uses the standard windowed-heuristic approach: score
// every possible 4-in-a-row "window" by how many of the AI's/opponent's
// discs occupy it, plus a center-column bias (center disks take part in the
// most possible lines). Depth 5 with center-first move ordering plays a
// genuinely strong, non-trivial game in well under 100ms in the browser.

const CENTER_COL = Math.floor(COLS / 2);
const SEARCH_DEPTH = 5;

function evaluateWindow(cells, mark) {
  const opp = other(mark);
  const markCount = cells.filter((v) => v === mark).length;
  const oppCount = cells.filter((v) => v === opp).length;
  const emptyCount = cells.filter((v) => v == null).length;

  if (markCount === 4) return 100;
  if (markCount === 3 && emptyCount === 1) return 5;
  if (markCount === 2 && emptyCount === 2) return 2;
  if (oppCount === 3 && emptyCount === 1) return -4;
  return 0;
}

function scorePosition(board, mark) {
  let score = 0;

  for (let r = 0; r < ROWS; r++) {
    score += board[r][CENTER_COL] === mark ? 3 : 0;
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += evaluateWindow([board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]], mark);
    }
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      score += evaluateWindow([board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]], mark);
    }
  }
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += evaluateWindow(
        [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]],
        mark
      );
    }
  }
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += evaluateWindow(
        [board[r][c], board[r - 1][c + 1], board[r - 2][c + 2], board[r - 3][c + 3]],
        mark
      );
    }
  }
  return score;
}

function orderedColumns(board) {
  return validColumns(board).sort((a, b) => Math.abs(a - CENTER_COL) - Math.abs(b - CENTER_COL));
}

function minimax(board, depth, alpha, beta, maximizing, mark) {
  const opp = other(mark);
  const result = checkWinner(board);
  const cols = validColumns(board);

  if (result) {
    if (result.winner === "draw") return { score: 0 };
    return { score: result.winner === mark ? 1_000_000 + depth : -1_000_000 - depth };
  }
  if (depth === 0 || cols.length === 0) {
    return { score: scorePosition(board, mark) };
  }

  const ordered = orderedColumns(board);
  if (maximizing) {
    let best = -Infinity;
    let bestCol = ordered[0];
    for (const col of ordered) {
      const { board: next } = dropDisc(board, col, mark);
      const { score } = minimax(next, depth - 1, alpha, beta, false, mark);
      if (score > best) {
        best = score;
        bestCol = col;
      }
      alpha = Math.max(alpha, best);
      if (alpha >= beta) break;
    }
    return { score: best, col: bestCol };
  }

  let best = Infinity;
  let bestCol = ordered[0];
  for (const col of ordered) {
    const { board: next } = dropDisc(board, col, opp);
    const { score } = minimax(next, depth - 1, alpha, beta, true, mark);
    if (score < best) {
      best = score;
      bestCol = col;
    }
    beta = Math.min(beta, best);
    if (alpha >= beta) break;
  }
  return { score: best, col: bestCol };
}

export function hardMove(board, mark) {
  // Take an immediate win or block an immediate loss without spending a
  // full search on it — cheap and guarantees the AI never "thinks itself"
  // out of an obvious tactical shot.
  const win = winningColumn(board, mark);
  if (win != null) return win;
  const block = winningColumn(board, other(mark));
  if (block != null) return block;

  const { col } = minimax(board, SEARCH_DEPTH, -Infinity, Infinity, true, mark);
  return col ?? orderedColumns(board)[0];
}

export function computerMove(board, mark, difficulty) {
  return difficulty === "hard" ? hardMove(board, mark) : easyMove(board, mark);
}
