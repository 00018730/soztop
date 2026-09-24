"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useProfile } from "./useProfile";
import {
  cancelQueue,
  findMatch,
  forfeitMatch,
  makeMove,
  subscribeToIncomingMatch,
  subscribeToMatch,
} from "./supabase/connectfour";

// phase: idle -> queueing (waiting for an opponent, subscribed for one to
// appear) -> active (in a live match, subscribed to its updates) ->
// finished (win/loss/draw/forfeit). "error" covers Supabase being
// unconfigured or an RPC failure (e.g. a race where the match just ended).
export function useConnectFourOnline() {
  const { user, configured } = useProfile();
  const [phase, setPhase] = useState("idle");
  const [match, setMatch] = useState(null);
  const [error, setError] = useState(null);
  const unsubRef = useRef(null);
  const phaseRef = useRef("idle");

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const cleanup = useCallback(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
  }, []);

  // If the component unmounts (navigated away) while still queued, drop
  // out of the queue server-side too — otherwise a later stranger could
  // get matched with a player who's no longer there to play.
  useEffect(() => {
    return () => {
      cleanup();
      if (phaseRef.current === "queueing") cancelQueue();
    };
  }, [cleanup]);

  const enterMatch = useCallback(
    (row) => {
      cleanup();
      setMatch(row);
      setPhase(row.status === "finished" ? "finished" : "active");
      unsubRef.current = subscribeToMatch(row.id, (updated) => {
        setMatch(updated);
        if (updated.status === "finished") setPhase("finished");
      });
    },
    [cleanup]
  );

  const start = useCallback(async () => {
    if (!configured) {
      setPhase("error");
      setError("Supabase ulanmagan — muhit oʻzgaruvchilari (.env.local yoki hosting) tekshirilsin.");
      return;
    }
    if (!user) {
      setPhase("error");
      setError("Foydalanuvchi topilmadi — sahifani qayta yuklab koʻring.");
      return;
    }
    setError(null);
    setPhase("queueing");
    const { match: found, error: err } = await findMatch();
    if (err) {
      setPhase("error");
      setError(err);
      return;
    }
    if (found) {
      enterMatch(found);
    } else {
      unsubRef.current = subscribeToIncomingMatch(user.id, (row) => enterMatch(row));
    }
  }, [configured, user, enterMatch]);

  const cancel = useCallback(async () => {
    cleanup();
    await cancelQueue();
    setPhase("idle");
  }, [cleanup]);

  const play = useCallback(
    async (col) => {
      if (!match || phase !== "active") return;
      const { error: err } = await makeMove(match.id, col);
      if (err) setError(err); // e.g. a lost race on whose turn it is, or a full column
    },
    [match, phase]
  );

  const leaveMatch = useCallback(async () => {
    if (match && match.status === "active") await forfeitMatch(match.id);
    cleanup();
    setMatch(null);
    setError(null);
    setPhase("idle");
  }, [match, cleanup]);

  const playAgain = useCallback(() => {
    cleanup();
    setMatch(null);
    setError(null);
    setPhase("idle");
  }, [cleanup]);

  const mySymbol = match && user ? (match.player_x === user.id ? "x" : "o") : null;

  return {
    phase,
    match,
    error,
    mySymbol,
    userId: user?.id ?? null,
    start,
    cancel,
    play,
    leaveMatch,
    playAgain,
  };
}
