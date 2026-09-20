import words4 from "@/data/words4.json";
import words5 from "@/data/words5.json";
import words6 from "@/data/words6.json";
import solutions4 from "@/data/solutions4.json";
import solutions5 from "@/data/solutions5.json";
import solutions6 from "@/data/solutions6.json";
import { tokenize } from "./words";

// Two separate lists per word length, like real Wordle:
// - the full dictionary: anything here is accepted when the player submits
//   a guess, including rarer or archaic words a curious player might type.
// - a smaller, curated "solutions" subset (picked by cross-referencing the
//   dictionary against a real Uzbek word-frequency list) that get PICKED as
//   the daily/practice answer, so puzzles stay fair — no one has to guess
//   "getto" — while people can still type less common words as guesses.
const RAW_WORDS = { 4: words4, 5: words5, 6: words6 };
const RAW_SOLUTIONS = { 4: solutions4, 5: solutions5, 6: solutions6 };

function buildEntries(words) {
  return words.map((word) => ({ word, tokens: tokenize(word) }));
}

const WORDS_BY_LENGTH = {};
const VALID_GUESSES_BY_LENGTH = {};
const SOLUTIONS_BY_LENGTH = {};

for (const len of Object.keys(RAW_WORDS)) {
  const entries = buildEntries(RAW_WORDS[len]);
  WORDS_BY_LENGTH[len] = entries;
  VALID_GUESSES_BY_LENGTH[len] = new Set(entries.map((w) => w.tokens.join("|")));
  SOLUTIONS_BY_LENGTH[len] = buildEntries(RAW_SOLUTIONS[len]);
}

// Back-compat exports for the default (5-letter) length.
export const WORDS = WORDS_BY_LENGTH[5];
export const VALID_GUESSES = VALID_GUESSES_BY_LENGTH[5];
export const SOLUTIONS = SOLUTIONS_BY_LENGTH[5];

export function solutionsFor(length) {
  return SOLUTIONS_BY_LENGTH[length] ?? SOLUTIONS_BY_LENGTH[5];
}

export function wordAt(index, length = 5) {
  const list = solutionsFor(length);
  return list[index % list.length];
}

export function randomWord(excludeWord, length = 5) {
  const list = solutionsFor(length);
  if (list.length <= 1) return list[0];
  let pick;
  do {
    pick = list[Math.floor(Math.random() * list.length)];
  } while (excludeWord && pick.word === excludeWord);
  return pick;
}

export function isValidGuess(tokens, length = tokens.length) {
  const set = VALID_GUESSES_BY_LENGTH[length] ?? VALID_GUESSES_BY_LENGTH[5];
  return set.has(tokens.join("|"));
}
