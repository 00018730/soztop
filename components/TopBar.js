"use client";

import { useEffect, useState } from "react";

const UZ_MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

function ThemeToggle() {
  const [theme, setTheme] = useState(null); // null = system

  useEffect(() => {
    try {
      const saved = localStorage.getItem("soztop-theme");
      if (saved) {
        setTheme(saved);
        document.documentElement.setAttribute("data-theme", saved);
      }
    } catch {}
  }, []);

  function choose(next) {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("soztop-theme", next);
    } catch {}
  }

  return (
    <div className="flex items-center gap-1 bg-surface border border-border rounded-full p-1">
      <button
        type="button"
        aria-label="Yorugʻ mavzu"
        onClick={() => choose("light")}
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
          theme === "light" ? "bg-accent text-accent-ink" : "text-text-dim"
        }`}
      >
        ☀️
      </button>
      <button
        type="button"
        aria-label="Qorongʻi mavzu"
        onClick={() => choose("dark")}
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
          theme === "dark" || !theme ? "bg-accent text-accent-ink" : "text-text-dim"
        }`}
      >
        🌙
      </button>
    </div>
  );
}

export default function TopBar({ streak = 0, dateLabel, showDailyBadge = true, onProfileClick }) {
  const [today, setToday] = useState("");

  useEffect(() => {
    const d = new Date();
    setToday(`${d.getDate()}-${UZ_MONTHS[d.getMonth()]}`);
  }, []);

  return (
    <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-strong flex items-center justify-center text-accent-ink text-lg shadow-[inset_0_0_0_2px_rgba(255,255,255,0.18)]">
          🍃
        </div>
        <div>
          <h1 className="font-display font-extrabold text-xl leading-none tracking-tight">
            Soʻz<span className="text-accent">Top</span>
          </h1>
          <p className="hidden sm:block text-xs text-text-dim mt-1">
            Har kuni bir daqiqa. Miyaga bir mashq.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {streak > 0 && (
          <div className="hidden sm:flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-1.5">
            <span className="text-base">🔥</span>
            <div className="leading-tight">
              <p className="text-xs font-bold">{streak} kun</p>
              <p className="text-[10px] text-text-dim">seriya</p>
            </div>
          </div>
        )}
        {showDailyBadge && (
          <div className="hidden sm:flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-1.5">
            <span className="text-base">📅</span>
            <div className="leading-tight">
              <p className="text-[10px] text-text-dim">Bugungi soʻz</p>
              <p className="text-xs font-bold">{dateLabel || today || "—"}</p>
            </div>
          </div>
        )}
        <ThemeToggle />
        <button
          type="button"
          onClick={onProfileClick}
          aria-label="Profil"
          title="Profil"
          className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-text-dim hover:text-text transition-colors"
        >
          👤
        </button>
      </div>
    </header>
  );
}
