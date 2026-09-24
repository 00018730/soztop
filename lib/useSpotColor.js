"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { colorDailyIndex } from "./colors";
import { generateLevel } from "./spotColor";
import { submitPlayResult } from "./supabase/results";

const STATS_KEY = "soztop-spot-stats";

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
    totalScore: 0,
    bestScore: 0,
  };
}

function normalizeStats(raw) {
  return { ...defaultStats(), ...(raw || {}) };
}

export function readSpotStats() {
  return normalizeStats(loadJSON(STATS_KEY, null));
}

// A fresh random seed per run, not tied to the calendar day — unlimited
// replay, so every run (including a restart) gets a genuinely different
// ladder of levels instead of reproducing the same one until tomorrow.
function randomSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

// phase: playing (grid live, tap a tile) -> "correct" feedback flash (still
// showing the same grid, briefly) -> next level's "playing" — or, on a
// wrong tap, phase "over" (terminal for this run; "Yana oʻynash" starts a
// brand new run immediately).
const initialState = {
  runSeed: 0,
  level: 1,
  grid: null,
  oddIndex: -1,
  phase: "loading",
  pickedIndex: -1,
  score: 0,
  helpOpen: false,
};

function freshRun(state) {
  const runSeed = randomSeed();
  const { grid, oddIndex } = generateLevel(runSeed, 1);
  return {
    ...state,
    runSeed,
    level: 1,
    grid,
    oddIndex,
    pickedIndex: -1,
    score: 0,
    phase: "playing",
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_HELP_OPEN":
      return { ...state, helpOpen: action.open };
    case "INIT":
      return freshRun({ ...state, helpOpen: false });
    case "PICK": {
      if (state.phase !== "playing") return state;
      const correct = action.index === state.oddIndex;
      if (correct) {
        return { ...state, phase: "correct", pickedIndex: action.index };
      }
      return {
        ...state,
        phase: "over",
        pickedIndex: action.index,
        score: state.level - 1,
      };
    }
    case "ADVANCE": {
      const nextLevel = state.level + 1;
      const { grid, oddIndex } = generateLevel(state.runSeed, nextLevel);
      return {
        ...state,
        level: nextLevel,
        grid,
        oddIndex,
        pickedIndex: -1,
        phase: "playing",
      };
    }
    case "RESTART":
      return freshRun(state);
    default:
      return state;
  }
}

export function useSpotColor() {
  const [mounted, setMounted] = useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [stats, setStats] = useState(defaultStats());
  const prevPhaseRef = useRef("loading");

  useEffect(() => {
    dispatch({ type: "INIT" });
    setStats(normalizeStats(loadJSON(STATS_KEY, null)));
    setMounted(true);
  }, []);

  // Brief "correct!" flash, then move on to the next (harder) level.
  useEffect(() => {
    if (state.phase !== "correct") return undefined;
    const t = setTimeout(() => dispatch({ type: "ADVANCE" }), 500);
    return () => clearTimeout(t);
  }, [state.phase, state.level]);

  // On a fresh transition into "over" (a wrong pick ending this run):
  // record stats and push the result to Supabase for Reyting's
  // personal-best ranking. No day-based dedup needed — every run counts.
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = state.phase;
    if (prev !== "playing" || state.phase !== "over") return undefined;

    setStats((prevStats) => {
      const next = {
        ...prevStats,
        played: prevStats.played + 1,
        totalScore: prevStats.totalScore + state.score,
        bestScore: Math.max(prevStats.bestScore, state.score),
      };
      saveJSON(STATS_KEY, next);
      return next;
    });

    submitPlayResult({
      game: "spot",
      length: 9,
      dailyIndex: colorDailyIndex(new Date()),
      won: true,
      guesses: 1,
      score: state.score,
    });
    return undefined;
  }, [state.phase, state.score]);

  const pick = useCallback((index) => dispatch({ type: "PICK", index }), []);
  const restart = useCallback(() => dispatch({ type: "RESTART" }), []);
  const setHelpOpen = useCallback((open) => dispatch({ type: "SET_HELP_OPEN", open }), []);

  const shareText = useCallback(() => {
    const score = state.score;
    const capped = Math.min(score, 10);
    const bar = "✅".repeat(capped) + (score > 10 ? "…" : "") + "❌";
    return `🔍 Farqni top — ${score}-daraja\n${bar}`;
  }, [state.score]);

  return {
    mounted,
    ...state,
    stats,
    pick,
    restart,
    setHelpOpen,
    shareText,
  };
}
