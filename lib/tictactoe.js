// Core Tic Tac Toe logic, shared by every mode (vs computer, two players
// local, and — via the server-side mirror of checkWinner in the Supabase
// migration — online). Board is a 9-cell array, index 0-8, each cell
// "x" | "o" | null.

export const WINS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function emptyBoard() {
  return new Array(9).fill(null);
}

// Returns null (game continues), or { winner: "x" | "o", line } / { winner: "draw" }.
export function checkWinner(board) {
  for (const line of WINS) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return { winner: board[a], line };
    }
  }
  if (board.every((c) => c !== null)) return { winner: "draw", line: null };
  return null;
}

function emptyCells(board) {
  const out = [];
  for (let i = 0; i < 9; i++) if (!board[i]) out.push(i);
  return out;
}

function other(mark) {
  return mark === "x" ? "o" : "x";
}

// Full minimax (board is tiny — at most 9! states, trivially fast). Returns
// the best cell index for `mark` to play. Unbeatable: best case for the
// opponent is a draw.
function minimax(board, mark, self) {
  const result = checkWinner(board);
  if (result) {
    if (result.winner === "draw") return 0;
    return result.winner === self ? 10 : -10;
  }
  const scores = emptyCells(board).map((cell) => {
    const next = [...board];
    next[cell] = mark;
    return minimax(next, other(mark), self);
  });
  return mark === self ? Math.max(...scores) : Math.min(...scores);
}

export function hardMove(board, mark) {
  const cells = emptyCells(board);
  let best = cells[0];
  let bestScore = -Infinity;
  for (const cell of cells) {
    const next = [...board];
    next[cell] = mark;
    const score = minimax(next, other(mark), mark);
    if (score > bestScore) {
      bestScore = score;
      best = cell;
    }
  }
  return best;
}

function winningMove(board, mark) {
  for (const cell of emptyCells(board)) {
    const next = [...board];
    next[cell] = mark;
    const result = checkWinner(next);
    if (result && result.winner === mark) return cell;
  }
  return null;
}

// "Easy": mostly random, but occasionally smart enough to take an obvious
// win or block an obvious loss — pure randomness feels less like an
// opponent and more like a broken button.
export function easyMove(board, mark) {
  const cells = emptyCells(board);
  if (Math.random() < 0.35) {
    const win = winningMove(board, mark);
    if (win != null) return win;
  }
  if (Math.random() < 0.35) {
    const block = winningMove(board, other(mark));
    if (block != null) return block;
  }
  return cells[Math.floor(Math.random() * cells.length)];
}

export function computerMove(board, mark, difficulty) {
  return difficulty === "hard" ? hardMove(board, mark) : easyMove(board, mark);
}
