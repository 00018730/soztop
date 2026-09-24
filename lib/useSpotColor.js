"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { colorDailyIndex } from "./colors";
import { generateLevel } from "./spotColor";
import { submitDailyResult } from "./supabase/results";

const STATS_KEY = "soztop-spot-stats";
function dailyKey(idx) {
  return `soztop-spot-daily-${idx}`;
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
    totalScore: 0,
    bestScore: 0,
    streak: 0,
    maxStreak: 0,
    lastPlayedDay: null,
    lastCountedDay: null,
  };
}

function normalizeStats(raw) {
  return { ...defaultStats(), ...(raw || {}) };
}

export function readSpotStats() {
  return normalizeStats(loadJSON(STATS_KEY, null));
}

// phase: playing (grid live, tap a tile) -> "correct" feedback flash (still
// showing the same grid, briefly) -> next level's "playing" — or, on a
// wrong tap, phase "over" (terminal for the day). A day already played on
// this device loads straight into "over" with the exact grid it ended on.
const initialState = {
  dailyIndex: 0,
  level: 1,
  grid: null,
  oddIndex: -1,
  phase: "loading",
  pickedIndex: -1,
  score: 0,
  helpOpen: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_HELP_OPEN":
      return { ...state, helpOpen: action.open };
    case "INIT": {
      const { idx, saved } = action;
      if (saved) {
        return {
          ...state,
          dailyIndex: idx,
          level: saved.level,
          grid: saved.grid,
          oddIndex: saved.oddIndex,
          pickedIndex: saved.pickedIndex,
          score: saved.score,
          phase: "over",
        };
      }
      const { grid, oddIndex } = generateLevel(idx, 1);
      return {
        ...state,
        dailyIndex: idx,
        level: 1,
        grid,
        oddIndex,
        pickedIndex: -1,
        score: 0,
        phase: "playing",
      };
    }
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
      const { grid, oddIndex } = generateLevel(state.dailyIndex, nextLevel);
      return {
        ...state,
        level: nextLevel,
        grid,
        oddIndex,
        pickedIndex: -1,
        phase: "playing",
      };
    }
    case "RESTART": {
      const { grid, oddIndex } = generateLevel(state.dailyIndex, 1);
      return {
        ...state,
        level: 1,
        grid,
        oddIndex,
        pickedIndex: -1,
        score: 0,
        phase: "playing",
      };
    }
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
    const idx = colorDailyIndex(new Date());
    const saved = loadJSON(dailyKey(idx), null);
    dispatch({ type: "INIT", idx, saved });
    setStats(normalizeStats(loadJSON(STATS_KEY, null)));
    setMounted(true);
  }, []);

  // Brief "correct!" flash, then move on to the next (harder) level.
  useEffect(() => {
    if (state.phase !== "correct") return undefined;
    const t = setTimeout(() => dispatch({ type: "ADVANCE" }), 500);
    return () => clearTimeout(t);
  }, [state.phase, state.level]);

  // On a fresh transition into "over" (an actual wrong pick, not a page
  // load that found an already-finished day): persist, record stats once,
  // push to Supabase for Reyting.
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = state.phase;
    // Only a real "playing -> over" transition is an actual wrong pick this
    // session. A page load that finds an already-finished day goes straight
    // from "loading" to "over" via INIT and must NOT re-record stats.
    if (prev !== "playing" || state.phase !== "over") return undefined;

    saveJSON(dailyKey(state.dailyIndex), {
      level: state.level,
      grid: state.grid,
      oddIndex: state.oddIndex,
      pickedIndex: state.pickedIndex,
      score: state.score,
    });

    setStats((prevStats) => {
      const dayKey = `day-${state.dailyIndex}`;
      if (prevStats.lastCountedDay === dayKey) return prevStats;
      const next = {
        ...prevStats,
        played: prevStats.played + 1,
        totalScore: prevStats.totalScore + state.score,
        bestScore: Math.max(prevStats.bestScore, state.score),
        streak: prevStats.lastPlayedDay === state.dailyIndex - 1 ? prevStats.streak + 1 : 1,
        lastPlayedDay: state.dailyIndex,
        lastCountedDay: dayKey,
      };
      next.maxStreak = Math.max(prevStats.maxStreak, next.streak);
      saveJSON(STATS_KEY, next);
      return next;
    });

    submitDailyResult({
      game: "spot",
      length: 9,
      dailyIndex: state.dailyIndex,
      won: true,
      guesses: 1,
      score: state.score,
    });
    return undefined;
  }, [state.phase, state.dailyIndex, state.level, state.grid, state.oddIndex, state.pickedIndex, state.score]);

  const shareText = useCallback(() => {
    const score = state.score;
    const capped = Math.min(score, 10);
    const bar = "✅".repeat(capped) + (score > 10 ? "…" : "") + "❌";
    return `🔍 Farqni top #${state.dailyIndex} — ${score}-daraja\n${bar}`;
  }, [state.dailyIndex, state.score]);

  const pick = useCallback((index) => dispatch({ type: "PICK", index }), []);
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
    pick,
    restart,
    setHelpOpen,
    shareText,
  };
}
