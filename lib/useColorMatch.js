"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { REVEAL_SECONDS, colorDailyIndex, colorForDailyIndex, colorScore } from "./colors";
import { submitPlayResult } from "./supabase/results";

const STATS_KEY = "soztop-cm-stats";

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

// Score buckets for the Statistika distribution chart, low to high:
// 0-49 / 50-74 / 75-89 / 90-100.
export const SCORE_BUCKETS = ["0-49", "50-74", "75-89", "90-100"];
function bucketFor(score) {
  if (score >= 90) return 3;
  if (score >= 75) return 2;
  if (score >= 50) return 1;
  return 0;
}

function defaultStats() {
  return {
    played: 0,
    totalScore: 0,
    bestScore: 0,
    buckets: new Array(SCORE_BUCKETS.length).fill(0),
  };
}

// Merges saved stats over the defaults so older saves still come back with
// every key present (same pattern as useGame.js / useCodeBreaker.js).
function normalizeStats(raw) {
  return { ...defaultStats(), ...(raw || {}) };
}

// Read-only accessor for the Statistika page.
export function readColorStats() {
  return normalizeStats(loadJSON(STATS_KEY, null));
}

// A fresh random seed per round, not tied to the calendar day — unlimited
// replay, so every round (including a restart) gets a genuinely different
// color instead of reproducing the same one until tomorrow.
function randomSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

const NEUTRAL_GUESS = { r: 128, g: 128, b: 128 };

// phase: reveal (showing the target, counting down) -> guessing (sliders
// live, target hidden) -> result (submitted, comparison shown, "Yana
// oʻynash" starts a brand new round immediately).
const initialState = {
  target: null,
  phase: "loading",
  revealLeft: REVEAL_SECONDS,
  guess: NEUTRAL_GUESS,
  score: null,
  helpOpen: false,
};

function freshRound(state) {
  return {
    ...state,
    target: colorForDailyIndex(randomSeed()),
    phase: "reveal",
    revealLeft: REVEAL_SECONDS,
    guess: NEUTRAL_GUESS,
    score: null,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "INIT":
      return freshRound({ ...state, helpOpen: false });
    case "TICK_REVEAL": {
      if (state.phase !== "reveal") return state;
      const next = state.revealLeft - 1;
      if (next <= 0) return { ...state, phase: "guessing", revealLeft: 0 };
      return { ...state, revealLeft: next };
    }
    case "SET_CHANNEL": {
      if (state.phase !== "guessing") return state;
      const value = Math.max(0, Math.min(255, action.value));
      return { ...state, guess: { ...state.guess, [action.channel]: value } };
    }
    case "SUBMIT": {
      if (state.phase !== "guessing" || !state.target) return state;
      const score = colorScore(state.target, state.guess);
      return { ...state, phase: "result", score };
    }
    case "RESTART":
      return freshRound(state);
    case "SET_HELP_OPEN":
      return { ...state, helpOpen: action.open };
    default:
      return state;
  }
}

export function useColorMatch() {
  const [mounted, setMounted] = useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [stats, setStats] = useState(defaultStats());
  const prevPhaseRef = useRef("loading");

  useEffect(() => {
    dispatch({ type: "INIT" });
    setStats(normalizeStats(loadJSON(STATS_KEY, null)));
    setMounted(true);
  }, []);

  // Reveal countdown: one tick per second while phase === "reveal".
  useEffect(() => {
    if (state.phase !== "reveal") return undefined;
    const t = setTimeout(() => dispatch({ type: "TICK_REVEAL" }), 1000);
    return () => clearTimeout(t);
  }, [state.phase, state.revealLeft]);

  // On a fresh guessing -> result transition (an actual submit): record
  // stats and push the result to Supabase for Reyting's personal-best
  // ranking. No day-based dedup needed anymore — every round counts.
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = state.phase;
    if (prev !== "guessing" || state.phase !== "result") return undefined;

    setStats((prevStats) => {
      const next = {
        ...prevStats,
        played: prevStats.played + 1,
        totalScore: prevStats.totalScore + state.score,
        bestScore: Math.max(prevStats.bestScore, state.score),
      };
      const buckets = [...prevStats.buckets];
      const b = bucketFor(state.score);
      buckets[b] = (buckets[b] || 0) + 1;
      next.buckets = buckets;
      saveJSON(STATS_KEY, next);
      return next;
    });

    // No fail state in this game, so every submission counts as "won" —
    // `score` (0-100) is what Reyting actually ranks by.
    submitPlayResult({
      game: "color",
      length: 3,
      dailyIndex: colorDailyIndex(new Date()),
      won: true,
      guesses: 1,
      score: state.score,
    });
    return undefined;
  }, [state.phase, state.guess, state.score]);

  const setChannel = useCallback(
    (channel, value) => dispatch({ type: "SET_CHANNEL", channel, value }),
    []
  );
  const submit = useCallback(() => dispatch({ type: "SUBMIT" }), []);
  const restart = useCallback(() => dispatch({ type: "RESTART" }), []);
  const setHelpOpen = useCallback((open) => dispatch({ type: "SET_HELP_OPEN", open }), []);

  const shareText = useCallback(() => {
    const filled = Math.max(0, Math.min(5, Math.round((state.score ?? 0) / 20)));
    const bar = "🟩".repeat(filled) + "⬜".repeat(5 - filled);
    return `🎨 Rang topish — ${state.score}/100\n${bar}`;
  }, [state.score]);

  return {
    mounted,
    ...state,
    stats,
    setChannel,
    submit,
    restart,
    setHelpOpen,
    shareText,
  };
}
