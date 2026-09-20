"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  MAX_GUESSES,
  MERGE_PAIRS,
  WORD_LENGTH,
  betterStatus,
  dailyIndexForDate,
  evaluateGuess,
} from "./words";
import { SOLUTIONS, isValidGuess, randomWord, wordAt } from "./wordlist";

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

const STATS_KEY = "soztop-stats";

function defaultStats() {
  return { played: 0, wins: 0, streak: 0, maxStreak: 0, lastWinDay: null, lastCountedDay: null };
}

function buildKeyStatus(rows) {
  const next = {};
  for (const g of rows) {
    g.tokens.forEach((t, i) => {
      next[t] = betterStatus(next[t], g.result[i]);
    });
  }
  return next;
}

// The active row is a fixed-size array of WORD_LENGTH slots, `null` where
// empty. Free entry: a slot is picked with SET_CURSOR (click/tap) or filled
// in order as the cursor auto-advances; either way you can fill slot 3
// before slot 1. `cursor` says which slot the next keystroke lands in.
function emptyRow() {
  return new Array(WORD_LENGTH).fill(null);
}

// All game state lives in one reducer. This is what makes it race-free:
// every dispatched action (a keystroke, Enter, a click) is processed against
// the TRUE latest state, in order — unlike a bag of separate useState values
// read through a plain-closure event handler, where a fast keystroke +
// Enter fired back-to-back could get handled by a callback that still
// closed over the *previous* render's `current` value. That was the actual
// cause of "Enter clears my guess instead of submitting it".
const initialState = {
  mode: "daily",
  solution: null,
  dailyIndex: 0,
  guesses: [],
  current: emptyRow(),
  cursor: 0,
  status: "playing", // playing | won | lost
  keyStatus: {},
  message: "",
  shakeRow: null,
  resultOpen: false,
  helpOpen: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "INIT_DAILY": {
      const { idx, solution, saved } = action;
      if (saved && saved.word === solution.word) {
        return {
          ...state,
          mode: "daily",
          dailyIndex: idx,
          solution,
          guesses: saved.guesses,
          current: emptyRow(),
          cursor: 0,
          status: saved.status,
          keyStatus: buildKeyStatus(saved.guesses),
          message: "",
          shakeRow: null,
        };
      }
      return {
        ...state,
        mode: "daily",
        dailyIndex: idx,
        solution,
        guesses: [],
        current: emptyRow(),
        cursor: 0,
        status: "playing",
        keyStatus: {},
        message: "",
        shakeRow: null,
      };
    }
    case "START_PRACTICE":
      return {
        ...state,
        mode: "practice",
        solution: action.solution,
        guesses: [],
        current: emptyRow(),
        cursor: 0,
        status: "playing",
        keyStatus: {},
        message: "",
        shakeRow: null,
        resultOpen: false,
      };
    case "RESTART_DAILY":
      return {
        ...state,
        guesses: [],
        current: emptyRow(),
        cursor: 0,
        status: "playing",
        keyStatus: {},
        message: "",
        shakeRow: null,
        resultOpen: false,
      };
    case "SET_CURSOR": {
      if (state.status !== "playing") return state;
      const idx = Math.max(0, Math.min(WORD_LENGTH - 1, action.index));
      return { ...state, cursor: idx };
    }
    // Already-resolved token (on-screen key, e.g. the dedicated Oʻ/Gʻ keys).
    case "INPUT_TOKEN": {
      if (state.status !== "playing") return state;
      const next = [...state.current];
      next[state.cursor] = action.tok;
      return { ...state, current: next, cursor: Math.min(WORD_LENGTH - 1, state.cursor + 1) };
    }
    // Raw physical key. Handles the o+' / g+' typing convenience: typing an
    // apostrophe right after "o"/"g" merges it into the previous slot
    // instead of eating a slot of its own.
    case "INPUT_CHAR": {
      if (state.status !== "playing") return state;
      const ch = action.ch;
      if (ch === "ʻ") {
        const prevIdx = state.cursor - 1;
        if (prevIdx >= 0) {
          const merged = MERGE_PAIRS[`${state.current[prevIdx]},ʻ`];
          if (merged) {
            const next = [...state.current];
            next[prevIdx] = merged;
            return { ...state, current: next };
          }
        }
        return state; // a bare apostrophe isn't a letter on its own
      }
      const next = [...state.current];
      next[state.cursor] = ch;
      return { ...state, current: next, cursor: Math.min(WORD_LENGTH - 1, state.cursor + 1) };
    }
    case "BACKSPACE": {
      if (state.status !== "playing") return state;
      const next = [...state.current];
      if (next[state.cursor] != null) {
        next[state.cursor] = null;
        return { ...state, current: next };
      }
      if (state.cursor > 0) {
        next[state.cursor - 1] = null;
        return { ...state, current: next, cursor: state.cursor - 1 };
      }
      return state;
    }
    case "SUBMIT": {
      if (state.status !== "playing" || !state.solution) return state;
      if (state.current.some((t) => t == null)) {
        return { ...state, message: "Barcha katakchani toʻldiring", shakeRow: state.guesses.length };
      }
      if (!isValidGuess(state.current)) {
        return { ...state, message: "Bu soʻz roʻyxatda yoʻq", shakeRow: state.guesses.length };
      }
      const result = evaluateGuess(state.current, state.solution.tokens);
      const row = { tokens: state.current, result };
      const nextGuesses = [...state.guesses, row];
      const nextKeyStatus = { ...state.keyStatus };
      row.tokens.forEach((t, i) => {
        nextKeyStatus[t] = betterStatus(nextKeyStatus[t], row.result[i]);
      });
      const won = result.every((r) => r === "correct");
      let nextStatus = "playing";
      if (won) nextStatus = "won";
      else if (nextGuesses.length >= MAX_GUESSES) nextStatus = "lost";
      return {
        ...state,
        guesses: nextGuesses,
        current: emptyRow(),
        cursor: 0,
        keyStatus: nextKeyStatus,
        status: nextStatus,
        message: "",
        shakeRow: null,
      };
    }
    case "CLEAR_MESSAGE":
      return { ...state, message: "", shakeRow: null };
    case "SET_RESULT_OPEN":
      return { ...state, resultOpen: action.open };
    case "SET_HELP_OPEN":
      return { ...state, helpOpen: action.open };
    default:
      return state;
  }
}

export function useGame() {
  const [mounted, setMounted] = useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [stats, setStats] = useState(defaultStats());
  const prevStatusRef = useRef("playing");

  useEffect(() => {
    setStats(loadJSON(STATS_KEY, defaultStats()));
    const idx = dailyIndexForDate(new Date(), SOLUTIONS.length);
    const solution = wordAt(idx);
    const saved = loadJSON(`soztop-daily-${idx}`, null);
    dispatch({ type: "INIT_DAILY", idx, solution, saved });
    setMounted(true);
  }, []);

  // Auto-hide the reject/error banner (and the shake it triggered) a beat
  // after it appears.
  useEffect(() => {
    if (!state.message) return undefined;
    const t = setTimeout(() => dispatch({ type: "CLEAR_MESSAGE" }), 1500);
    return () => clearTimeout(t);
  }, [state.message]);

  // Persist daily progress (win, loss, or mid-game) after every change.
  useEffect(() => {
    if (state.mode !== "daily" || !state.solution) return;
    saveJSON(`soztop-daily-${state.dailyIndex}`, {
      word: state.solution.word,
      guesses: state.guesses,
      status: state.status,
    });
  }, [state.mode, state.solution, state.dailyIndex, state.guesses, state.status]);

  // On a fresh win/loss transition: record stats once, then pop the result modal.
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = state.status;
    if (prev !== "playing" || (state.status !== "won" && state.status !== "lost")) return undefined;

    if (state.mode === "daily") {
      setStats((prevStats) => {
        const dayKey = `day-${state.dailyIndex}`;
        if (prevStats.lastCountedDay === dayKey) return prevStats;
        const next = { ...prevStats, played: prevStats.played + 1, lastCountedDay: dayKey };
        if (state.status === "won") {
          next.wins = prevStats.wins + 1;
          next.streak = prevStats.lastWinDay === state.dailyIndex - 1 ? prevStats.streak + 1 : 1;
          next.lastWinDay = state.dailyIndex;
          next.maxStreak = Math.max(prevStats.maxStreak, next.streak);
        } else {
          next.streak = 0;
        }
        saveJSON(STATS_KEY, next);
        return next;
      });
    }
    const t = setTimeout(() => dispatch({ type: "SET_RESULT_OPEN", open: true }), 550);
    return () => clearTimeout(t);
  }, [state.status, state.mode, state.dailyIndex]);

  useEffect(() => {
    function onKeyDown(e) {
      if (state.helpOpen || state.resultOpen) {
        if (e.key === "Escape") {
          dispatch({ type: "SET_HELP_OPEN", open: false });
          dispatch({ type: "SET_RESULT_OPEN", open: false });
        }
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        dispatch({ type: "SUBMIT" });
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        dispatch({ type: "BACKSPACE" });
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        dispatch({ type: "SET_CURSOR", index: state.cursor - 1 });
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        dispatch({ type: "SET_CURSOR", index: state.cursor + 1 });
        return;
      }
      const k = e.key.toLowerCase();
      if (k === "'" || k === "`") {
        dispatch({ type: "INPUT_CHAR", ch: "ʻ" });
        return;
      }
      if (/^[a-z]$/.test(k)) {
        dispatch({ type: "INPUT_CHAR", ch: k });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.helpOpen, state.resultOpen, state.cursor]);

  const startDaily = useCallback(() => {
    const idx = dailyIndexForDate(new Date(), SOLUTIONS.length);
    const solution = wordAt(idx);
    const saved = loadJSON(`soztop-daily-${idx}`, null);
    dispatch({ type: "INIT_DAILY", idx, solution, saved });
  }, []);

  const startPractice = useCallback((excludeWord) => {
    dispatch({ type: "START_PRACTICE", solution: randomWord(excludeWord) });
  }, []);

  // Practice: get a fresh random word. Daily: replay today's word from
  // scratch (clears saved progress) — handy while testing; consider gating
  // this once the daily mode ships for real players.
  const restart = useCallback(() => {
    dispatch({ type: "SET_RESULT_OPEN", open: false });
    if (state.mode === "practice") {
      dispatch({ type: "START_PRACTICE", solution: randomWord(state.solution?.word) });
      return;
    }
    dispatch({ type: "RESTART_DAILY" });
    try {
      localStorage.removeItem(`soztop-daily-${state.dailyIndex}`);
    } catch {
      /* best-effort only */
    }
  }, [state.mode, state.solution, state.dailyIndex]);

  const pushToken = useCallback((tok) => dispatch({ type: "INPUT_TOKEN", tok }), []);
  const setCursor = useCallback((index) => dispatch({ type: "SET_CURSOR", index }), []);
  const backspace = useCallback(() => dispatch({ type: "BACKSPACE" }), []);
  const submit = useCallback(() => dispatch({ type: "SUBMIT" }), []);

  const shareText = useCallback(() => {
    const lines = state.guesses
      .map((g) =>
        g.result
          .map((r) => (r === "correct" ? "\u{1F7E9}" : r === "present" ? "\u{1F7E8}" : "⬛"))
          .join("")
      )
      .join("\n");
    const title = state.mode === "daily" ? `Soʻztop kunlik #${state.dailyIndex}` : "Soʻztop (mashq)";
    return `${title} ${state.guesses.length}/${MAX_GUESSES}\n${lines}`;
  }, [state.guesses, state.mode, state.dailyIndex]);

  const setResultOpen = useCallback((open) => dispatch({ type: "SET_RESULT_OPEN", open }), []);
  const setHelpOpen = useCallback((open) => dispatch({ type: "SET_HELP_OPEN", open }), []);

  return {
    mounted,
    ...state,
    stats,
    setResultOpen,
    setHelpOpen,
    startDaily,
    startPractice,
    restart,
    pushToken,
    setCursor,
    backspace,
    submit,
    shareText,
  };
}
