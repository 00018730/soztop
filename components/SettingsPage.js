"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/lib/useProfile";
import { AVATARS } from "@/lib/avatars";
import { computeOverview } from "@/lib/overviewStats";

const ACCENTS = [
  { id: "green", label: "Yashil", swatch: "#10b981" },
  { id: "blue", label: "Koʻk", swatch: "#0ea5e9" },
  { id: "purple", label: "Binafsha", swatch: "#a855f7" },
  { id: "rose", label: "Pushti", swatch: "#f43f5e" },
  { id: "orange", label: "Toʻqsariq", swatch: "#f97316" },
];
const ACCENT_KEY = "soztop-accent";

function AccentPicker() {
  const [accent, setAccent] = useState("green");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ACCENT_KEY);
      if (saved) {
        setAccent(saved);
        document.documentElement.setAttribute("data-accent", saved);
      }
    } catch {
      /* best-effort only */
    }
  }, []);

  function choose(id) {
    setAccent(id);
    if (id === "green") {
      document.documentElement.removeAttribute("data-accent");
    } else {
      document.documentElement.setAttribute("data-accent", id);
    }
    try {
      localStorage.setItem(ACCENT_KEY, id);
    } catch {
      /* best-effort only */
    }
  }

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      {ACCENTS.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => choose(a.id)}
          aria-label={a.label}
          title={a.label}
          className={`w-9 h-9 rounded-full transition-transform ${
            accent === a.id ? "ring-2 ring-offset-2 ring-offset-surface ring-text scale-105" : ""
          }`}
          style={{ backgroundColor: a.swatch }}
        />
      ))}
    </div>
  );
}

function OverviewCard() {
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    setOverview(computeOverview());
  }, []);

  if (!overview) return null;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📊</span>
        <h2 className="font-display font-bold text-base">Umumiy statistika</h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Tile n={overview.totalPlayed} l="JAMI OʻYIN" />
        <Tile n={overview.longestStreak} l="ENG UZUN KETMA-KET" />
        <Tile n={overview.mostPlayedLabel || "—"} l="SEVIMLI OʻYIN" small />
      </div>
    </div>
  );
}

function Tile({ n, l, small }) {
  return (
    <div className="bg-surface-2 rounded-xl py-3.5 text-center px-1.5">
      <span
        className={`font-display font-extrabold block mb-0.5 ${small ? "text-sm leading-tight" : "text-2xl"}`}
      >
        {n}
      </span>
      <span className="text-[9px] text-text-dim tracking-wide">{l}</span>
    </div>
  );
}

export default function SettingsPage() {
  const { profile, loading, configured, updateUsername, updateAvatar } = useProfile();
  const [name, setName] = useState("");
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error
  const [errorMsg, setErrorMsg] = useState("");
  const [avatarSaving, setAvatarSaving] = useState(false);

  useEffect(() => {
    if (profile) setName(profile.username);
  }, [profile]);

  async function handleSave(e) {
    e.preventDefault();
    setStatus("saving");
    const { error } = await updateUsername(name);
    if (error) {
      setErrorMsg(error);
      setStatus("error");
      return;
    }
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1600);
  }

  async function handleAvatarPick(avatar) {
    setAvatarSaving(true);
    await updateAvatar(avatar);
    setAvatarSaving(false);
  }

  return (
    <div className="max-w-[560px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
      <div>
        <h1 className="font-display font-bold text-xl mb-1">Sozlamalar</h1>
        <p className="text-sm text-text-dim">Profilingiz shu qurilma/brauzerga bogʻlangan.</p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">👤</span>
          <h2 className="font-display font-bold text-base">Profil</h2>
        </div>

        {!configured ? (
          <p className="text-sm text-danger">
            Supabase ulanmagan — muhit oʻzgaruvchilari (.env.local yoki hosting) tekshirilsin.
          </p>
        ) : loading ? (
          <div className="flex items-center gap-3 text-sm text-text-dim">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent to-accent-strong animate-pulse" />
            Yuklanmoqda...
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-xs font-bold text-text-dim tracking-wide block mb-2">AVATAR</span>
              <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    disabled={avatarSaving}
                    onClick={() => handleAvatarPick(a)}
                    aria-label={a}
                    className={`aspect-square rounded-xl flex items-center justify-center text-lg sm:text-xl transition-colors ${
                      profile?.avatar === a
                        ? "bg-accent/20 border-2 border-accent"
                        : "bg-surface-2 border border-border hover:border-text-faint"
                    } disabled:opacity-50`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-text-dim tracking-wide">ISM</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={24}
                  placeholder="Ismingiz"
                  className="w-full bg-surface-2 border border-border rounded-xl px-3.5 py-2.5 text-sm font-bold text-text outline-none focus:border-accent transition-colors"
                />
              </label>

              <button
                type="submit"
                disabled={status === "saving" || !name.trim()}
                className="self-start bg-accent text-accent-ink font-extrabold text-sm rounded-xl px-5 py-2.5 disabled:opacity-50"
              >
                {status === "saving" ? "Saqlanmoqda..." : "Saqlash"}
              </button>

              {status === "saved" && <p className="text-xs text-accent font-bold">Saqlandi ✓</p>}
              {status === "error" && <p className="text-xs text-danger font-bold">{errorMsg}</p>}
            </form>
          </div>
        )}

        <p className="text-xs text-text-dim mt-4 leading-relaxed">
          Bu ism va avatar Reyting boʻlimida boshqa oʻyinchilarga koʻrinadi. Hisob yaratish yoki
          parol kiritish shart emas — profilingiz avtomatik yaratiladi.
        </p>
      </div>

      <OverviewCard />

      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🎨</span>
          <h2 className="font-display font-bold text-base">Mavzu rangi</h2>
        </div>
        <AccentPicker />
      </div>
    </div>
  );
}
