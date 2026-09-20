"use client";

import { useCallback, useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import GamePicker from "@/components/GamePicker";
import StatsPage from "@/components/StatsPage";
import SettingsPage from "@/components/SettingsPage";
import ReytingPage from "@/components/ReytingPage";
import WordGame from "@/components/WordGame";
import CodeBreakerGame from "@/components/CodeBreakerGame";

const GAME_KEY = "soztop-active-game";

export default function Home() {
  // Defaults on first paint (and on the server) so hydration always
  // matches; the user's last choice is restored right after mount.
  const [activeGame, setActiveGame] = useState("word");
  const [view, setView] = useState("home");
  const [mounted, setMounted] = useState(false);
  const [gameInfo, setGameInfo] = useState({ streak: 0, showDailyBadge: true });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(GAME_KEY);
      if (saved === "word" || saved === "codebreaker") setActiveGame(saved);
    } catch {
      /* best-effort only */
    }
    setMounted(true);
  }, []);

  function selectGame(game) {
    setActiveGame(game);
    try {
      localStorage.setItem(GAME_KEY, game);
    } catch {
      /* best-effort only */
    }
    setView("home");
  }

  // Passed down to whichever game is active; it hands back its streak/daily
  // info so the one shared top bar can reflect either game.
  const registerControls = useCallback((next) => setGameInfo(next), []);

  if (!mounted) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-strong animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-bg flex flex-col">
      <TopBar
        streak={gameInfo.streak}
        showDailyBadge={view === "home" && gameInfo.showDailyBadge}
        onProfileClick={() => setView("settings")}
      />

      <div className="flex flex-1 min-h-0">
        <Sidebar view={view} onChange={setView} />

        <div className="flex-1 min-h-0 overflow-y-auto pb-16 md:pb-0">
          {view === "home" && (
            <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-4 flex flex-col lg:h-full">
              {activeGame === "word" ? (
                <WordGame key="word" registerControls={registerControls} />
              ) : (
                <CodeBreakerGame key="codebreaker" registerControls={registerControls} />
              )}
            </div>
          )}

          {view === "games" && <GamePicker activeGame={activeGame} onSelect={selectGame} />}

          {view === "stats" && <StatsPage />}

          {view === "rating" && <ReytingPage />}

          {view === "settings" && <SettingsPage />}
        </div>
      </div>

      <BottomNav view={view} onChange={setView} />
    </div>
  );
}
