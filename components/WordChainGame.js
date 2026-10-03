"use client";

import { useEffect, useRef } from "react";
import GameCardHeader from "@/components/GameCardHeader";
import ShareButton from "@/components/ShareButton";
import { useWordChain, TURN_SECONDS } from "@/lib/useWordChain";
import { tokenLabel } from "@/lib/words";

export default function WordChainGame({ registerControls }) {
  const game = useWordChain();
  const inputRef = useRef(null);

  useEffect(() => {
    if (!registerControls) return;
    registerControls({ streak: 0, showDailyBadge: false });
  }, [registerControls]);

  useEffect(() => {
    if (game.phase === "playing") inputRef.current?.focus();
  }, [game.phase]);

  if (!game.mounted || game.phase === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-strong animate-pulse" />
      </div>
    );
  }

  const over = game.phase === "over";
  const avgWords = game.stats.played > 0 ? Math.round(game.stats.totalWords / game.stats.played) : 0;
  const low = game.timeLeft <= 5;

  function handleSubmit(e) {
    e.preventDefault();
    game.submit();
  }

  return (
    <>
      <GameCardHeader
        icon="🔗"
        title="Soʻz zanjiri"
        subtitle="Oxirgi harfdan boshlab soʻz ayting — vaqtga ulguring."
        onHelp={() => game.setHelpOpen(true)}
        onRestart={game.restart}
      >
        <span className="text-xs font-bold text-text-dim bg-surface-2 border border-border rounded-full px-3 py-1.5">
          {game.score} soʻz
        </span>
      </GameCardHeader>

      <div className="max-w-md mx-auto w-full flex flex-col gap-5 pb-8">
        {!over && (
          <>
            <div className="bg-surface border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-text-dim tracking-wide">VAQT</span>
                <span className={`font-display font-extrabold text-xl ${low ? "text-danger" : ""}`}>
                  {game.timeLeft}s
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${low ? "bg-danger" : "bg-accent"}`}
                  style={{ width: `${(game.timeLeft / TURN_SECONDS) * 100}%` }}
                />
              </div>
            </div>

            <p className="text-sm text-text-dim text-center">
              {game.requiredStart ? (
                <>
                  Keyingi soʻz <b className="text-text">{tokenLabel(game.requiredStart)}</b> harfi bilan
                  boshlansin.
                </>
              ) : (
                "Istalgan oʻzbekcha soʻzdan boshlang."
              )}
            </p>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={game.input}
                onChange={(e) => game.setInput(e.target.value)}
                placeholder="Soʻz yozing..."
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                className="flex-1 bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-accent"
              />
              <button
                type="submit"
                className="bg-accent text-accent-ink font-extrabold text-sm rounded-xl px-5"
              >
                Yubor
              </button>
            </form>

            {game.error && <p className="text-sm text-danger text-center">{game.error}</p>}

            {game.chain.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {game.chain.map((w, i) => (
                  <span
                    key={i}
                    className="text-xs font-bold bg-surface-2 border border-border rounded-full px-2.5 py-1"
                  >
                    {w.word}
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {over && (
          <>
            <div className="bg-surface border border-border rounded-2xl p-5 text-center">
              <span className="font-display font-extrabold text-4xl block">{game.score}</span>
              <span className="text-xs text-text-dim tracking-wide">SOʻZ ZANJIRI</span>
              <p className="text-sm text-text-dim mt-2">Vaqt tugadi.</p>
            </div>

            {game.chain.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center">
                {game.chain.map((w, i) => (
                  <span
                    key={i}
                    className="text-xs font-bold bg-surface-2 border border-border rounded-full px-2.5 py-1"
                  >
                    {w.word}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Stat n={game.stats.played} l="OʻYNALGAN" />
              <Stat n={avgWords} l="OʻRTACHA" />
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

      <WordChainHelpModal open={game.helpOpen} onClose={() => game.setHelpOpen(false)} />
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

function WordChainHelpModal({ open, onClose }) {
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
            Haqiqiy <b className="text-text">oʻzbekcha soʻz</b> yozing. Har bir keyingi soʻz avvalgi
            soʻzning oxirgi harfi bilan boshlanishi kerak — masalan, "olma" dan keyin "ari".
          </p>
          <p className="text-sm text-text-dim leading-relaxed mb-3">
            Bir soʻzni ikki marta ishlatib boʻlmaydi. Har bir soʻz uchun {TURN_SECONDS} soniya
            vaqtingiz bor — muddat tugasa, oʻyin tugaydi.
          </p>
          <p className="text-sm text-text-dim leading-relaxed">
            Istagancha oʻynang — ballingiz nechta soʻzni ketma-ket ayta olganingiz, Reytingda eng
            yaxshi natijangiz koʻrsatiladi.
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
