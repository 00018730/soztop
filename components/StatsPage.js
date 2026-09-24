"use client";

import { useEffect, useState } from "react";
import { WORD_LENGTHS } from "@/lib/words";
import { DIGIT_LENGTHS, maxGuessesFor } from "@/lib/codebreaker";
import { readGameStats } from "@/lib/useGame";
import { readCbStats } from "@/lib/useCodeBreaker";
import { SCORE_BUCKETS, readColorStats } from "@/lib/useColorMatch";
import { readSpotStats } from "@/lib/useSpotColor";
import { readMemoryStats } from "@/lib/useMemoryMatch";
import { readSlideStats } from "@/lib/useSlidePuzzle";

const GAMES = [
  { id: "word", label: "Soʻztop", icon: "🍃" },
  { id: "codebreaker", label: "Kod buzuvchi", icon: "🔐" },
  { id: "color", label: "Rang topish", icon: "🎨" },
  { id: "spot", label: "Farqni top", icon: "🔍" },
  { id: "memory", label: "Xotira o'yini", icon: "🧠" },
  { id: "slide", label: "15 boshqotirma", icon: "🧩" },
];

export default function StatsPage() {
  const [mounted, setMounted] = useState(false);
  const [game, setGame] = useState("word");
  const [wordLength, setWordLength] = useState(5);
  const [digitLength, setDigitLength] = useState(4);

  useEffect(() => setMounted(true), []);

  // Read straight from localStorage during render (cheap, synchronous, and
  // only re-runs on an actual re-render from a tab click) rather than a
  // useEffect + setState — that would leave a transitional render where
  // `game` has already switched but `stats` still holds the PREVIOUS game's
  // shape (e.g. color stats have no `.distribution`, word/codebreaker stats
  // have no `.buckets`), which crashed the tab switch.
  const stats = !mounted
    ? null
    : game === "word"
      ? readGameStats(wordLength)
      : game === "codebreaker"
        ? readCbStats(digitLength)
        : game === "color"
          ? readColorStats()
          : game === "spot"
            ? readSpotStats()
            : game === "memory"
              ? readMemoryStats()
              : readSlideStats();

  if (!mounted || !stats) {
    return (
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-strong animate-pulse mx-auto" />
      </div>
    );
  }

  const maxGuesses = game === "word" ? 6 : maxGuessesFor(digitLength);
  const winRate = stats.played > 0 && stats.wins != null ? Math.round((stats.wins / stats.played) * 100) : 0;
  const maxDistribution = stats.distribution ? Math.max(1, ...stats.distribution) : 1;

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
      <div>
        <h1 className="font-display font-bold text-xl mb-1">Statistika</h1>
        <p className="text-sm text-text-dim">Har bir oʻyin va uzunlik alohida hisoblanadi.</p>
      </div>

      <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-full p-1 self-start">
        {GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGame(g.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
              game === g.id ? "bg-accent text-accent-ink" : "text-text-dim"
            }`}
          >
            {g.icon} {g.label}
          </button>
        ))}
      </div>

      {game === "word" && (
        <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-full p-1 self-start">
          {WORD_LENGTHS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setWordLength(n)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                wordLength === n ? "bg-accent text-accent-ink" : "text-text-dim"
              }`}
            >
              {n} harfli
            </button>
          ))}
        </div>
      )}
      {game === "codebreaker" && (
        <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-full p-1 self-start">
          {DIGIT_LENGTHS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setDigitLength(n)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                digitLength === n ? "bg-accent text-accent-ink" : "text-text-dim"
              }`}
            >
              {n} xonali
            </button>
          ))}
        </div>
      )}

      {game === "color" ? (
        <ColorStatsBody stats={stats} />
      ) : game === "spot" ? (
        <SpotStatsBody stats={stats} />
      ) : game === "memory" ? (
        <MemoryStatsBody stats={stats} />
      ) : game === "slide" ? (
        <SlideStatsBody stats={stats} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Tile n={stats.played} l="OʻYNALGAN" />
            <Tile n={`${winRate}%`} l="GʻALABA" />
            <Tile n={stats.streak} l="JORIY KETMA-KET" />
            <Tile n={stats.maxStreak} l="ENG UZUN KETMA-KET" />
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5">
            <h2 className="font-display font-bold text-base mb-4">Urinishlar taqsimoti</h2>
            {stats.played === 0 ? (
              <p className="text-sm text-text-dim">
                Hali oʻynalmagan. Birinchi oʻyiningizdan soʻng bu yerda taqsimot koʻrinadi.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {Array.from({ length: maxGuesses }, (_, i) => {
                  const count = stats.distribution[i] || 0;
                  const pct = Math.max(count > 0 ? 8 : 0, Math.round((count / maxDistribution) * 100));
                  const isMax = count > 0 && count === maxDistribution;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-4 text-xs font-bold text-text-dim text-right">{i + 1}</span>
                      <div className="flex-1 h-6 rounded-md bg-surface-2 overflow-hidden">
                        <div
                          className={`h-full rounded-md flex items-center justify-end px-2 transition-all ${
                            isMax ? "bg-accent" : "bg-absent"
                          }`}
                          style={{ width: `${pct}%` }}
                        >
                          {count > 0 && (
                            <span
                              className={`text-[11px] font-extrabold ${
                                isMax ? "text-accent-ink" : "text-absent-text"
                              }`}
                            >
                              {count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ColorStatsBody({ stats }) {
  const avgScore = stats.played > 0 ? Math.round(stats.totalScore / stats.played) : 0;
  const buckets = stats.buckets || [];
  const maxBucket = Math.max(1, ...buckets);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Tile n={stats.played} l="OʻYNALGAN" />
        <Tile n={avgScore} l="OʻRTACHA BALL" />
        <Tile n={stats.bestScore} l="ENG YAXSHI" />
        <Tile n={stats.streak} l="JORIY KETMA-KET" />
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5">
        <h2 className="font-display font-bold text-base mb-4">Ball taqsimoti</h2>
        {stats.played === 0 ? (
          <p className="text-sm text-text-dim">
            Hali oʻynalmagan. Birinchi oʻyiningizdan soʻng bu yerda taqsimot koʻrinadi.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {SCORE_BUCKETS.map((label, i) => {
              const count = buckets[i] || 0;
              const pct = Math.max(count > 0 ? 8 : 0, Math.round((count / maxBucket) * 100));
              const isMax = count > 0 && count === maxBucket;
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-12 text-xs font-bold text-text-dim text-right">{label}</span>
                  <div className="flex-1 h-6 rounded-md bg-surface-2 overflow-hidden">
                    <div
                      className={`h-full rounded-md flex items-center justify-end px-2 transition-all ${
                        isMax ? "bg-accent" : "bg-absent"
                      }`}
                      style={{ width: `${pct}%` }}
                    >
                      {count > 0 && (
                        <span
                          className={`text-[11px] font-extrabold ${
                            isMax ? "text-accent-ink" : "text-absent-text"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function SpotStatsBody({ stats }) {
  const avgScore = stats.played > 0 ? Math.round(stats.totalScore / stats.played) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Tile n={stats.played} l="OʻYNALGAN" />
      <Tile n={avgScore} l="OʻRTACHA DARAJA" />
      <Tile n={stats.bestScore} l="ENG YAXSHI" />
      <Tile n={stats.streak} l="JORIY KETMA-KET" />
    </div>
  );
}

function MemoryStatsBody({ stats }) {
  const avgMoves = stats.played > 0 ? Math.round(stats.totalMoves / stats.played) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Tile n={stats.played} l="OʻYNALGAN" />
      <Tile n={avgMoves} l="OʻRTACHA HARAKAT" />
      <Tile n={stats.bestMoves} l="ENG YAXSHI" />
      <Tile n={stats.streak} l="JORIY KETMA-KET" />
    </div>
  );
}

function SlideStatsBody({ stats }) {
  const avgMoves = stats.played > 0 ? Math.round(stats.totalMoves / stats.played) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Tile n={stats.played} l="OʻYNALGAN" />
      <Tile n={avgMoves} l="OʻRTACHA HARAKAT" />
      <Tile n={stats.bestMoves} l="ENG YAXSHI" />
      <Tile n={stats.streak} l="JORIY KETMA-KET" />
    </div>
  );
}

function Tile({ n, l }) {
  return (
    <div className="bg-surface border border-border rounded-2xl py-4 text-center">
      <span className="font-display font-extrabold text-2xl block mb-0.5">{n}</span>
      <span className="text-[10px] text-text-dim tracking-wide">{l}</span>
    </div>
  );
}
