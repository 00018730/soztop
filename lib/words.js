// Core Uzbek tokenizer + game logic.
// Rule (confirmed with product owner): "o'" and "g'" are each a single tile
// (they use the modifier-letter apostrophe ʻ). "sh", "ch", "ng" are typed and
// scored as two ordinary letters, same as English Wordle — no merging.

const APOS_RE = /[‘’ʻʼ′`´ʽ']/g;

export function normApos(s) {
  return s.replace(APOS_RE, "ʻ"); // canonical: ʻ (modifier letter turned comma)
}

export function tokenize(raw) {
  const s = normApos(raw.toLowerCase());
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    const two = s.slice(i, i + 2);
    if (two === "oʻ" || two === "gʻ") {
      tokens.push(two);
      i += 2;
    } else {
      tokens.push(s[i]);
      i += 1;
    }
  }
  return tokens;
}

export function tokenLabel(tok) {
  return tok.toUpperCase();
}

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

// So'ztop supports three puzzle lengths; MAX_GUESSES stays 6 for all of them.
export const WORD_LENGTHS = [4, 5, 6];
export const DEFAULT_WORD_LENGTH = 5;

const RANK = { absent: 0, present: 1, correct: 2 };

// Generic two-pass Wordle-style scorer: works over any array of tokens of
// any length (5-letter words for So'ztop, 4- or 6-digit codes for Code
// Breaker) — the length always comes from the tokens themselves, never a
// hardcoded constant.
export function evaluateGuess(guessTokens, solutionTokens) {
  const len = solutionTokens.length;
  const result = new Array(len).fill("absent");
  const count = {};
  for (const t of solutionTokens) count[t] = (count[t] || 0) + 1;

  for (let i = 0; i < len; i++) {
    if (guessTokens[i] === solutionTokens[i]) {
      result[i] = "correct";
      count[guessTokens[i]]--;
    }
  }
  for (let i = 0; i < len; i++) {
    if (result[i] === "correct") continue;
    const t = guessTokens[i];
    if (count[t] > 0) {
      result[i] = "present";
      count[t]--;
    }
  }
  return result;
}

export function betterStatus(a, b) {
  if (!a) return b;
  if (!b) return a;
  return RANK[b] > RANK[a] ? b : a;
}

// Physical-keyboard convenience: typing "o" then "'" (or "g" then "'")
// merges into one tile, matching how people actually type oʻ/gʻ.
export const MERGE_PAIRS = {
  "o,ʻ": "oʻ",
  "g,ʻ": "gʻ",
};

const DAILY_EPOCH_UTC = Date.UTC(2024, 0, 1);

export function dailyIndexForDate(date, listLength) {
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.floor((today - DAILY_EPOCH_UTC) / 86400000);
  return ((days % listLength) + listLength) % listLength;
}
