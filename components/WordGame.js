"use client";

import { useEffect } from "react";
import ModeSwitch from "@/components/ModeSwitch";
import MessageBanner from "@/components/MessageBanner";
import GameBoard from "@/components/GameBoard";
import Keyboard from "@/components/Keyboard";
import { InstructionsCard, QuoteCard, DailyImageCard, WordLegendCard } from "@/components/SidebarCards";
import HelpModal from "@/components/HelpModal";
import ResultModal from "@/components/ResultModal";
import { useGame } from "@/lib/useGame";

export default function WordGame({ registerControls }) {
  const game = useGame();

  // Let the shared Header (rendered by the page shell) drive this game's
  // help/restart buttons without WordGame needing to know about Header.
  useEffect(() => {
    if (!registerControls) return;
    registerControls({
      onHelp: () => game.setHelpOpen(true),
      onRestart: game.restart,
      showDailyBadge: true,
    });
  }, [registerControls, game.setHelpOpen, game.restart]);

  if (!game.mounted) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-strong animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-2.5">
        <ModeSwitch
          mode={game.mode}
          onDaily={game.startDaily}
          onPractice={() => game.startPractice()}
        />
      </div>

      <MessageBanner message={game.message} />

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_240px] gap-4 lg:gap-6 items-start lg:flex-1 lg:min-h-0 pb-4 lg:pb-2">
        <div className="hidden lg:flex flex-col gap-4 order-1">
          <InstructionsCard />
          <WordLegendCard />
          <QuoteCard />
        </div>

        <main className="flex flex-col items-center justify-center gap-3 sm:gap-4 order-3 lg:order-2 h-full min-h-0">
          <GameBoard
            guesses={game.guesses}
            current={game.current}
            shakeRow={game.shakeRow}
            cursor={game.cursor}
            onTileClick={game.setCursor}
          />
          <Keyboard
            keyStatus={game.keyStatus}
            onChar={game.pushToken}
            onEnter={game.submit}
            onBackspace={game.backspace}
          />
        </main>

        <div className="hidden lg:flex flex-col gap-4 order-2 lg:order-3">
          <DailyImageCard />
        </div>
      </div>

      <div className="lg:hidden flex flex-col gap-4 pb-8">
        <InstructionsCard />
        <WordLegendCard />
        <QuoteCard />
        <DailyImageCard />
      </div>

      <HelpModal open={game.helpOpen} onClose={() => game.setHelpOpen(false)} />
      <ResultModal
        open={game.resultOpen}
        onClose={() => game.setResultOpen(false)}
        status={game.status}
        solution={game.solution}
        guessCount={game.guesses.length}
        mode={game.mode}
        stats={game.stats}
        onShare={async () => {
          try {
            await navigator.clipboard.writeText(game.shareText());
            return true;
          } catch {
            return false;
          }
        }}
        onNextPractice={() => {
          game.setResultOpen(false);
          game.startPractice(game.solution?.word);
        }}
      />
    </>
  );
}
