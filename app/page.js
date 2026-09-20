"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import GameSwitcher from "@/components/GameSwitcher";
import WordGame from "@/components/WordGame";
import CodeBreakerGame from "@/components/CodeBreakerGame";

const GAME_KEY = "soztop-active-game";

export default function Home() {
  // Defaults to the word game on first paint (and on the server) so
  // hydration always matches; the user's last choice is restored right
  // after mount.
  const [activeGame, setActiveGame] = useState("word");
  const [mounted, setMounted] = useState(false);
  const [controls, setControls] = useState({
    onHelp: () => {},
    onRestart: () => {},
    showDailyBadge: true,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(GAME_KEY);
      if (saved === "word" || saved === "codebreaker") setActiveGame(saved);
    } catch {
      /* best-effort only */
    }
    setMounted(true);
  }, []);

  function changeGame(game) {
    setActiveGame(game);
    try {
      localStorage.setItem(GAME_KEY, game);
    } catch {
      /* best-effort only */
    }
  }

  // Passed down to whichever game is active; it hands back its own
  // help/restart handlers so the one shared Header can drive either game.
  const registerControls = useCallback((next) => setControls(next), []);

  if (!mounted) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-strong animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-bg">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 h-full flex flex-col">
        <Header
          onHelp={controls.onHelp}
          onRestart={controls.onRestart}
          showDailyBadge={controls.showDailyBadge}
        />

        <div className="mb-2.5">
          <GameSwitcher game={activeGame} onChange={changeGame} />
        </div>

        {activeGame === "word" ? (
          <WordGame key="word" registerControls={registerControls} />
        ) : (
          <CodeBreakerGame key="codebreaker" registerControls={registerControls} />
        )}
      </div>
    </div>
  );
}
