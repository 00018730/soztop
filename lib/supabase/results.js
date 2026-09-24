import { createClient } from "./client";

// Resolves the current player's uid, signing in anonymously if needed.
// Shared by both submit functions below.
async function currentUid(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id) return user.id;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.user?.id ?? null;
}

// Upserts a daily-puzzle result for the current player — one row per
// user/game/length/day, enforced by a DB-level unique index scoped to
// game = 'word' (see the unlimited_replay_score_games migration). Only
// So'ztop still has a single shared daily puzzle worth deduping on;
// everything else calls submitPlayResult instead. Safe to call even if the
// anonymous sign-in from useProfile() hasn't landed yet. Best-effort: a
// Reyting submission failing should never block or disrupt gameplay, so
// every error is swallowed after logging.
export async function submitDailyResult({ game, length, dailyIndex, won, guesses, score }) {
  try {
    const supabase = createClient();
    if (!supabase) return; // env vars missing — createClient() already logged why
    const uid = await currentUid(supabase);
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

// Records one completed play of an unlimited-replay game (Rang topish,
// Farqni top, Xotira o'yini, 15 boshqotirma) as its own row — a plain
// insert, not an upsert, since there's no longer a daily uniqueness
// constraint for these games. Reyting ranks players by their personal best
// across every row (leaderboard_totals' min_score/max_score), not by a
// shared "today's puzzle" comparison. `dailyIndex` here is purely
// informational (which calendar day the play happened on), not a dedup
// key. Best-effort, same as submitDailyResult.
export async function submitPlayResult({ game, length, dailyIndex, won, guesses, score }) {
  try {
    const supabase = createClient();
    if (!supabase) return;
    const uid = await currentUid(supabase);
    if (!uid) return;

    const { error } = await supabase.from("daily_results").insert({
      user_id: uid,
      game,
      length,
      daily_index: dailyIndex,
      won,
      guesses,
      score: score ?? null,
    });
    if (error) throw error;
  } catch (err) {
    console.error("submitPlayResult failed", err);
  }
}
