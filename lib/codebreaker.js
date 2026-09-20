// Code Breaker (Mastermind-style number game).
// Reuses the exact same two-pass correct/present scoring algorithm as the
// word game (see lib/words.js) — it's already generic over any array of
// tokens, and a "token" here is just a single digit string ("0".."9").

export const DIGIT_LENGTHS = [4, 6];
export const DEFAULT_DIGIT_LENGTH = 4;

// A few more tries for the harder 6-digit mode.
export function maxGuessesFor(digitLength) {
  return digitLength === 6 ? 8 : 6;
}

export function generateSecret(digitLength) {
  const digits = [];
  for (let i = 0; i < digitLength; i++) {
    digits.push(String(Math.floor(Math.random() * 10)));
  }
  return digits;
}
