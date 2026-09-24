"use client";

import { useEffect, useState } from "react";
import { WORD_LENGTHS, dailyIndexForDate } from "@/lib/words";
import { solutionsFor } from "@/lib/wordlist";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/useProfile";

const TABS = [
  { id: "today", label: "Bugungi" },
  { id: "alltime", label: "Umumiy" },
];

const GAMES = [
  { id: "word", label: "Soʻztop", icon: "🍃" },
  { id: "color", label: "Rang topish", icon: "🎨" },
  { id: "spot", label: "Farqni top", icon: "🔍" },
  { id: "memory", label: "Xotira o'yini", icon: "🧠" },
  { id: "slide", label: "15 boshqotirma", icon: "🧩" },
];

// Rang topish / Farqni top / Xotira o'yini / 15 boshqotirma are unlimited
// replay, not daily — there's no single shared puzzle to compare "today",
// so Reyting ranks these by personal best instead (leaderboard_totals'
// min_score for lower-is-better games, max_score for higher-is-better).
const SCORE_GAMES = {
  color: { length: 3, sortAsc: false, unit: "ball" },
  spot: { length: 9, sortAsc: false, unit: "daraja" },
  memory: { length: 16, sortAsc: true, unit: "harakat" },
  slide: { length: 15, sortAsc: true, unit: "harakat" },
};

const MEDALS = ["🥇", "🥈", "🥉"];

export default function ReytingPage() {
  const { user } = useProfile();
  const [supabase] = useState(() => createClient());
  const [game, setGame] = useState("word");
  const [wordLength, setWordLength] = useState(5);
  const [tab, setTab] = useState("today");
  const [rows, setRows] = useState(null); // null = loading
  const [error, setError] = useState(null);

  const scoreGame = SCORE_GAMES[game];

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);

    async function load() {
      if (!supabase) {
        setError("Supabase ulanmagan — muhit oʻzgaruvchilari (.env.local yoki hosting) tekshirilsin.");
        return;
      }

      if (scoreGame) {
        const { length, sortAsc } = scoreGame;
        const bestColumn = sortAsc ? "min_score" : "max_score";
        const { data, error: err } = await supabase
          .from("leaderboard_totals")
          .select(`user_id, username, avatar, played, ${bestColumn}`)
          .eq("game", game)
          .eq("length", length)
          .order(bestColumn, { ascending: sortAsc, nullsFirst: false })
          .limit(50);
        if (cancelled) return;
        if (err) setError(err.message);
        else setRows(data ?? []);
        return;
      }

      if (tab === "today") {
        const dailyIndex = dailyIndexForDate(new Date(), solutionsFor(wordLength).length);
        const { data, error: err } = await supabase
          .from("daily_results")
          .select("guesses, created_at, user_id, profiles(username, avatar)")
          .eq("game", "word")
          .eq("length", wordLength)
          .eq("daily_index", dailyIndex)
          .eq("won", true)
          .order("guesses", { ascending: true })
          .order("created_at", { ascending: true })
          .limit(50);
        if (cancelled) return;
        if (err) setError(err.message);
        else setRows(data ?? []);
      } else {
        const { data, error: err } = await supabase
          .from("leaderboard_totals")
          .select("user_id, username, avatar, wins, played, avg_guesses")
          .eq("game", "word")
          .eq("length", wordLength)
          .order("wins", { ascending: false })
          .order("avg_guesses", { ascending: true, nullsFirst: false })
          .limit(50);
        if (cancelled) return;
        if (err) setError(err.message);
        else setRows(data ?? []);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, game, wordLength, tab, scoreGame]);

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
      <div>
        <h1 className="font-display font-bold text-xl mb-1">Reyting</h1>
        <p className="text-sm text-text-dim">Kod buzuvchida hali kunlik topshiriq yoʻq.</p>
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

      <div className="flex flex-wrap items-center gap-3">
        {game === "word" && (
          <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-full p-1">
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

        {/* Only So'ztop still has a real "today" — the other games are
            unlimited replay and always show personal-best ranking. */}
        {game === "word" && (
          <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-full p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  tab === t.id ? "bg-accent text-accent-ink" : "text-text-dim"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {scoreGame && (
          <span className="text-xs font-bold text-text-dim bg-surface-2 border border-border rounded-full px-3 py-1.5">
            Eng yaxshi natijalar
          </span>
        )}
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5">
        {rows === null && !error && (
          <div className="flex items-center gap-3 text-sm text-text-dim">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent to-accent-strong animate-pulse" />
            Yuklanmoqda...
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        {rows && rows.length === 0 && (
          <p className="text-sm text-text-dim">
            {scoreGame
              ? "Hali hech kim oʻynamagan. Birinchi boʻling!"
              : tab === "today"
                ? "Bugun hali hech kim gʻolib boʻlmagan. Birinchi boʻling!"
                : "Bu uzunlik uchun hali natijalar yoʻq."}
          </p>
        )}

        {rows && rows.length > 0 && (
          <ol className="flex flex-col gap-1.5">
            {rows.map((row, i) => {
              const isMe = user && row.user_id === user.id;
              const name = tab === "today" && !scoreGame ? row.profiles?.username : row.username;
              const avatar = tab === "today" && !scoreGame ? row.profiles?.avatar : row.avatar;
              const bestValue = scoreGame ? (scoreGame.sortAsc ? row.min_score : row.max_score) : null;
              return (
                <li
                  key={row.user_id ?? i}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                    isMe ? "bg-accent/15" : i % 2 === 0 ? "bg-surface-2" : ""
                  }`}
                >
                  <span className="w-7 text-center text-sm font-extrabold text-text-dim">
                    {MEDALS[i] || i + 1}
                  </span>
                  {avatar && <span className="text-base leading-none">{avatar}</span>}
                  <span className={`flex-1 text-sm font-bold truncate ${isMe ? "text-accent" : ""}`}>
                    {name || "Oʻyinchi"}
                    {isMe && " (siz)"}
                  </span>
                  {scoreGame ? (
                    <span className="text-sm font-extrabold">
                      {bestValue != null ? `${bestValue} ${scoreGame.unit}` : "—"}
                      {row.played != null && (
                        <span className="text-text-dim font-bold"> · {row.played} oʻyin</span>
                      )}
                    </span>
                  ) : tab === "today" ? (
                    <span className="text-sm font-extrabold">{row.guesses}/6</span>
                  ) : (
                    <span className="text-sm font-extrabold">
                      {row.wins} gʻalaba
                      {row.avg_guesses != null && (
                        <span className="text-text-dim font-bold"> · {row.avg_guesses} oʻrt.</span>
                      )}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
