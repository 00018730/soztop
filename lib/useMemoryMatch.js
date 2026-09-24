"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { colorDailyIndex } from "./colors";
import { generateBoard, GRID_SIZE } from "./memoryMatch";
import { submitPlayResult } from "./supabase/results";

const STATS_KEY = "soztop-memory-stats";

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

export function readMemoryStats() {
  return normalizeStats(loadJSON(STATS_KEY, null));
}

// A fresh random seed per board, not tied to the calendar day — unlimited
// replay, so every board (including a restart) is genuinely different
// instead of reproducing the same layout until tomorrow.
function randomSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

// phase: playing (0 or 1 card face up, tappable) -> "checking" (2 cards face
// up, input locked) -> back to "playing" (mismatch flipped back) or "over"
// (last pair matched, board fully cleared; "Yana oʻynash" deals a fresh
// board immediately).
const initialState = {
  cards: null,
  flipped: [], // up to 2 card ids currently face up and unresolved
  matched: [], // card ids permanently face up (part of a found pair)
  pendingMatch: false,
  moves: 0,
  phase: "loading",
  helpOpen: false,
};

function freshBoard(state) {
  return {
    ...state,
    cards: generateBoard(randomSeed()),
    flipped: [],
    matched: [],
    moves: 0,
    phase: "playing",
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_HELP_OPEN":
      return { ...state, helpOpen: action.open };
    case "INIT":
      return freshBoard({ ...state, helpOpen: false });
    case "FLIP": {
      if (state.phase !== "playing") return state;
      const { id } = action;
      if (state.matched.includes(id) || state.flipped.includes(id)) return state;
      if (state.flipped.length >= 2) return state;

      if (state.flipped.length === 0) {
        return { ...state, flipped: [id] };
      }

      // Second card of the pair: resolve immediately, but hold the reveal
      // briefly (via a "checking" phase an effect times out) so the player
      // sees both cards before a mismatch flips back.
      const firstId = state.flipped[0];
      const first = state.cards.find((c) => c.id === firstId);
      const second = state.cards.find((c) => c.id === id);
      const isMatch = first.emoji === second.emoji;
      return {
        ...state,
        flipped: [firstId, id],
        pendingMatch: isMatch,
        moves: state.moves + 1,
        phase: "checking",
      };
    }
    case "RESOLVE": {
      if (state.phase !== "checking") return state;
      if (state.pendingMatch) {
        const matched = [...state.matched, ...state.flipped];
        const done = matched.length === GRID_SIZE;
        return {
          ...state,
          matched,
          flipped: [],
          pendingMatch: false,
          phase: done ? "over" : "playing",
        };
      }
      return { ...state, flipped: [], pendingMatch: false, phase: "playing" };
    }
    case "RESTART":
      return freshBoard(state);
    default:
      return state;
  }
}

export function useMemoryMatch() {
  const [mounted, setMounted] = useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [stats, setStats] = useState(defaultStats());
  const prevPhaseRef = useRef("loading");

  useEffect(() => {
    dispatch({ type: "INIT" });
    setStats(normalizeStats(loadJSON(STATS_KEY, null)));
    setMounted(true);
  }, []);

  // Brief pause with both cards face up before resolving a match/mismatch.
  useEffect(() => {
    if (state.phase !== "checking") return undefined;
    const t = setTimeout(() => dispatch({ type: "RESOLVE" }), state.pendingMatch ? 450 : 750);
    return () => clearTimeout(t);
  }, [state.phase, state.pendingMatch]);

  // On a fresh transition into "over" (the board just got fully cleared):
  // record stats and push the result to Supabase for Reyting's
  // personal-best ranking. No day-based dedup needed — every board counts.
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = state.phase;
    if (prev === "loading" || state.phase !== "over") return undefined;
    if (prev !== "checking" && prev !== "playing") return undefined;

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
      game: "memory",
      length: GRID_SIZE,
      dailyIndex: colorDailyIndex(new Date()),
      won: true,
      guesses: 1,
      score: state.moves,
    });
    return undefined;
  }, [state.phase, state.matched, state.moves]);

  const flip = useCallback((id) => dispatch({ type: "FLIP", id }), []);
  const restart = useCallback(() => dispatch({ type: "RESTART" }), []);
  const setHelpOpen = useCallback((open) => dispatch({ type: "SET_HELP_OPEN", open }), []);

  const shareText = useCallback(() => {
    const best = stats.bestMoves > 0 ? Math.min(stats.bestMoves, state.moves) : state.moves;
    return `🧠 Xotira oʻyini — ${state.moves} harakat\nRekord: ${best} harakat`;
  }, [state.moves, stats.bestMoves]);

  return {
    mounted,
    ...state,
    stats,
    flip,
    restart,
    setHelpOpen,
    shareText,
  };
}
