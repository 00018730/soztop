"use client";

import { useEffect } from "react";
import DigitLengthSwitch from "@/components/DigitLengthSwitch";
import MessageBanner from "@/components/MessageBanner";
import GameBoard from "@/components/GameBoard";
import NumericKeypad from "@/components/NumericKeypad";
import { CodeBreakerInstructionsCard, CodeBreakerLegendCard } from "@/components/SidebarCards";
import CodeBreakerHelpModal from "@/components/CodeBreakerHelpModal";
import CodeBreakerResultModal from "@/components/CodeBreakerResultModal";
import { useCodeBreaker } from "@/lib/useCodeBreaker";

export default function CodeBreakerGame({ registerControls }) {
  const game = useCodeBreaker();

  useEffect(() => {
    if (!registerControls) return;
    registerControls({
      onHelp: () => game.setHelpOpen(true),
      onRestart: game.restart,
      showDailyBadge: false,
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
        <DigitLengthSwitch digitLength={game.digitLength} onChange={game.newGame} />
      </div>

      <MessageBanner message={game.message} />

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_240px] gap-4 lg:gap-6 items-start lg:flex-1 lg:min-h-0 pb-4 lg:pb-2">
        <div className="hidden lg:flex flex-col gap-4 order-1">
          <CodeBreakerInstructionsCard />
          <CodeBreakerLegendCard />
        </div>

        <main className="flex flex-col items-center justify-center gap-3 sm:gap-4 order-3 lg:order-2 h-full min-h-0">
          <GameBoard
            guesses={game.guesses}
            current={game.current}
            shakeRow={game.shakeRow}
            length={game.digitLength}
            maxGuesses={game.maxGuesses}
          />
          <NumericKeypad
            keyStatus={game.keyStatus}
            onDigit={game.pushDigit}
            onEnter={game.submit}
            onBackspace={game.backspace}
          />
        </main>

        <div className="hidden lg:flex flex-col gap-4 order-2 lg:order-3">
          <div className="bg-surface border border-border rounded-2xl p-5 text-center">
            <span className="text-3xl block mb-2">🔐</span>
            <p className="text-sm text-text-dim leading-relaxed">
              Maxfiy {game.digitLength} xonali kodni toping
              <br />
              {game.guesses.length}/{game.maxGuesses} urinish ishlatildi
            </p>
          </div>
        </div>
      </div>

      <div className="lg:hidden flex flex-col gap-4 pb-8">
        <CodeBreakerInstructionsCard />
        <CodeBreakerLegendCard />
      </div>

      <CodeBreakerHelpModal
        open={game.helpOpen}
        onClose={() => game.setHelpOpen(false)}
        digitLength={game.digitLength}
        maxGuesses={game.maxGuesses}
      />
      <CodeBreakerResultModal
        open={game.resultOpen}
        onClose={() => game.setResultOpen(false)}
        status={game.status}
        secret={game.secret}
        guessCount={game.guesses.length}
        stats={game.stats}
        onNewGame={() => game.newGame(game.digitLength)}
      />
    </>
  );
}
