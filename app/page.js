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
import ColorMatchGame from "@/components/ColorMatchGame";
import SpotColorGame from "@/components/SpotColorGame";
import TicTacToeGame from "@/components/TicTacToeGame";
import MemoryMatchGame from "@/components/MemoryMatchGame";
import ConnectFourGame from "@/components/ConnectFourGame";
import Game2048 from "@/components/Game2048";
import SlidePuzzleGame from "@/components/SlidePuzzleGame";
import { readFavoriteGame } from "@/lib/favoriteGame";

const GAME_KEY = "soztop-active-game";
const VALID_GAMES = [
  "word",
  "codebreaker",
  "color",
  "spot",
  "tictactoe",
  "memory",
  "connectfour",
  "2048",
  "slide",
];

export default function Home() {
  // Defaults on first paint (and on the server) so hydration always
  // matches; the user's last choice is restored right after mount.
  const [activeGame, setActiveGame] = useState("word");
  const [view, setView] = useState("home");
  const [mounted, setMounted] = useState(false);
  const [gameInfo, setGameInfo] = useState({ streak: 0, showDailyBadge: true });

  useEffect(() => {
    try {
      // A pinned favorite always wins on load — that's the whole point of
      // pinning one, as opposed to just restoring whatever was last played.
      const favorite = readFavoriteGame();
      if (VALID_GAMES.includes(favorite)) {
        setActiveGame(favorite);
      } else {
        const saved = localStorage.getItem(GAME_KEY);
        if (VALID_GAMES.includes(saved)) setActiveGame(saved);
      }
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
              {activeGame === "word" && <WordGame key="word" registerControls={registerControls} />}
              {activeGame === "codebreaker" && (
                <CodeBreakerGame key="codebreaker" registerControls={registerControls} />
              )}
              {activeGame === "color" && (
                <ColorMatchGame key="color" registerControls={registerControls} />
              )}
              {activeGame === "spot" && (
                <SpotColorGame key="spot" registerControls={registerControls} />
              )}
              {activeGame === "tictactoe" && (
                <TicTacToeGame key="tictactoe" registerControls={registerControls} />
              )}
              {activeGame === "memory" && (
                <MemoryMatchGame key="memory" registerControls={registerControls} />
              )}
              {activeGame === "connectfour" && (
                <ConnectFourGame key="connectfour" registerControls={registerControls} />
              )}
              {activeGame === "2048" && <Game2048 key="2048" registerControls={registerControls} />}
              {activeGame === "slide" && (
                <SlidePuzzleGame key="slide" registerControls={registerControls} />
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
