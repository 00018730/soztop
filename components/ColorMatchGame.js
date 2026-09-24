"use client";

import { useEffect } from "react";
import GameCardHeader from "@/components/GameCardHeader";
import ShareButton from "@/components/ShareButton";
import { useColorMatch } from "@/lib/useColorMatch";
import { rgbToCss, rgbToHex, scoreLabel } from "@/lib/colors";

const CHANNELS = [
  { key: "r", label: "Qizil" },
  { key: "g", label: "Yashil" },
  { key: "b", label: "Koʻk" },
];

export default function ColorMatchGame({ registerControls }) {
  const game = useColorMatch();

  useEffect(() => {
    if (!registerControls) return;
    registerControls({ streak: 0, showDailyBadge: false });
  }, [registerControls]);

  if (!game.mounted || game.phase === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-strong animate-pulse" />
      </div>
    );
  }

  const avgScore = game.stats.played > 0 ? Math.round(game.stats.totalScore / game.stats.played) : 0;

  return (
    <>
      <GameCardHeader
        icon="🎨"
        title="Rang topish"
        subtitle="Koʻrsatilgan rangni slaiderlar bilan qayta hosil qiling — istagancha o'ynang."
        onHelp={() => game.setHelpOpen(true)}
        onRestart={game.restart}
      />

      <div className="max-w-md mx-auto w-full flex flex-col gap-5 pb-8">
        {game.phase === "reveal" && (
          <>
            <div
              className="aspect-square w-full rounded-2xl border border-border shadow-inner flex items-end justify-center p-4"
              style={{ backgroundColor: rgbToCss(game.target) }}
            >
              <span className="bg-black/45 text-white font-display font-extrabold text-2xl rounded-full w-12 h-12 flex items-center justify-center">
                {game.revealLeft}
              </span>
            </div>
            <p className="text-sm text-text-dim text-center">
              Bu rangni yodlab qoling — {game.revealLeft} soniyadan soʻng u yashiriladi.
            </p>
          </>
        )}

        {game.phase === "guessing" && (
          <>
            <div
              className="aspect-square w-full rounded-2xl border border-border shadow-inner transition-colors"
              style={{ backgroundColor: rgbToCss(game.guess) }}
            />
            <p className="text-sm text-text-dim text-center">
              Endi shu rangni slaiderlar bilan qayta hosil qiling.
            </p>

            <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
              {CHANNELS.map((c) => (
                <label key={c.key} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-text-dim">
                    <span>{c.label}</span>
                    <span className="text-text">{game.guess[c.key]}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={255}
                    value={game.guess[c.key]}
                    onChange={(e) => game.setChannel(c.key, Number(e.target.value))}
                    className="w-full accent-accent"
                  />
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={game.submit}
              className="w-full bg-accent text-accent-ink font-extrabold text-sm rounded-xl py-3"
            >
              Yuborish
            </button>
          </>
        )}

        {game.phase === "result" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <ColorSwatch label="Maqsad" color={game.target} />
              <ColorSwatch label="Sizning taxminingiz" color={game.guess} />
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5 text-center">
              <span className="font-display font-extrabold text-4xl block">{game.score}</span>
              <span className="text-xs text-text-dim tracking-wide">/ 100</span>
              <p className="font-bold text-accent mt-1">{scoreLabel(game.score)}</p>

              <div className="flex flex-col gap-1.5 mt-4 text-left">
                {CHANNELS.map((c) => {
                  const diff = Math.abs(game.target[c.key] - game.guess[c.key]);
                  return (
                    <div key={c.key} className="flex items-center justify-between text-xs">
                      <span className="text-text-dim font-bold">{c.label}</span>
                      <span className="text-text">
                        {game.guess[c.key]} → {game.target[c.key]}{" "}
                        <span className="text-text-dim">(farq: {diff})</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <Stat n={game.stats.played} l="OʻYNALGAN" />
              <Stat n={avgScore} l="OʻRTACHA" />
              <Stat n={game.stats.bestScore} l="ENG YAXSHI" />
            </div>

            <ShareButton getText={game.shareText} variant="secondary" className="w-full" />

            <button
              type="button"
              onClick={game.restart}
              className="w-full bg-accent text-accent-ink font-extrabold text-sm rounded-xl py-3"
            >
              Yana oʻynash
            </button>
          </>
        )}
      </div>

      <ColorHelpModal open={game.helpOpen} onClose={() => game.setHelpOpen(false)} />
    </>
  );
}

function ColorSwatch({ label, color }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="aspect-square w-full rounded-2xl border border-border shadow-inner"
        style={{ backgroundColor: rgbToCss(color) }}
      />
      <p className="text-xs text-text-dim text-center font-bold">{label}</p>
      <p className="text-[11px] text-text-faint text-center">{rgbToHex(color)}</p>
    </div>
  );
}

function Stat({ n, l }) {
  return (
    <div className="flex-1 bg-surface-2 rounded-xl py-2.5 text-center">
      <span className="font-display font-extrabold text-xl block">{n}</span>
      <span className="text-[10px] text-text-dim tracking-wide">{l}</span>
    </div>
  );
}

function ColorHelpModal({ open, onClose }) {
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
            Ekranda <b className="text-text">5 soniya</b> davomida bir rang koʻrsatiladi. Uni
            yodlab qoling — keyin rang yashiriladi.
          </p>
          <p className="text-sm text-text-dim leading-relaxed mb-3">
            Qizil, yashil va koʻk slaiderlarni sozlab, xotiradan shu rangni qayta hosil qilishga
            harakat qiling, soʻng <b className="text-text">Yuborish</b>ni bosing.
          </p>
          <p className="text-sm text-text-dim leading-relaxed">
            Natijangiz <b className="text-text">0 dan 100 gacha</b> ball bilan baholanadi —
            qanchalik yaqin boʻlsa, ball shunchalik yuqori. Istagancha oʻynang — Reytingda eng
            yaxshi ballingiz koʻrsatiladi.
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
