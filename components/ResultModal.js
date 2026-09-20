"use client";

import { useState } from "react";
import { tokenLabel } from "@/lib/words";

const WIN_TITLES = ["Ajoyib!", "Barakalla!", "Zoʻr!", "Tabriklaymiz!", "Yasha!", "Zoʻr natija!"];

export default function ResultModal({
  open,
  onClose,
  status,
  solution,
  guessCount,
  mode,
  stats,
  onShare,
  onNextPractice,
}) {
  const [shareLabel, setShareLabel] = useState("Natijani nusxalash");

  if (!solution) return null;
  const won = status === "won";
  const title = won ? WIN_TITLES[Math.min(guessCount - 1, WIN_TITLES.length - 1)] : "Keyingi safar omad!";

  async function handleShare() {
    const ok = await onShare();
    setShareLabel(ok ? "Nusxalandi ✓" : "Nusxalab boʻlmadi");
    setTimeout(() => setShareLabel("Natijani nusxalash"), 1600);
  }

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
          <h2 className="font-display font-bold text-lg mb-1">{title}</h2>
          <p className="font-extrabold text-2xl tracking-wide mb-4">
            {tokenLabel(solution.word)}
          </p>

          <div className="flex gap-2 mb-4">
            <Stat n={stats.played} l="OʻYIN" />
            <Stat n={stats.wins} l="GʻALABA" />
            <Stat n={stats.streak} l="KETMA-KET" />
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="w-full bg-accent text-accent-ink font-extrabold text-sm rounded-xl py-3"
          >
            {shareLabel}
          </button>
          {mode === "practice" && (
            <button
              type="button"
              onClick={onNextPractice}
              className="mt-2 w-full bg-surface-2 text-text font-bold text-sm rounded-xl py-3"
            >
              Yangi soʻz (mashq)
            </button>
          )}
        </div>
      </div>
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
