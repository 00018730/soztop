"use client";

import { useEffect, useRef } from "react";
import GameCardHeader from "@/components/GameCardHeader";
import ShareButton from "@/components/ShareButton";
import { useSanoq } from "@/lib/useSanoq";
import { ROUNDS, MAX_SCORE } from "@/lib/sanoq";

export default function SanoqGame({ registerControls }) {
  const game = useSanoq();
  const inputRef = useRef(null);

  useEffect(() => {
    if (!registerControls) return;
    registerControls({ streak: 0, showDailyBadge: false });
  }, [registerControls]);

  useEffect(() => {
    if (game.phase === "guessing") inputRef.current?.focus();
  }, [game.phase]);

  if (!game.mounted || game.phase === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-strong animate-pulse" />
      </div>
    );
  }

  const avgScore = game.stats.played > 0 ? Math.round(game.stats.totalScore / game.stats.played) : 0;
  const covered = game.mode === "quick" && game.phase === "guessing";
  const showCup = game.phase !== "select-mode" && game.phase !== "over";

  function handleSubmit(e) {
    e.preventDefault();
    game.submitGuess();
  }

  return (
    <>
      <GameCardHeader
        icon="🧮"
        title="Sanoq"
        subtitle="Idishdagi shakllarni sanang — qanchasi bor?"
        onHelp={() => game.setHelpOpen(true)}
        onRestart={game.restart}
      >
        {game.phase !== "select-mode" && game.phase !== "over" && (
          <span className="text-xs font-bold text-text-dim bg-surface-2 border border-border rounded-full px-3 py-1.5">
            {game.round + 1}/{ROUNDS}-raund
          </span>
        )}
      </GameCardHeader>

      <div className="max-w-md mx-auto w-full flex flex-col gap-5 pb-8">
        {game.phase === "select-mode" && (
          <>
            <p className="text-sm text-text-dim text-center">Rejimni tanlang va boshlang.</p>
            <button
              type="button"
              onClick={() => game.selectMode("quick")}
              className="text-left bg-surface border border-border rounded-2xl p-4 hover:border-accent transition-colors"
            >
              <span className="font-display font-bold text-base block mb-1">⚡ Tezkor</span>
              <span className="text-sm text-text-dim">
                Idish bir necha soniya koʻrinadi, keyin yopiladi — xotiradan sanang.
              </span>
            </button>
            <button
              type="button"
              onClick={() => game.selectMode("calm")}
              className="text-left bg-surface border border-border rounded-2xl p-4 hover:border-accent transition-colors"
            >
              <span className="font-display font-bold text-base block mb-1">🧘 Tinch</span>
              <span className="text-sm text-text-dim">
                Idish taxmin qilguningizcha koʻrinib turadi — shoshilmay sanang.
              </span>
            </button>
          </>
        )}

        {showCup && (
          <>
            <div className="relative w-64 h-52 mx-auto">
              <div
                className="absolute inset-0 bg-surface-2 border-2 border-border"
                style={{ clipPath: "polygon(14% 0%, 86% 0%, 74% 100%, 26% 100%)" }}
              >
                {!covered &&
                  game.items.map((it, i) => (
                    <span
                      key={i}
                      className="absolute text-2xl leading-none -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${it.leftPct}%`, top: `${it.topPct}%` }}
                    >
                      {it.emoji}
                    </span>
                  ))}
                {covered && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl text-text-faint">?</span>
                  </div>
                )}
              </div>

              {game.phase === "revealing" && (
                <span className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-accent text-accent-ink font-extrabold text-sm flex items-center justify-center shadow">
                  {game.revealLeft}s
                </span>
              )}
            </div>

            {game.phase === "revealing" && (
              <p className="text-sm text-text-dim text-center">Yaxshilab koʻrib qoling...</p>
            )}

            {game.phase === "guessing" && (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={game.input}
                  onChange={(e) => game.setInput(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Nechta?"
                  autoComplete="off"
                  className="flex-1 bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-accent text-center"
                />
                <button
                  type="submit"
                  className="bg-accent text-accent-ink font-extrabold text-sm rounded-xl px-5"
                >
                  Taxmin
                </button>
              </form>
            )}

            {game.phase === "feedback" && (
              <div className="bg-surface border border-border rounded-2xl p-4 text-center">
                <p className="text-sm text-text-dim">
                  Siz: <b className="text-text">{game.history[game.history.length - 1]?.guess}</b> · Haqiqiy:{" "}
                  <b className="text-text">{game.actual}</b>
                </p>
                <p className="font-display font-extrabold text-2xl mt-1">+{game.roundScore} ball</p>
              </div>
            )}
          </>
        )}

        {game.phase === "over" && (
          <>
            <div className="bg-surface border border-border rounded-2xl p-5 text-center">
              <span className="font-display font-extrabold text-4xl block">
                {game.totalScore}/{MAX_SCORE}
              </span>
              <span className="text-xs text-text-dim tracking-wide">UMUMIY BALL</span>
            </div>

            <div className="flex flex-wrap gap-1.5 justify-center">
              {game.history.map((h, i) => (
                <span
                  key={i}
                  className="text-xs font-bold bg-surface-2 border border-border rounded-full px-2.5 py-1"
                >
                  {h.round}: {h.guess}/{h.actual}
                </span>
              ))}
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

      <SanoqHelpModal open={game.helpOpen} onClose={() => game.setHelpOpen(false)} />
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

function SanoqHelpModal({ open, onClose }) {
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
            Idish turli shakllar bilan toʻladi. <b className="text-text">Tezkor</b> rejimda bir necha
            soniyadan soʻng idish yopiladi — xotiradan sanashingiz kerak boʻladi.{" "}
            <b className="text-text">Tinch</b> rejimda idish taxmin qilguningizcha koʻrinib turadi.
          </p>
          <p className="text-sm text-text-dim leading-relaxed mb-3">
            Toʻgʻri sonni aniq topsangiz — 100 ball. Yaqin boʻlsangiz ham ball olasiz, qanchalik uzoq
            boʻlsa, shuncha kam. Har bir oʻyin {ROUNDS} raunddan iborat, har safar qiyinlashadi.
          </p>
          <p className="text-sm text-text-dim leading-relaxed">
            Istagancha oʻynang — Reytingda eng yaxshi umumiy balingiz koʻrsatiladi.
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
