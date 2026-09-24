"use client";

import { useEffect } from "react";
import GameCardHeader from "@/components/GameCardHeader";
import ShareButton from "@/components/ShareButton";
import { useSpotColor } from "@/lib/useSpotColor";
import { hslToCss } from "@/lib/spotColor";

export default function SpotColorGame({ registerControls }) {
  const game = useSpotColor();

  useEffect(() => {
    if (!registerControls) return;
    registerControls({ streak: game.stats.streak, showDailyBadge: true });
  }, [registerControls, game.stats.streak]);

  if (!game.mounted || game.phase === "loading" || !game.grid) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-strong animate-pulse" />
      </div>
    );
  }

  const avgScore = game.stats.played > 0 ? Math.round(game.stats.totalScore / game.stats.played) : 0;
  const over = game.phase === "over";

  return (
    <>
      <GameCardHeader
        icon="🔍"
        title="Farqni top"
        subtitle="Boshqalaridan farq qiluvchi katakchani toping — har daraja qiyinlashadi."
        onHelp={() => game.setHelpOpen(true)}
        onRestart={game.restart}
      >
        <span className="text-xs font-bold text-text-dim bg-surface-2 border border-border rounded-full px-3 py-1.5">
          Daraja {game.level}
        </span>
      </GameCardHeader>

      <div className="max-w-md mx-auto w-full flex flex-col gap-5 pb-8">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {game.grid.map((color, i) => {
            const isOdd = i === game.oddIndex;
            const isPicked = i === game.pickedIndex;
            let ring = "";
            if (over) {
              if (isOdd) ring = "ring-4 ring-accent";
              else if (isPicked) ring = "ring-4 ring-danger";
            }
            return (
              <button
                key={i}
                type="button"
                disabled={game.phase !== "playing"}
                onClick={() => game.pick(i)}
                aria-label={`Katakcha ${i + 1}`}
                className={`aspect-square rounded-xl border border-border shadow-inner transition-transform ${ring} ${
                  game.phase === "playing" ? "active:scale-95" : ""
                }`}
                style={{ backgroundColor: hslToCss(color) }}
              />
            );
          })}
        </div>

        {game.phase === "correct" && (
          <p className="text-sm text-accent font-bold text-center">Toʻgʻri! Keyingi daraja...</p>
        )}

        {game.phase === "playing" && (
          <p className="text-sm text-text-dim text-center">
            Sakkiztasi bir xil, bittasi boshqacha — uni toping.
          </p>
        )}

        {over && (
          <>
            <div className="bg-surface border border-border rounded-2xl p-5 text-center">
              <span className="font-display font-extrabold text-4xl block">{game.score}</span>
              <span className="text-xs text-text-dim tracking-wide">DARAJA TOʻPLANDI</span>
              <p className="text-sm text-text-dim mt-2">
                {game.pickedIndex === game.oddIndex
                  ? "Bugungi urinishingiz yakunlandi."
                  : `${game.level}-darajada notoʻgʻri katakcha tanlandi.`}
              </p>
            </div>

            <div className="flex gap-2">
              <Stat n={game.stats.played} l="OʻYNALGAN" />
              <Stat n={avgScore} l="OʻRTACHA" />
              <Stat n={game.stats.bestScore} l="ENG YAXSHI" />
              <Stat n={game.stats.streak} l="KETMA-KET" />
            </div>

            <ShareButton getText={game.shareText} className="w-full" />

            <p className="text-xs text-text-dim text-center">Ertaga yangi darajalar bilan qaytib keling!</p>
          </>
        )}
      </div>

      <SpotHelpModal open={game.helpOpen} onClose={() => game.setHelpOpen(false)} />
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

function SpotHelpModal({ open, onClose }) {
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
            <b className="text-text">9 ta katakchadan</b> 8 tasi bir xil rangda, bittasi esa
            biroz boshqacha. Oʻsha katakchani bosing.
          </p>
          <p className="text-sm text-text-dim leading-relaxed mb-3">
            Toʻgʻri topsangiz — keyingi darajaga oʻtasiz, farq esa yanada kichrayadi. Notoʻgʻri
            bossangiz — oʻyin shu yerda tugaydi.
          </p>
          <p className="text-sm text-text-dim leading-relaxed">
            Har kuni bitta yangi ketma-ket darajalar, faqat bitta urinish — ballingiz nechta
            darajani toʻgʻri topganingiz.
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
