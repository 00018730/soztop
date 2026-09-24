"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  addRandomTile,
  hasMoves,
  hasWinningTile,
  highestTile,
  moveBoard,
  startingBoard,
} from "./game2048";

const STATS_KEY = "soztop-2048-stats";

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

function defaultStats() {
  return { played: 0, bestScore: 0, bestTile: 0 };
}

export function read2048Stats() {
  return { ...defaultStats(), ...(loadJSON(STATS_KEY, null) || {}) };
}

// status: playing -> "won" (2048 tile reached for the first time this game
// — a dismissible banner, play can continue) -> back to "playing", or
// straight to "over" (no legal move left in any direction).
const initialState = {
  board: null,
  score: 0,
  status: "loading",
  wonShown: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "INIT":
      return { ...state, board: action.board, score: 0, status: "playing", wonShown: false };
    case "NEW_GAME":
      return { board: startingBoard(), score: 0, status: "playing", wonShown: false };
    case "MOVE": {
      if (state.status === "over") return state;
      const { board, moved, gained } = moveBoard(state.board, action.direction);
      if (!moved) return state;
      const nextBoard = addRandomTile(board);
      const nextScore = state.score + gained;
      if (!state.wonShown && hasWinningTile(nextBoard)) {
        return { ...state, board: nextBoard, score: nextScore, status: "won" };
      }
      if (!hasMoves(nextBoard)) {
        return { ...state, board: nextBoard, score: nextScore, status: "over" };
      }
      return { ...state, board: nextBoard, score: nextScore, status: "playing" };
    }
    case "DISMISS_WIN":
      if (state.status !== "won") return state;
      return { ...state, status: "playing", wonShown: true };
    default:
      return state;
  }
}

export function use2048() {
  const [mounted, setMounted] = useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [stats, setStats] = useState(defaultStats());
  const prevStatusRef = useRef("loading");

  useEffect(() => {
    dispatch({ type: "INIT", board: startingBoard() });
    setStats(read2048Stats());
    setMounted(true);
  }, []);

  // Arrow keys — swipe is wired up by the component via `move` directly.
  useEffect(() => {
    function onKeyDown(e) {
      const map = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
      const direction = map[e.key];
      if (!direction) return;
      e.preventDefault();
      dispatch({ type: "MOVE", direction });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Record stats once per game that truly ends (no moves left). Reaching
  // 2048 and continuing to play doesn't end the game, so it isn't counted
  // as "played" until the board actually locks up.
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = state.status;
    if (prev === "loading" || state.status !== "over" || prev === "over") return undefined;

    setStats((prevStats) => {
      const next = {
        played: prevStats.played + 1,
        bestScore: Math.max(prevStats.bestScore, state.score),
        bestTile: Math.max(prevStats.bestTile, highestTile(state.board)),
      };
      saveJSON(STATS_KEY, next);
      return next;
    });
    return undefined;
  }, [state.status, state.score, state.board]);

  const move = useCallback((direction) => dispatch({ type: "MOVE", direction }), []);
  const newGame = useCallback(() => dispatch({ type: "NEW_GAME" }), []);
  const dismissWin = useCallback(() => dispatch({ type: "DISMISS_WIN" }), []);

  return {
    mounted,
    ...state,
    stats,
    move,
    newGame,
    dismissWin,
  };
}
