// Combines every game's separately-keyed local stats into one profile-page
// summary, so a player doesn't have to click through Statistika's 7 tabs
// (each split further by word/digit length or vs-computer/local mode) to
// get a sense of their own overall activity.

import { WORD_LENGTHS } from "./words";
import { readGameStats } from "./useGame";
import { DIGIT_LENGTHS } from "./codebreaker";
import { readCbStats } from "./useCodeBreaker";
import { readColorStats } from "./useColorMatch";
import { readSpotStats } from "./useSpotColor";
import { readMemoryStats } from "./useMemoryMatch";
import { readSlideStats } from "./useSlidePuzzle";
import { read2048Stats } from "./use2048";
import { readTicTacToeTotalPlayed } from "./useTicTacToeLocal";
import { readConnectFourTotalPlayed } from "./useConnectFourLocal";

export const GAME_LABELS = {
  word: "Soʻztop",
  codebreaker: "Kod buzuvchi",
  color: "Rang topish",
  spot: "Farqni top",
  memory: "Xotira o'yini",
  slide: "15 boshqotirma",
  tictactoe: "Krestik-nolik",
  connectfour: "Toʻrt ketma-ket",
  "2048": "2048",
};

export function computeOverview() {
  let wordPlayed = 0;
  let wordStreak = 0;
  for (const len of WORD_LENGTHS) {
    const s = readGameStats(len);
    wordPlayed += s.played;
    wordStreak = Math.max(wordStreak, s.streak);
  }

  let cbPlayed = 0;
  let cbStreak = 0;
  for (const len of DIGIT_LENGTHS) {
    const s = readCbStats(len);
    cbPlayed += s.played;
    cbStreak = Math.max(cbStreak, s.streak);
  }

  const color = readColorStats();
  const spot = readSpotStats();
  const memory = readMemoryStats();
  const slide = readSlideStats();
  const g2048 = read2048Stats();

  const perGame = {
    word: { played: wordPlayed, streak: wordStreak },
    codebreaker: { played: cbPlayed, streak: cbStreak },
    color: { played: color.played, streak: color.streak },
    spot: { played: spot.played, streak: spot.streak },
    memory: { played: memory.played, streak: memory.streak },
    slide: { played: slide.played, streak: slide.streak },
    // These three have no daily-streak concept — free/replayable play.
    tictactoe: { played: readTicTacToeTotalPlayed(), streak: 0 },
    connectfour: { played: readConnectFourTotalPlayed(), streak: 0 },
    "2048": { played: g2048.played, streak: 0 },
  };

  let totalPlayed = 0;
  let longestStreak = 0;
  let mostPlayedId = null;
  let mostPlayedCount = 0;
  for (const [id, s] of Object.entries(perGame)) {
    totalPlayed += s.played;
    longestStreak = Math.max(longestStreak, s.streak);
    if (s.played > mostPlayedCount) {
      mostPlayedCount = s.played;
      mostPlayedId = id;
    }
  }

  return {
    totalPlayed,
    longestStreak,
    mostPlayedId,
    mostPlayedLabel: mostPlayedId ? GAME_LABELS[mostPlayedId] : null,
    perGame,
  };
}
