"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  DEFAULT_WORD_LENGTH,
  MAX_GUESSES,
  MERGE_PAIRS,
  betterStatus,
  dailyIndexForDate,
  evaluateGuess,
} from "./words";
import { isValidGuess, randomWord, solutionsFor, wordAt } from "./wordlist";

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

function statsKey(wordLength) {
  return `soztop-stats-${wordLength}`;
}
function dailyKey(wordLength, idx) {
  return `soztop-daily-${wordLength}-${idx}`;
}

function defaultStats() {
  return {
    played: 0,
    wins: 0,
    streak: 0,
    maxStreak: 0,
    lastWinDay: null,
    lastCountedDay: null,
    // distribution[i] = number of wins that took i+1 guesses.
    distribution: new Array(MAX_GUESSES).fill(0),
  };
}

// Merges saved stats over the defaults so older saves (from before a field
// like `distribution` existed) still come back with every key present.
function normalizeStats(raw) {
  return { ...defaultStats(), ...(raw || {}) };
}

// Read-only accessor for stats, used by the Statistika page (which just
// displays numbers and doesn't need to mount the full game hook).
export function readGameStats(wordLength) {
  return normalizeStats(loadJSON(statsKey(wordLength), null));
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

// The active row is a fixed-size array of `wordLength` slots, `null` where
// empty. Free entry: a slot is picked with SET_CURSOR (click/tap) or filled
// in order as the cursor auto-advances; either way you can fill slot 3
// before slot 1. `cursor` says which slot the next keystroke lands in.
function emptyRow(wordLength) {
  return new Array(wordLength).fill(null);
}

// All game state lives in one reducer. This is what makes it race-free:
// every dispatched action (a keystroke, Enter, a click) is processed against
// the TRUE latest state, in order — unlike a bag of separate useState values
// read through a plain-closure event handler, where a fast keystroke +
// Enter fired back-to-back could get handled by a callback that still
// closed over the *previous* render's `current` value. That was the actual
// cause of "Enter clears my guess instead of submitting it".
const initialState = {
  mode: "daily", // daily | endless
  wordLength: DEFAULT_WORD_LENGTH,
  solution: null,
  dailyIndex: 0,
  guesses: [],
  current: emptyRow(DEFAULT_WORD_LENGTH),
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
      const { idx, solution, saved, wordLength } = action;
      if (saved && saved.word === solution.word) {
        return {
          ...state,
          mode: "daily",
          wordLength,
          dailyIndex: idx,
          solution,
          guesses: saved.guesses,
          current: emptyRow(wordLength),
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
        wordLength,
        dailyIndex: idx,
        solution,
        guesses: [],
        current: emptyRow(wordLength),
        cursor: 0,
        status: "playing",
        keyStatus: {},
        message: "",
        shakeRow: null,
      };
    }
    case "START_ENDLESS":
      return {
        ...state,
        mode: "endless",
        wordLength: action.wordLength,
        solution: action.solution,
        guesses: [],
        current: emptyRow(action.wordLength),
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
        current: emptyRow(state.wordLength),
        cursor: 0,
        status: "playing",
        keyStatus: {},
        message: "",
        shakeRow: null,
        resultOpen: false,
      };
    case "SET_CURSOR": {
      if (state.status !== "playing") return state;
      const idx = Math.max(0, Math.min(state.wordLength - 1, action.index));
      return { ...state, cursor: idx };
    }
    // Already-resolved token (on-screen key, e.g. the dedicated Oʻ/Gʻ keys).
    case "INPUT_TOKEN": {
      if (state.status !== "playing") return state;
      const next = [...state.current];
      next[state.cursor] = action.tok;
      return { ...state, current: next, cursor: Math.min(state.wordLength - 1, state.cursor + 1) };
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
      return { ...state, current: next, cursor: Math.min(state.wordLength - 1, state.cursor + 1) };
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
      if (!isValidGuess(state.current, state.wordLength)) {
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
        current: emptyRow(state.wordLength),
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

  const loadDaily = useCallback((wordLength) => {
    const list = solutionsFor(wordLength);
    const idx = dailyIndexForDate(new Date(), list.length);
    const solution = wordAt(idx, wordLength);
    const saved = loadJSON(dailyKey(wordLength, idx), null);
    dispatch({ type: "INIT_DAILY", idx, solution, saved, wordLength });
  }, []);

  useEffect(() => {
    setStats(normalizeStats(loadJSON(statsKey(DEFAULT_WORD_LENGTH), null)));
    loadDaily(DEFAULT_WORD_LENGTH);
    setMounted(true);
  }, [loadDaily]);

  // Re-load stats whenever the selected word length changes (each length
  // keeps its own played/wins/streak, same as each length has its own
  // dictionary and daily puzzle).
  useEffect(() => {
    if (!mounted) return;
    setStats(normalizeStats(loadJSON(statsKey(state.wordLength), null)));
  }, [mounted, state.wordLength]);

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
    saveJSON(dailyKey(state.wordLength, state.dailyIndex), {
      word: state.solution.word,
      guesses: state.guesses,
      status: state.status,
    });
  }, [state.mode, state.wordLength, state.solution, state.dailyIndex, state.guesses, state.status]);

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
          const distribution = [...prevStats.distribution];
          const slot = Math.min(state.guesses.length, MAX_GUESSES) - 1;
          distribution[slot] = (distribution[slot] || 0) + 1;
          next.distribution = distribution;
        } else {
          next.streak = 0;
        }
        saveJSON(statsKey(state.wordLength), next);
        return next;
      });
    }
    const t = setTimeout(() => dispatch({ type: "SET_RESULT_OPEN", open: true }), 550);
    return () => clearTimeout(t);
  }, [state.status, state.mode, state.wordLength, state.dailyIndex]);

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

  const startDaily = useCallback(
    (wordLength) => {
      loadDaily(wordLength ?? state.wordLength);
    },
    [loadDaily, state.wordLength]
  );

  const startEndless = useCallback(
    (wordLength, excludeWord) => {
      const len = wordLength ?? state.wordLength;
      dispatch({ type: "START_ENDLESS", wordLength: len, solution: randomWord(excludeWord, len) });
    },
    [state.wordLength]
  );

  // Switches word length, keeping the current mode: a fresh daily puzzle
  // for that length, or a fresh random word if already in endless mode.
  const changeWordLength = useCallback(
    (wordLength) => {
      if (state.mode === "endless") {
        startEndless(wordLength);
      } else {
        loadDaily(wordLength);
      }
    },
    [state.mode, startEndless, loadDaily]
  );

  // Endless: fresh random word. Daily: replay today's word from scratch
  // (clears saved progress) — handy while testing; consider gating this
  // once the daily mode ships for real players.
  const restart = useCallback(() => {
    dispatch({ type: "SET_RESULT_OPEN", open: false });
    if (state.mode === "endless") {
      startEndless(state.wordLength, state.solution?.word);
      return;
    }
    dispatch({ type: "RESTART_DAILY" });
    try {
      localStorage.removeItem(dailyKey(state.wordLength, state.dailyIndex));
    } catch {
      /* best-effort only */
    }
  }, [state.mode, state.wordLength, state.solution, state.dailyIndex, startEndless]);

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
    const title =
      state.mode === "daily"
        ? `Soʻztop kunlik #${state.dailyIndex} (${state.wordLength} harf)`
        : `Soʻztop (${state.wordLength} harf, cheksiz)`;
    return `${title} ${state.guesses.length}/${MAX_GUESSES}\n${lines}`;
  }, [state.guesses, state.mode, state.wordLength, state.dailyIndex]);

  const setResultOpen = useCallback((open) => dispatch({ type: "SET_RESULT_OPEN", open }), []);
  const setHelpOpen = useCallback((open) => dispatch({ type: "SET_HELP_OPEN", open }), []);

  return {
    mounted,
    ...state,
    stats,
    setResultOpen,
    setHelpOpen,
    startDaily,
    startEndless,
    changeWordLength,
    restart,
    pushToken,
    setCursor,
    backspace,
    submit,
    shareText,
  };
}
