"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { betterStatus, evaluateGuess } from "./words";
import { DEFAULT_DIGIT_LENGTH, generateSecret, maxGuessesFor } from "./codebreaker";

export function cbStatsKey(digitLength) {
  return `soztop-cb-stats-${digitLength}`;
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

function defaultStats(digitLength) {
  return {
    played: 0,
    wins: 0,
    streak: 0,
    maxStreak: 0,
    // distribution[i] = number of wins that took i+1 guesses.
    distribution: new Array(maxGuessesFor(digitLength)).fill(0),
  };
}

// Merges saved stats over the defaults so older saves (from before a field
// like `distribution` existed, or before stats were split per digit length)
// still come back with every key present and the right-size distribution.
function normalizeStats(raw, digitLength) {
  return { ...defaultStats(digitLength), ...(raw || {}) };
}

// Read-only accessor for stats, used by the Statistika page (which just
// displays numbers and doesn't need to mount the full game hook).
export function readCbStats(digitLength) {
  return normalizeStats(loadJSON(cbStatsKey(digitLength), null), digitLength);
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

// The active row is a fixed-size array of `digitLength` slots, `null` where
// empty — same free-entry model as lib/useGame.js: a digit can be typed
// into any slot via SET_CURSOR (click/tap) without filling earlier ones
// first, and `cursor` says which slot the next keystroke lands in.
function emptyRow(digitLength) {
  return new Array(digitLength).fill(null);
}

// Same race-free reducer pattern as lib/useGame.js: every keystroke, click,
// and Enter press is a dispatched action handled against the true latest
// state, never a stale closure.
// No randomness up front: the initial state holds no secret at all, and a
// real one is only generated client-side inside a mount effect (mirrors
// useGame.js's INIT_DAILY pattern). That keeps server and first-client
// render identical — nothing is shown until `mounted` flips true anyway.
const initialState = {
  digitLength: DEFAULT_DIGIT_LENGTH,
  maxGuesses: maxGuessesFor(DEFAULT_DIGIT_LENGTH),
  secret: null,
  guesses: [],
  current: emptyRow(DEFAULT_DIGIT_LENGTH),
  cursor: 0,
  status: "playing", // playing | won | lost
  keyStatus: {},
  message: "",
  shakeRow: null,
  resultOpen: false,
  helpOpen: false,
};

function freshGameState(digitLength) {
  return {
    digitLength,
    maxGuesses: maxGuessesFor(digitLength),
    secret: generateSecret(digitLength),
    guesses: [],
    current: emptyRow(digitLength),
    cursor: 0,
    status: "playing",
    keyStatus: {},
    message: "",
    shakeRow: null,
    resultOpen: false,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "NEW_GAME": {
      const digitLength = action.digitLength ?? state.digitLength;
      return {
        ...state,
        ...freshGameState(digitLength),
      };
    }
    case "SET_CURSOR": {
      if (state.status !== "playing") return state;
      const idx = Math.max(0, Math.min(state.digitLength - 1, action.index));
      return { ...state, cursor: idx };
    }
    case "INPUT_DIGIT": {
      if (state.status !== "playing") return state;
      const next = [...state.current];
      next[state.cursor] = action.digit;
      return { ...state, current: next, cursor: Math.min(state.digitLength - 1, state.cursor + 1) };
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
      if (state.status !== "playing") return state;
      if (state.current.some((d) => d == null)) {
        return {
          ...state,
          message: "Barcha katakchani toʻldiring",
          shakeRow: state.guesses.length,
        };
      }
      const result = evaluateGuess(state.current, state.secret);
      const row = { tokens: state.current, result };
      const nextGuesses = [...state.guesses, row];
      const nextKeyStatus = { ...state.keyStatus };
      row.tokens.forEach((t, i) => {
        nextKeyStatus[t] = betterStatus(nextKeyStatus[t], row.result[i]);
      });
      const won = result.every((r) => r === "correct");
      let nextStatus = "playing";
      if (won) nextStatus = "won";
      else if (nextGuesses.length >= state.maxGuesses) nextStatus = "lost";
      return {
        ...state,
        guesses: nextGuesses,
        current: emptyRow(state.digitLength),
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

export function useCodeBreaker() {
  const [mounted, setMounted] = useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [stats, setStats] = useState(defaultStats(DEFAULT_DIGIT_LENGTH));
  const prevStatusRef = useRef("playing");

  useEffect(() => {
    setStats(normalizeStats(loadJSON(cbStatsKey(DEFAULT_DIGIT_LENGTH), null), DEFAULT_DIGIT_LENGTH));
    dispatch({ type: "NEW_GAME", digitLength: DEFAULT_DIGIT_LENGTH });
    setMounted(true);
  }, []);

  // Re-load stats whenever the digit length changes (each length keeps its
  // own played/wins/streak/distribution, since maxGuesses differs).
  useEffect(() => {
    if (!mounted) return;
    setStats(normalizeStats(loadJSON(cbStatsKey(state.digitLength), null), state.digitLength));
  }, [mounted, state.digitLength]);

  useEffect(() => {
    if (!state.message) return undefined;
    const t = setTimeout(() => dispatch({ type: "CLEAR_MESSAGE" }), 1500);
    return () => clearTimeout(t);
  }, [state.message]);

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = state.status;
    if (prev !== "playing" || (state.status !== "won" && state.status !== "lost")) return undefined;

    setStats((prevStats) => {
      const next = { ...prevStats, played: prevStats.played + 1 };
      if (state.status === "won") {
        next.wins = prevStats.wins + 1;
        next.streak = prevStats.streak + 1;
        next.maxStreak = Math.max(prevStats.maxStreak, next.streak);
        const distribution = [...prevStats.distribution];
        const slot = Math.min(state.guesses.length, state.maxGuesses) - 1;
        distribution[slot] = (distribution[slot] || 0) + 1;
        next.distribution = distribution;
      } else {
        next.streak = 0;
      }
      saveJSON(cbStatsKey(state.digitLength), next);
      return next;
    });

    const t = setTimeout(() => dispatch({ type: "SET_RESULT_OPEN", open: true }), 550);
    return () => clearTimeout(t);
  }, [state.status, state.digitLength, state.guesses, state.maxGuesses]);

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
      if (/^[0-9]$/.test(e.key)) {
        dispatch({ type: "INPUT_DIGIT", digit: e.key });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.helpOpen, state.resultOpen, state.cursor]);

  const newGame = useCallback((digitLength) => {
    dispatch({ type: "SET_RESULT_OPEN", open: false });
    dispatch({ type: "NEW_GAME", digitLength });
  }, []);

  const restart = useCallback(() => {
    dispatch({ type: "SET_RESULT_OPEN", open: false });
    dispatch({ type: "NEW_GAME" });
  }, []);

  const pushDigit = useCallback((d) => dispatch({ type: "INPUT_DIGIT", digit: d }), []);
  const setCursor = useCallback((index) => dispatch({ type: "SET_CURSOR", index }), []);
  const backspace = useCallback(() => dispatch({ type: "BACKSPACE" }), []);
  const submit = useCallback(() => dispatch({ type: "SUBMIT" }), []);

  const setResultOpen = useCallback((open) => dispatch({ type: "SET_RESULT_OPEN", open }), []);
  const setHelpOpen = useCallback((open) => dispatch({ type: "SET_HELP_OPEN", open }), []);

  return {
    mounted,
    ...state,
    stats,
    setResultOpen,
    setHelpOpen,
    newGame,
    restart,
    pushDigit,
    setCursor,
    backspace,
    submit,
  };
}
