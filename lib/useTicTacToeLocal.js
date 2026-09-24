"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { checkWinner, computerMove, emptyBoard } from "./tictactoe";

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* best-effort only */
  }
}

function statsKey(mode, difficulty) {
  return mode === "computer" ? `soztop-ttt-stats-computer-${difficulty}` : "soztop-ttt-stats-local";
}

function defaultComputerStats() {
  return { played: 0, wins: 0, losses: 0, draws: 0 };
}
function defaultLocalStats() {
  return { played: 0, xWins: 0, oWins: 0, draws: 0 };
}

function readStats(mode, difficulty) {
  const defaults = mode === "computer" ? defaultComputerStats() : defaultLocalStats();
  return { ...defaults, ...(loadJSON(statsKey(mode, difficulty), null) || {}) };
}

// Read-only aggregate across all 3 modes' stat keys (computer/easy,
// computer/hard, local) — used by the profile's combined stats overview,
// which only cares about total games played, not per-mode breakdown.
export function readTicTacToeTotalPlayed() {
  return (
    readStats("computer", "easy").played +
    readStats("computer", "hard").played +
    readStats("local", null).played
  );
}

function other(mark) {
  return mark === "x" ? "o" : "x";
}

const initialState = {
  mode: "computer", // "computer" | "local"
  difficulty: "easy", // "easy" | "hard" — only used when mode === "computer"
  board: emptyBoard(),
  turn: "x",
  starter: "x", // alternates each new game so nobody's stuck always going second
  status: "playing", // playing | over
  result: null, // { winner: "x" | "o" | "draw", line }
};

function reducer(state, action) {
  switch (action.type) {
    case "CONFIGURE":
      return {
        ...state,
        mode: action.mode,
        difficulty: action.difficulty ?? state.difficulty,
        board: emptyBoard(),
        turn: "x",
        starter: "x",
        status: "playing",
        result: null,
      };
    case "NEW_GAME": {
      const starter = other(state.starter);
      return { ...state, board: emptyBoard(), turn: starter, starter, status: "playing", result: null };
    }
    case "PLAY": {
      if (state.status !== "playing") return state;
      const { cell } = action;
      if (state.board[cell]) return state;
      const board = [...state.board];
      board[cell] = state.turn;
      const result = checkWinner(board);
      if (result) {
        return { ...state, board, status: "over", result };
      }
      return { ...state, board, turn: other(state.turn) };
    }
    default:
      return state;
  }
}

export function useTicTacToeLocal() {
  const [mounted, setMounted] = useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [stats, setStats] = useState(defaultComputerStats());
  const prevStatusRef = useRef("playing");

  useEffect(() => {
    setStats(readStats(initialState.mode, initialState.difficulty));
    setMounted(true);
  }, []);

  // Reload stats whenever the mode/difficulty changes — each keeps its own.
  useEffect(() => {
    if (!mounted) return;
    setStats(readStats(state.mode, state.difficulty));
  }, [mounted, state.mode, state.difficulty]);

  // Computer's move: a short delay so it doesn't feel instantaneous/robotic.
  useEffect(() => {
    if (state.mode !== "computer" || state.status !== "playing" || state.turn !== "o") return undefined;
    const t = setTimeout(() => {
      const cell = computerMove(state.board, "o", state.difficulty);
      dispatch({ type: "PLAY", cell });
    }, 500);
    return () => clearTimeout(t);
  }, [state.mode, state.status, state.turn, state.board, state.difficulty]);

  // Record stats once per finished game.
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = state.status;
    if (prev !== "playing" || state.status !== "over") return undefined;

    setStats((prevStats) => {
      const next = { ...prevStats, played: prevStats.played + 1 };
      if (state.mode === "computer") {
        if (state.result.winner === "draw") next.draws += 1;
        else if (state.result.winner === "x") next.wins += 1;
        else next.losses += 1;
      } else {
        if (state.result.winner === "draw") next.draws += 1;
        else if (state.result.winner === "x") next.xWins += 1;
        else next.oWins += 1;
      }
      saveJSON(statsKey(state.mode, state.difficulty), next);
      return next;
    });
    return undefined;
  }, [state.status, state.mode, state.difficulty, state.result]);

  const configure = useCallback(
    (mode, difficulty) => dispatch({ type: "CONFIGURE", mode, difficulty }),
    []
  );
  const play = useCallback((cell) => dispatch({ type: "PLAY", cell }), []);
  const newGame = useCallback(() => dispatch({ type: "NEW_GAME" }), []);

  // "Qiyin" (hard) is a full minimax — mathematically unbeatable, so a win
  // against it is impossible and can't be the shareable moment here (see
  // lib/tictactoe.js's hardMove). The real achievement is holding it to a
  // draw, which is the best any player can ever do against it.
  const shareText = useCallback(
    () => "⭕ Yengilmas kompyuterni (qiyin) durrang oʻynatdim! 🤝",
    []
  );

  return {
    mounted,
    ...state,
    stats,
    configure,
    play,
    newGame,
    shareText,
  };
}
