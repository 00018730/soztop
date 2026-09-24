"use client";

import { useEffect } from "react";
import GameCardHeader from "@/components/GameCardHeader";
import ShareButton from "@/components/ShareButton";
import { useMemoryMatch } from "@/lib/useMemoryMatch";

export default function MemoryMatchGame({ registerControls }) {
  const game = useMemoryMatch();

  useEffect(() => {
    if (!registerControls) return;
    registerControls({ streak: game.stats.streak, showDailyBadge: true });
  }, [registerControls, game.stats.streak]);

  if (!game.mounted || game.phase === "loading" || !game.cards) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-strong animate-pulse" />
      </div>
    );
  }

  const avgMoves = game.stats.played > 0 ? Math.round(game.stats.totalMoves / game.stats.played) : 0;
  const over = game.phase === "over";
  const locked = game.phase !== "playing";

  return (
    <>
      <GameCardHeader
        icon="🧠"
        title="Xotira o'yini"
        subtitle="Juftliklarni his qiluvchi xotiradan toping — har kuni yangi jadval."
        onHelp={() => game.setHelpOpen(true)}
        onRestart={game.restart}
      >
        <span className="text-xs font-bold text-text-dim bg-surface-2 border border-border rounded-full px-3 py-1.5">
          {game.moves} harakat
        </span>
      </GameCardHeader>

      <div className="max-w-md mx-auto w-full flex flex-col gap-5 pb-8">
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {game.cards.map((card) => {
            const isMatched = game.matched.includes(card.id);
            const isFaceUp = isMatched || game.flipped.includes(card.id);
            return (
              <button
                key={card.id}
                type="button"
                disabled={locked || isMatched}
                onClick={() => game.flip(card.id)}
                aria-label={isFaceUp ? card.emoji : "Yopiq katakcha"}
                className={`aspect-square rounded-xl border text-xl sm:text-2xl flex items-center justify-center transition-all ${
                  isMatched
                    ? "bg-accent/15 border-accent"
                    : isFaceUp
                      ? "bg-surface border-text-faint"
                      : "bg-surface-2 border-border active:scale-95"
                }`}
              >
                {isFaceUp ? card.emoji : ""}
              </button>
            );
          })}
        </div>

        {!over && (
          <p className="text-sm text-text-dim text-center">
            Ikkita bir xil katakchani toping — 8 juftlikning barchasini his qiling.
          </p>
        )}

        {over && (
          <>
            <div className="bg-surface border border-border rounded-2xl p-5 text-center">
              <span className="font-display font-extrabold text-4xl block">{game.moves}</span>
              <span className="text-xs text-text-dim tracking-wide">HARAKATDA YAKUNLANDI</span>
            </div>

            <div className="flex gap-2">
              <Stat n={game.stats.played} l="OʻYNALGAN" />
              <Stat n={avgMoves} l="OʻRTACHA" />
              <Stat n={game.stats.bestMoves} l="ENG YAXSHI" />
              <Stat n={game.stats.streak} l="KETMA-KET" />
            </div>

            <ShareButton getText={game.shareText} className="w-full" />

            <p className="text-xs text-text-dim text-center">Ertaga yangi jadval bilan qaytib keling!</p>
          </>
        )}
      </div>

      <MemoryHelpModal open={game.helpOpen} onClose={() => game.setHelpOpen(false)} />
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

function MemoryHelpModal({ open, onClose }) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/55 transition-opacity ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`bg-surface rounded-2xl max-w-sm w-full shadow-2xl transition-transform ${
          open ? "translate-y-0" : "translate-y-2"
        }`}
      >
        <div className="h-2 rounded-t-2xl bg-gradient-to-r from-accent via-amber to-accent" />
        <div className="p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-sm"
          >
            ✕
          </button>
          <h2 className="font-display font-bold text-lg mb-3">Qanday oʻynash kerak</h2>
          <p className="text-sm text-text-dim leading-relaxed mb-3">
            <b className="text-text">16 ta katakcha</b> — 8 juftlik. Ikkitasini oching, agar bir xil
            boʻlsa — ochiq qoladi, boʻlmasa — yana yopiladi.
          </p>
          <p className="text-sm text-text-dim leading-relaxed mb-3">
            Barcha juftliklarni topsangiz — oʻyin tugaydi. Maqsad — kamroq harakat bilan yakunlash.
          </p>
          <p className="text-sm text-text-dim leading-relaxed">
            Har kuni bitta yangi jadval, faqat bitta urinish — ballingiz nechta harakat
            sarflaganingiz.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full bg-accent text-accent-ink font-extrabold text-sm rounded-xl py-3"
          >
            Tushunarli
          </button>
        </div>
      </div>
    </div>
  );
}
