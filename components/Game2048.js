"use client";

import { useEffect, useRef } from "react";
import GameCardHeader from "@/components/GameCardHeader";
import { use2048 } from "@/lib/use2048";
import { SIZE, WIN_VALUE } from "@/lib/game2048";

const TILE_STYLES = {
  2: "bg-surface-2 text-text",
  4: "bg-surface border border-border text-text",
  8: "bg-amber/30 text-text",
  16: "bg-amber/50 text-text",
  32: "bg-amber/70 text-accent-ink",
  64: "bg-amber text-accent-ink",
  128: "bg-accent/40 text-text",
  256: "bg-accent/60 text-text",
  512: "bg-accent/80 text-accent-ink",
  1024: "bg-accent text-accent-ink",
  2048: "bg-accent-strong text-accent-ink",
};
const HIGH_TILE_STYLE = "bg-gradient-to-br from-accent to-accent-strong text-accent-ink";

const SWIPE_THRESHOLD = 24; // px — below this a touch is a tap, not a swipe

export default function Game2048({ registerControls }) {
  const game = use2048();
  const touchStart = useRef(null);

  useEffect(() => {
    if (!registerControls) return;
    registerControls({ streak: 0, showDailyBadge: false });
  }, [registerControls]);

  if (!game.mounted || !game.board) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-strong animate-pulse" />
      </div>
    );
  }

  function onTouchStart(e) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(e) {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      game.move(dx > 0 ? "right" : "left");
    } else {
      game.move(dy > 0 ? "down" : "up");
    }
  }

  const over = game.status === "over";
  const won = game.status === "won";

  return (
    <>
      <GameCardHeader
        icon="🔢"
        title="2048"
        subtitle="Bir xil raqamlarni suring va qoʻshing — 2048 ga yeting."
        onRestart={game.newGame}
      >
        <span className="text-xs font-bold text-text-dim bg-surface-2 border border-border rounded-full px-3 py-1.5">
          {game.score} ball
        </span>
        <span className="text-xs font-bold text-text-dim bg-surface-2 border border-border rounded-full px-3 py-1.5">
          Rekord {game.stats.bestScore}
        </span>
      </GameCardHeader>

      <div className="max-w-md mx-auto w-full flex flex-col gap-5 pb-8">
        <div
          className="relative bg-accent/10 border border-border rounded-2xl p-2 sm:p-3 select-none touch-none"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
            {game.board.map((row, r) =>
              row.map((value, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`aspect-square rounded-lg flex items-center justify-center font-display font-extrabold transition-colors ${
                    value == null
                      ? "bg-surface-2/60"
                      : (TILE_STYLES[value] || HIGH_TILE_STYLE)
                  } ${value >= 1000 ? "text-base sm:text-lg" : value >= 100 ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"}`}
                >
                  {value}
                </div>
              ))
            )}
          </div>

          {won && (
            <div className="absolute inset-0 rounded-2xl bg-black/55 flex items-center justify-center p-5">
              <div className="bg-surface rounded-2xl p-5 text-center max-w-xs shadow-2xl">
                <p className="font-display font-extrabold text-lg mb-1">Siz yutdingiz! 🎉</p>
                <p className="text-sm text-text-dim mb-4">{WIN_VALUE} katakchaga yetdingiz.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={game.dismissWin}
                    className="flex-1 bg-accent text-accent-ink font-extrabold text-sm rounded-xl py-2.5"
                  >
                    Davom etish
                  </button>
                  <button
                    type="button"
                    onClick={game.newGame}
                    className="flex-1 bg-surface-2 text-text font-bold text-sm rounded-xl py-2.5"
                  >
                    Yangi oʻyin
                  </button>
                </div>
              </div>
            </div>
          )}

          {over && (
            <div className="absolute inset-0 rounded-2xl bg-black/55 flex items-center justify-center p-5">
              <div className="bg-surface rounded-2xl p-5 text-center max-w-xs shadow-2xl">
                <p className="font-display font-extrabold text-lg mb-1">Oʻyin tugadi</p>
                <p className="text-sm text-text-dim mb-4">{game.score} ball toʻpladingiz.</p>
                <button
                  type="button"
                  onClick={game.newGame}
                  className="w-full bg-accent text-accent-ink font-extrabold text-sm rounded-xl py-2.5"
                >
                  Yana oʻynash
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-text-dim text-center">
          Oʻqlar tugmalari yoki barmoq bilan suring — mobilqurilmada ekranni suring.
        </p>

        <div className="flex gap-2">
          <Stat n={game.stats.played} l="OʻYNALGAN" />
          <Stat n={game.stats.bestScore} l="ENG YAXSHI BALL" />
          <Stat n={game.stats.bestTile} l="ENG KATTA KATAKCHA" />
        </div>
      </div>
    </>
  );
}

function Stat({ n, l }) {
  return (
    <div className="flex-1 bg-surface-2 rounded-xl py-2.5 text-center">
      <span className="font-display font-extrabold text-xl block">{n}</span>
      <span className="text-[9px] text-text-dim tracking-wide">{l}</span>
    </div>
  );
}
