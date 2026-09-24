// Shared 3x3 board, reused by every mode (vs computer, two players local,
// and online). `board` is a 9-cell array of "x" | "o" | null. `winLine` (an
// array of 3 indices) is highlighted when the game just ended on a win.
export default function TicTacToeBoard({ board, winLine, disabled, onPlay }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-xs mx-auto">
      {board.map((mark, i) => {
        const isWinning = winLine?.includes(i);
        return (
          <button
            key={i}
            type="button"
            disabled={disabled || mark != null}
            onClick={() => onPlay(i)}
            aria-label={`Katakcha ${i + 1}`}
            className={`aspect-square rounded-xl border text-4xl sm:text-5xl font-display font-extrabold flex items-center justify-center transition-colors ${
              isWinning
                ? "bg-accent/20 border-accent"
                : "bg-surface-2 border-border hover:border-text-faint"
            } ${!disabled && mark == null ? "active:scale-95" : ""}`}
          >
            {mark === "x" && <span className="text-accent">X</span>}
            {mark === "o" && <span className="text-amber">O</span>}
          </button>
        );
      })}
    </div>
  );
}
