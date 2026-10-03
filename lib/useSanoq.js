"use client";

// Sanoq (Counting): pick a mode, then guess how many shapes are in the cup
// across ROUNDS rounds — each round harder than the last. Unlimited replay
// (no daily puzzle, no streak); score = total points across the run,
// ranked by personal best in Reyting, same as Rang topish/Farqni top/etc.

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { ROUNDS, MAX_SCORE, generateRound, scoreForGuess, randomSeed } from "./sanoq";
import { colorDailyIndex } from "./colors";
import { submitPlayResult } from "./supabase/results";

const STATS_KEY = "soztop-sanoq-stats";
const FEEDBACK_MS = 1800;

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

export function readSanoqStats() {
  return normalizeStats(loadJSON(STATS_KEY, null));
}

const initialState = {
  phase: "loading", // loading -> select-mode -> revealing/guessing -> feedback -> (loop) -> over
  mode: null, // "quick" | "calm"
  round: 0, // 0-indexed; display round + 1
  seed: 0,
  items: [],
  actual: 0,
  reveal: 0,
  revealLeft: 0,
  input: "",
  roundScore: null,
  totalScore: 0,
  history: [],
  helpOpen: false,
};

function startRound(state, round) {
  const { items, actual, reveal } = generateRound(state.seed, round);
  return {
    ...state,
    round,
    items,
    actual,
    reveal,
    revealLeft: reveal,
    input: "",
    roundScore: null,
    phase: state.mode === "quick" ? "revealing" : "guessing",
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_HELP_OPEN":
      return { ...state, helpOpen: action.open };
    case "INIT":
      return { ...state, phase: "select-mode", helpOpen: false };
    case "SELECT_MODE": {
      const seed = randomSeed();
      return startRound(
        { ...state, mode: action.mode, seed, totalScore: 0, history: [] },
        0
      );
    }
    case "TICK": {
      if (state.phase !== "revealing") return state;
      const revealLeft = state.revealLeft - 1;
      if (revealLeft <= 0) return { ...state, revealLeft: 0, phase: "guessing" };
      return { ...state, revealLeft };
    }
    case "SET_INPUT":
      return { ...state, input: action.value };
    case "SUBMIT_GUESS": {
      if (state.phase !== "guessing") return state;
      const guess = parseInt(state.input, 10);
      if (!Number.isFinite(guess) || guess < 0) return state;
      const roundScore = scoreForGuess(guess, state.actual);
      return {
        ...state,
        roundScore,
        totalScore: state.totalScore + roundScore,
        history: [...state.history, { round: state.round + 1, actual: state.actual, guess, score: roundScore }],
        phase: "feedback",
      };
    }
    case "NEXT_ROUND": {
      if (state.phase !== "feedback") return state;
      const next = state.round + 1;
      if (next >= ROUNDS) return { ...state, phase: "over" };
      return startRound(state, next);
    }
    case "RESTART":
      return { ...state, phase: "select-mode", helpOpen: false };
    default:
      return state;
  }
}

export function useSanoq() {
  const [mounted, setMounted] = useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [stats, setStats] = useState(defaultStats());
  const prevPhaseRef = useRef("loading");

  useEffect(() => {
    dispatch({ type: "INIT" });
    setStats(normalizeStats(loadJSON(STATS_KEY, null)));
    setMounted(true);
  }, []);

  // Countdown while the cup is being studied (Tezkor mode only).
  useEffect(() => {
    if (state.phase !== "revealing") return undefined;
    const t = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(t);
  }, [state.phase]);

  // Brief "here's the actual count" pause, then move to the next round (or
  // end the run after the last one).
  useEffect(() => {
    if (state.phase !== "feedback") return undefined;
    const t = setTimeout(() => dispatch({ type: "NEXT_ROUND" }), FEEDBACK_MS);
    return () => clearTimeout(t);
  }, [state.phase, state.round]);

  // On a fresh transition into "over" (run complete): record stats and push
  // the result to Supabase for Reyting's personal-best ranking.
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = state.phase;
    if (prev === "over" || state.phase !== "over") return undefined;

    const score = state.totalScore;
    setStats((prevStats) => {
      const next = {
        ...prevStats,
        played: prevStats.played + 1,
        totalScore: prevStats.totalScore + score,
        bestScore: Math.max(prevStats.bestScore, score),
      };
      saveJSON(STATS_KEY, next);
      return next;
    });

    submitPlayResult({
      game: "sanoq",
      length: 1,
      dailyIndex: colorDailyIndex(new Date()),
      won: true,
      guesses: 1,
      score,
    });
    return undefined;
  }, [state.phase, state.totalScore]);

  const selectMode = useCallback((mode) => dispatch({ type: "SELECT_MODE", mode }), []);
  const setInput = useCallback((value) => dispatch({ type: "SET_INPUT", value }), []);
  const submitGuess = useCallback(() => dispatch({ type: "SUBMIT_GUESS" }), []);
  const restart = useCallback(() => dispatch({ type: "RESTART" }), []);
  const setHelpOpen = useCallback((open) => dispatch({ type: "SET_HELP_OPEN", open }), []);

  const shareText = useCallback(() => {
    return `🧮 Sanoq — ${state.totalScore}/${MAX_SCORE} ball!`;
  }, [state.totalScore]);

  return {
    mounted,
    ...state,
    stats,
    selectMode,
    setInput,
    submitGuess,
    restart,
    setHelpOpen,
    shareText,
  };
}
