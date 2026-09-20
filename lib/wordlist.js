import words5 from "@/data/words5.json";
import { tokenize } from "./words";

// Precompute once at module load.
export const WORDS = words5.map((word) => ({
  word,
  tokens: tokenize(word),
}));

export const VALID_GUESSES = new Set(
  WORDS.map((w) => w.tokens.join("|"))
);

export function wordAt(index) {
  return WORDS[index % WORDS.length];
}

export function randomWord(excludeWord) {
  if (WORDS.length <= 1) return WORDS[0];
  let pick;
  do {
    pick = WORDS[Math.floor(Math.random() * WORDS.length)];
  } while (excludeWord && pick.word === excludeWord);
  return pick;
}

export function isValidGuess(tokens) {
  return VALID_GUESSES.has(tokens.join("|"));
}
