import words5 from "@/data/words5.json";
import solutions5 from "@/data/solutions5.json";
import { tokenize } from "./words";

// Two separate lists, like real Wordle:
// - WORDS / VALID_GUESSES: the full dictionary (5,448 words). Anything here
//   is accepted when the player submits a guess, including rarer or archaic
//   words a curious player might type.
// - SOLUTIONS: a smaller, curated subset of everyday words (picked by
//   cross-referencing the dictionary against a real Uzbek word-frequency
//   list) that get PICKED as the daily/practice answer. This keeps puzzles
//   fair — no one has to guess "getto" — while still letting people type
//   less common words as guesses.
export const WORDS = words5.map((word) => ({
  word,
  tokens: tokenize(word),
}));

export const VALID_GUESSES = new Set(WORDS.map((w) => w.tokens.join("|")));

export const SOLUTIONS = solutions5.map((word) => ({
  word,
  tokens: tokenize(word),
}));

export function wordAt(index) {
  return SOLUTIONS[index % SOLUTIONS.length];
}

export function randomWord(excludeWord) {
  if (SOLUTIONS.length <= 1) return SOLUTIONS[0];
  let pick;
  do {
    pick = SOLUTIONS[Math.floor(Math.random() * SOLUTIONS.length)];
  } while (excludeWord && pick.word === excludeWord);
  return pick;
}

export function isValidGuess(tokens) {
  return VALID_GUESSES.has(tokens.join("|"));
}
