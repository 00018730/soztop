"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { betterStatus, evaluateGuess } from "./words";
import { DEFAULT_DIGIT_LENGTH, generateSecret, maxGuessesFor } from "./codebreaker";

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

const STATS_KEY = "soztop-cb-stats";

function defaultStats() {
  return { played: 0, wins: 0, streak: 0, maxStreak: 0 };
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
  current: [],
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
    current: [],
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
    case "PUSH_DIGIT": {
      if (state.status !== "playing") return state;
      if (state.current.length >= state.digitLength) return state;
      return { ...state, current: [...state.current, action.digit] };
    }
    case "BACKSPACE": {
      if (state.status !== "playing") return state;
      return { ...state, current: state.current.slice(0, -1) };
    }
    case "SUBMIT": {
      if (state.status !== "playing") return state;
      if (state.current.length !== state.digitLength) {
        return {
          ...state,
          message: `${state.digitLength} ta raqam kerak`,
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
        current: [],
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
  const [stats, setStats] = useState(defaultStats());
  const prevStatusRef = useRef("playing");

  useEffect(() => {
    setStats(loadJSON(STATS_KEY, defaultStats()));
    dispatch({ type: "NEW_GAME", digitLength: DEFAULT_DIGIT_LENGTH });
    setMounted(true);
  }, []);

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
      } else {
        next.streak = 0;
      }
      saveJSON(STATS_KEY, next);
      return next;
    });

    const t = setTimeout(() => dispatch({ type: "SET_RESULT_OPEN", open: true }), 550);
    return () => clearTimeout(t);
  }, [state.status]);

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
      if (/^[0-9]$/.test(e.key)) {
        dispatch({ type: "PUSH_DIGIT", digit: e.key });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.helpOpen, state.resultOpen]);

  const newGame = useCallback((digitLength) => {
    dispatch({ type: "SET_RESULT_OPEN", open: false });
    dispatch({ type: "NEW_GAME", digitLength });
  }, []);

  const restart = useCallback(() => {
    dispatch({ type: "SET_RESULT_OPEN", open: false });
    dispatch({ type: "NEW_GAME" });
  }, []);

  const pushDigit = useCallback((d) => dispatch({ type: "PUSH_DIGIT", digit: d }), []);
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
    backspace,
    submit,
  };
}
