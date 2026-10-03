"use client";

// So'z zanjiri (Word Chain): type real Uzbek words, each one starting with
// the last letter/tile of the word before it, before the clock runs out.
// Unlimited replay (like Rang topish/Farqni top/etc.) — no daily puzzle, no
// streak, score = how many words you chained together, ranked by personal
// best in Reyting.

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { tokenize, tokenLabel } from "./words";
import { isValidWordAnyLength } from "./wordlist";
import { colorDailyIndex } from "./colors";
import { submitPlayResult } from "./supabase/results";

const STATS_KEY = "soztop-wordchain-stats";
export const TURN_SECONDS = 20;

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
    totalWords: 0,
    bestScore: 0,
  };
}

function normalizeStats(raw) {
  return { ...defaultStats(), ...(raw || {}) };
}

export function readWordChainStats() {
  return normalizeStats(loadJSON(STATS_KEY, null));
}

const initialState = {
  phase: "loading", // loading -> playing -> over
  chain: [], // [{ word, tokens }]
  usedSet: [], // plain array (serializable), checked via includes — chains stay short
  requiredStart: null, // token the next word must open with, or null for the first word
  input: "",
  error: "",
  timeLeft: TURN_SECONDS,
  helpOpen: false,
};

function freshRun(state) {
  return {
    ...state,
    chain: [],
    usedSet: [],
    requiredStart: null,
    input: "",
    error: "",
    timeLeft: TURN_SECONDS,
    phase: "playing",
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_HELP_OPEN":
      return { ...state, helpOpen: action.open };
    case "INIT":
      return freshRun({ ...state, helpOpen: false });
    case "RESTART":
      return freshRun(state);
    case "SET_INPUT":
      return { ...state, input: action.value, error: "" };
    case "TICK": {
      if (state.phase !== "playing") return state;
      const timeLeft = state.timeLeft - 1;
      if (timeLeft <= 0) {
        return { ...state, timeLeft: 0, phase: "over" };
      }
      return { ...state, timeLeft };
    }
    case "SUBMIT": {
      if (state.phase !== "playing") return state;
      const raw = state.input.trim();
      if (!raw) return state;
      const tokens = tokenize(raw);
      const normalized = tokens.join("|");

      if (state.requiredStart && tokens[0] !== state.requiredStart) {
        return {
          ...state,
          error: `Soʻz "${tokenLabel(state.requiredStart)}" harfi bilan boshlanishi kerak.`,
        };
      }
      if (state.usedSet.includes(normalized)) {
        return { ...state, error: "Bu soʻz allaqachon ishlatildi." };
      }
      if (!isValidWordAnyLength(tokens)) {
        return { ...state, error: "Bunday soʻz lugʻatda topilmadi." };
      }

      return {
        ...state,
        chain: [...state.chain, { word: raw, tokens }],
        usedSet: [...state.usedSet, normalized],
        requiredStart: tokens[tokens.length - 1],
        input: "",
        error: "",
        timeLeft: TURN_SECONDS,
      };
    }
    default:
      return state;
  }
}

export function useWordChain() {
  const [mounted, setMounted] = useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [stats, setStats] = useState(defaultStats());
  const prevPhaseRef = useRef("loading");

  useEffect(() => {
    dispatch({ type: "INIT" });
    setStats(normalizeStats(loadJSON(STATS_KEY, null)));
    setMounted(true);
  }, []);

  // One-second countdown while playing; pauses/stops automatically once the
  // phase leaves "playing" (help modal open doesn't pause it — matches
  // every other timed interaction in the app, and keeps this simple).
  useEffect(() => {
    if (state.phase !== "playing") return undefined;
    const t = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(t);
  }, [state.phase]);

  // On a fresh transition into "over" (clock hit zero): record stats and
  // push the result to Supabase for Reyting's personal-best ranking.
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = state.phase;
    if (prev !== "playing" || state.phase !== "over") return undefined;

    const score = state.chain.length;
    setStats((prevStats) => {
      const next = {
        ...prevStats,
        played: prevStats.played + 1,
        totalWords: prevStats.totalWords + score,
        bestScore: Math.max(prevStats.bestScore, score),
      };
      saveJSON(STATS_KEY, next);
      return next;
    });

    submitPlayResult({
      game: "wordchain",
      length: 1,
      dailyIndex: colorDailyIndex(new Date()),
      won: true,
      guesses: 1,
      score,
    });
    return undefined;
  }, [state.phase, state.chain.length]);

  const setInput = useCallback((value) => dispatch({ type: "SET_INPUT", value }), []);
  const submit = useCallback(() => dispatch({ type: "SUBMIT" }), []);
  const restart = useCallback(() => dispatch({ type: "RESTART" }), []);
  const setHelpOpen = useCallback((open) => dispatch({ type: "SET_HELP_OPEN", open }), []);

  const shareText = useCallback(() => {
    const n = state.chain.length;
    return `🔗 Soʻz zanjiri — ${n} ta soʻz!`;
  }, [state.chain.length]);

  return {
    mounted,
    ...state,
    score: state.chain.length,
    stats,
    setInput,
    submit,
    restart,
    setHelpOpen,
    shareText,
  };
}
