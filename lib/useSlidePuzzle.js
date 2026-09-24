"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { colorDailyIndex } from "./colors";
import { generateDaily, isSolved, slide } from "./slidePuzzle";
import { submitDailyResult } from "./supabase/results";

const STATS_KEY = "soztop-slide-stats";
function dailyKey(idx) {
  return `soztop-slide-daily-${idx}`;
}

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
  return {
    played: 0,
    totalMoves: 0,
    bestMoves: 0,
    streak: 0,
    maxStreak: 0,
    lastPlayedDay: null,
    lastCountedDay: null,
  };
}

function normalizeStats(raw) {
  return { ...defaultStats(), ...(raw || {}) };
}

export function readSlideStats() {
  return normalizeStats(loadJSON(STATS_KEY, null));
}

// phase: playing (tap a tile adjacent to the blank to slide it) -> "over"
// once every tile is back in order. A day already finished on this device
// loads straight into "over" with its final board.
const initialState = {
  dailyIndex: 0,
  board: null,
  moves: 0,
  phase: "loading",
  helpOpen: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_HELP_OPEN":
      return { ...state, helpOpen: action.open };
    case "INIT": {
      const { idx, saved } = action;
      if (saved) {
        return { ...state, dailyIndex: idx, board: saved.board, moves: saved.moves, phase: "over" };
      }
      return { ...state, dailyIndex: idx, board: generateDaily(idx), moves: 0, phase: "playing" };
    }
    case "SLIDE": {
      if (state.phase !== "playing") return state;
      const { board, moved } = slide(state.board, action.index);
      if (!moved) return state;
      const moves = state.moves + 1;
      if (isSolved(board)) {
        return { ...state, board, moves, phase: "over" };
      }
      return { ...state, board, moves };
    }
    case "RESTART":
      return { ...state, board: generateDaily(state.dailyIndex), moves: 0, phase: "playing" };
    default:
      return state;
  }
}

export function useSlidePuzzle() {
  const [mounted, setMounted] = useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [stats, setStats] = useState(defaultStats());
  const prevPhaseRef = useRef("loading");

  useEffect(() => {
    const idx = colorDailyIndex(new Date());
    const saved = loadJSON(dailyKey(idx), null);
    dispatch({ type: "INIT", idx, saved });
    setStats(normalizeStats(loadJSON(STATS_KEY, null)));
    setMounted(true);
  }, []);

  // On a fresh transition into "over" (the board just got solved, not a
  // page load that found an already-finished day): persist, record stats
  // once, push to Supabase for Reyting.
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = state.phase;
    if (prev !== "playing" || state.phase !== "over") return undefined;

    saveJSON(dailyKey(state.dailyIndex), { board: state.board, moves: state.moves });

    setStats((prevStats) => {
      const dayKey = `day-${state.dailyIndex}`;
      if (prevStats.lastCountedDay === dayKey) return prevStats;
      const next = {
        ...prevStats,
        played: prevStats.played + 1,
        totalMoves: prevStats.totalMoves + state.moves,
        bestMoves: prevStats.bestMoves === 0 ? state.moves : Math.min(prevStats.bestMoves, state.moves),
        streak: prevStats.lastPlayedDay === state.dailyIndex - 1 ? prevStats.streak + 1 : 1,
        lastPlayedDay: state.dailyIndex,
        lastCountedDay: dayKey,
      };
      next.maxStreak = Math.max(prevStats.maxStreak, next.streak);
      saveJSON(STATS_KEY, next);
      return next;
    });

    submitDailyResult({
      game: "slide",
      length: 15,
      dailyIndex: state.dailyIndex,
      won: true,
      guesses: 1,
      score: state.moves,
    });
    return undefined;
  }, [state.phase, state.dailyIndex, state.board, state.moves]);

  const shareText = useCallback(() => {
    const best = stats.bestMoves > 0 ? Math.min(stats.bestMoves, state.moves) : state.moves;
    return `🧩 15 boshqotirma #${state.dailyIndex} — ${state.moves} harakat\nRekord: ${best} harakat`;
  }, [state.dailyIndex, state.moves, stats.bestMoves]);

  const move = useCallback((index) => dispatch({ type: "SLIDE", index }), []);
  const restart = useCallback(() => {
    try {
      localStorage.removeItem(dailyKey(state.dailyIndex));
    } catch {
      /* best-effort only */
    }
    dispatch({ type: "RESTART" });
  }, [state.dailyIndex]);
  const setHelpOpen = useCallback((open) => dispatch({ type: "SET_HELP_OPEN", open }), []);

  return {
    mounted,
    ...state,
    stats,
    move,
    restart,
    setHelpOpen,
    shareText,
  };
}
