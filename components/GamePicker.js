"use client";

import { useEffect, useState } from "react";
import { readFavoriteGame, toggleFavoriteGame } from "@/lib/favoriteGame";

const GAMES = [
  {
    id: "word",
    icon: "🍃",
    title: "Soʻztop",
    subtitle: "Yashirin oʻzbekcha soʻzni 6 ta urinishda toping.",
  },
  {
    id: "codebreaker",
    icon: "🔐",
    title: "Kod buzuvchi",
    subtitle: "Maxfiy raqamli kodni topib, kod buzuvchiga aylaning.",
  },
  {
    id: "color",
    icon: "🎨",
    title: "Rang topish",
    subtitle: "Koʻrsatilgan rangni xotiradan slaiderlar bilan qayta hosil qiling.",
  },
  {
    id: "spot",
    icon: "🔍",
    title: "Farqni top",
    subtitle: "9 ta katakchadan bittasini toping — har daraja qiyinlashadi.",
  },
  {
    id: "tictactoe",
    icon: "⭕",
    title: "Krestik-nolik",
    subtitle: "Kompyuterga qarshi, ikkovlashib yoki onlayn tasodifiy raqib bilan.",
  },
  {
    id: "memory",
    icon: "🧠",
    title: "Xotira o'yini",
    subtitle: "Juftliklarni his qiluvchi xotiradan toping — istagancha o'ynang.",
  },
  {
    id: "connectfour",
    icon: "🔴",
    title: "Toʻrt ketma-ket",
    subtitle: "Ustunga tashlang, toʻrttasini qatorga tering — kompyuterga qarshi, ikkovlashib yoki onlayn.",
  },
  {
    id: "2048",
    icon: "🔢",
    title: "2048",
    subtitle: "Bir xil raqamlarni suring va qoʻshing — 2048 ga yeting.",
  },
  {
    id: "slide",
    icon: "🧩",
    title: "15 boshqotirma",
    subtitle: "Raqamlarni tartib bilan joylashtiring — kam harakat bilan yakunlang.",
  },
];

export default function GamePicker({ activeGame, onSelect }) {
  const [favorite, setFavorite] = useState(null);

  useEffect(() => {
    setFavorite(readFavoriteGame());
  }, []);

  function handleToggleFavorite(e, id) {
    e.stopPropagation();
    setFavorite(toggleFavoriteGame(id));
  }

  return (
    <div className="p-4 sm:p-6">
      <h2 className="font-display font-bold text-lg mb-1">Oʻyinlar</h2>
      <p className="text-sm text-text-dim mb-5">
        Oʻynamoqchi boʻlgan oʻyinni tanlang. Yulduzcha bosilgan oʻyin har safar bosh sahifada
        ochiladi.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {GAMES.map((g) => {
          const active = activeGame === g.id;
          const isFavorite = favorite === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onSelect(g.id)}
              className={`relative text-left rounded-2xl border p-5 transition-colors ${
                active
                  ? "bg-accent/10 border-accent"
                  : "bg-surface border-border hover:border-text-faint"
              }`}
            >
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => handleToggleFavorite(e, g.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleToggleFavorite(e, g.id);
                }}
                aria-label={isFavorite ? "Sevimlilardan olib tashlash" : "Sevimliga qoʻshish"}
                title={isFavorite ? "Sevimlilardan olib tashlash" : "Sevimliga qoʻshish"}
                className={`absolute top-3.5 right-3.5 w-8 h-8 rounded-full flex items-center justify-center text-base transition-colors ${
                  isFavorite ? "text-amber" : "text-text-faint hover:text-text-dim"
                }`}
              >
                {isFavorite ? "★" : "☆"}
              </span>

              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent to-accent-strong flex items-center justify-center text-accent-ink text-xl mb-4 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.18)]">
                {g.icon}
              </div>
              <h3 className="font-display font-bold text-base mb-1 pr-6">{g.title}</h3>
              <p className="text-sm text-text-dim leading-snug">{g.subtitle}</p>
              {active && (
                <span className="inline-block mt-3 text-xs font-bold text-accent">Hozir oʻynalmoqda</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
