"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { colorDailyIndex } from "./colors";
import { generateDaily, isSolved, slide } from "./slidePuzzle";
import { submitPlayResult } from "./supabase/results";

const STATS_KEY = "soztop-slide-stats";

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
  };
}

function normalizeStats(raw) {
  return { ...defaultStats(), ...(raw || {}) };
}

export function readSlideStats() {
  return normalizeStats(loadJSON(STATS_KEY, null));
}

// A fresh random seed per scramble, not tied to the calendar day —
// unlimited replay, so every scramble (including a restart) is genuinely
// different instead of reproducing the same one until tomorrow.
// generateDaily's name is a holdover from the old daily-puzzle scheme —
// the function itself (a solvable scramble from a seed) is unchanged.
function randomSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

// phase: playing (tap a tile adjacent to the blank to slide it) -> "over"
// once every tile is back in order ("Yana oʻynash" scrambles a fresh board
// immediately).
const initialState = {
  board: null,
  moves: 0,
  phase: "loading",
  helpOpen: false,
};

function freshBoard(state) {
  return { ...state, board: generateDaily(randomSeed()), moves: 0, phase: "playing" };
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_HELP_OPEN":
      return { ...state, helpOpen: action.open };
    case "INIT":
      return freshBoard({ ...state, helpOpen: false });
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
      return freshBoard(state);
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
    dispatch({ type: "INIT" });
    setStats(normalizeStats(loadJSON(STATS_KEY, null)));
    setMounted(true);
  }, []);

  // On a fresh transition into "over" (the board just got solved): record
  // stats and push the result to Supabase for Reyting's personal-best
  // ranking. No day-based dedup needed — every scramble counts.
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = state.phase;
    if (prev !== "playing" || state.phase !== "over") return undefined;

    setStats((prevStats) => {
      const next = {
        ...prevStats,
        played: prevStats.played + 1,
        totalMoves: prevStats.totalMoves + state.moves,
        bestMoves: prevStats.bestMoves === 0 ? state.moves : Math.min(prevStats.bestMoves, state.moves),
      };
      saveJSON(STATS_KEY, next);
      return next;
    });

    submitPlayResult({
      game: "slide",
      length: 15,
      dailyIndex: colorDailyIndex(new Date()),
      won: true,
      guesses: 1,
      score: state.moves,
    });
    return undefined;
  }, [state.phase, state.board, state.moves]);

  const move = useCallback((index) => dispatch({ type: "SLIDE", index }), []);
  const restart = useCallback(() => dispatch({ type: "RESTART" }), []);
  const setHelpOpen = useCallback((open) => dispatch({ type: "SET_HELP_OPEN", open }), []);

  const shareText = useCallback(() => {
    const best = stats.bestMoves > 0 ? Math.min(stats.bestMoves, state.moves) : state.moves;
    return `🧩 15 boshqotirma — ${state.moves} harakat\nRekord: ${best} harakat`;
  }, [state.moves, stats.bestMoves]);

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
