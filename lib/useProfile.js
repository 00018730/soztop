"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "./supabase/client";

// Signs the visitor in anonymously (no email/password) on first load, so
// every player has a stable id and a row in `profiles` without ever seeing
// a login screen. `profiles.username` is what Reyting/Sozlamalar show; it
// starts as an auto-generated placeholder the player can rename.
export function useProfile() {
  const [supabase] = useState(() => createClient());
  const configured = supabase !== null;
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(configured);

  const loadProfile = useCallback(
    async (uid) => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, created_at")
        .eq("id", uid)
        .maybeSingle();
      setProfile(data ?? null);
    },
    [supabase]
  );

  useEffect(() => {
    if (!supabase) return undefined; // env vars missing — nothing to do, see createClient()

    let cancelled = false;

    async function init() {
      const { data: sessionData } = await supabase.auth.getSession();
      let current = sessionData.session?.user ?? null;
      if (!current) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (!error) current = data.user;
      }
      if (cancelled) return;
      setUser(current);
      if (current) await loadProfile(current.id);
      if (!cancelled) setLoading(false);
    }
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabase, loadProfile]);

  const updateUsername = useCallback(
    async (username) => {
      if (!supabase) return { error: "Supabase ulanmagan" };
      if (!user) return { error: "Foydalanuvchi topilmadi" };
      const trimmed = username.trim();
      if (!trimmed) return { error: "Ism boʻsh boʻlmasin" };
      const { error } = await supabase.from("profiles").update({ username: trimmed }).eq("id", user.id);
      if (!error) setProfile((p) => (p ? { ...p, username: trimmed } : p));
      return { error: error?.message ?? null };
    },
    [supabase, user]
  );

  return { user, profile, loading, configured, updateUsername };
}
