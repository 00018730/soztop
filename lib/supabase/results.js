import { createClient } from "./client";

// Upserts a daily-puzzle result for the current player. Safe to call even if
// the anonymous sign-in from useProfile() hasn't landed yet — it signs in
// itself if needed. Best-effort: a Reyting submission failing should never
// block or disrupt gameplay, so every error is swallowed after logging.
//
// `game` is "word" or "color" (Code Breaker has no daily mode yet, so it
// doesn't call this). `score` (0-100) is only meaningful for "color"; leave
// it undefined for other games and it's stored as null.
export async function submitDailyResult({ game, length, dailyIndex, won, guesses, score }) {
  try {
    const supabase = createClient();
    if (!supabase) return; // env vars missing — createClient() already logged why
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let uid = user?.id;
    if (!uid) {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      uid = data.user?.id;
    }
    if (!uid) return;

    const { error } = await supabase.from("daily_results").upsert(
      {
        user_id: uid,
        game,
        length,
        daily_index: dailyIndex,
        won,
        guesses,
        score: score ?? null,
      },
      { onConflict: "user_id,game,length,daily_index" }
    );
    if (error) throw error;
  } catch (err) {
    // Best-effort only — Reyting is a nice-to-have, never worth breaking a
    // finished game over.
    console.error("submitDailyResult failed", err);
  }
}
