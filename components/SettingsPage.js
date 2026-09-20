"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/lib/useProfile";

export default function SettingsPage() {
  const { profile, loading, configured, updateUsername } = useProfile();
  const [name, setName] = useState("");
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error
  const [errorMsg, setErrorMsg] = useState("");

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
        )}

        <p className="text-xs text-text-dim mt-4 leading-relaxed">
          Bu ism Reyting boʻlimida boshqa oʻyinchilarga koʻrinadi. Hisob yaratish yoki parol
          kiritish shart emas — profilingiz avtomatik yaratiladi.
        </p>
      </div>
    </div>
  );
}
