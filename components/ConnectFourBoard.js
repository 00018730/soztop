import { COLS, ROWS } from "@/lib/connectFour";

// Shared 6x7 board, reused by every mode (vs computer, two players local,
// and online). `board` is a 2D ROWS x COLS array of "x" | "o" | null.
// Each column is one big click target — Connect Four discs drop, they
// don't get placed on an exact cell. `winLine` (an array of [row, col]
// pairs) is highlighted when the game just ended on a win.
export default function ConnectFourBoard({ board, winLine, disabled, onPlay }) {
  const winSet = new Set((winLine || []).map(([r, c]) => `${r}-${c}`));
  const columns = Array.from({ length: COLS }, (_, c) => c);
  const fullCols = new Set(columns.filter((c) => board[0][c] != null));

  return (
    <div className="bg-accent/10 border border-border rounded-2xl p-2 sm:p-3 w-full max-w-sm mx-auto">
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {columns.map((c) => {
          const colDisabled = disabled || fullCols.has(c);
          return (
            <button
              key={c}
              type="button"
              disabled={colDisabled}
              onClick={() => onPlay(c)}
              aria-label={`${c + 1}-ustun`}
              className={`flex flex-col gap-1.5 sm:gap-2 rounded-lg p-0.5 transition-colors ${
                colDisabled ? "" : "active:bg-accent/15"
              }`}
            >
              {Array.from({ length: ROWS }, (_, r) => {
                const mark = board[r][c];
                const isWinning = winSet.has(`${r}-${c}`);
                return (
                  <div
                    key={r}
                    className={`aspect-square rounded-full border ${
                      isWinning
                        ? "border-accent"
                        : mark
                          ? "border-transparent"
                          : "border-border bg-surface-2"
                    } ${mark === "x" ? "bg-accent" : ""} ${mark === "o" ? "bg-amber" : ""} ${
                      isWinning ? "ring-2 ring-accent" : ""
                    }`}
                  />
                );
              })}
            </button>
          );
        })}
      </div>
    </div>
  );
}
