import { createClient } from "./client";

// Thin wrappers around the SECURITY DEFINER RPCs that own all Connect Four
// online-match mutations (see the connectfour_online migration) — the
// client never writes to connectfour_matches/connectfour_queue directly,
// only through these, so a player can't fake a move or peek at someone
// else's game.

export async function findMatch() {
  const supabase = createClient();
  if (!supabase) return { match: null, error: "Supabase ulanmagan" };
  const { data, error } = await supabase.rpc("connectfour_find_match");
  if (error) return { match: null, error: error.message };
  return { match: data, error: null }; // data is null while still waiting
}

export async function cancelQueue() {
  const supabase = createClient();
  if (!supabase) return;
  try {
    await supabase.rpc("connectfour_cancel_queue");
  } catch {
    /* best-effort only */
  }
}

export async function makeMove(matchId, col) {
  const supabase = createClient();
  if (!supabase) return { match: null, error: "Supabase ulanmagan" };
  // RPC column is 1-indexed (matches SQL array indexing); the client is 0-indexed.
  const { data, error } = await supabase.rpc("connectfour_make_move", {
    match_id: matchId,
    col: col + 1,
  });
  if (error) return { match: null, error: error.message };
  return { match: data, error: null };
}

export async function forfeitMatch(matchId) {
  const supabase = createClient();
  if (!supabase) return;
  try {
    await supabase.rpc("connectfour_forfeit", { match_id: matchId });
  } catch {
    /* best-effort only */
  }
}

// Subscribes to every UPDATE on one match row (opponent's moves, forfeits).
// Returns an unsubscribe function.
export function subscribeToMatch(matchId, onChange) {
  const supabase = createClient();
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`connectfour-match-${matchId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "connectfour_matches", filter: `id=eq.${matchId}` },
      (payload) => onChange(payload.new)
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

// Subscribes a waiting (queued) player to the moment someone else's
// find_match() call pairs them up — they become player_x of the new row.
// Returns an unsubscribe function.
export function subscribeToIncomingMatch(userId, onMatch) {
  const supabase = createClient();
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`connectfour-waiting-${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "connectfour_matches", filter: `player_x=eq.${userId}` },
      (payload) => onMatch(payload.new)
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}
