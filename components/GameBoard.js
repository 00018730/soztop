"use client";

import { MAX_GUESSES, WORD_LENGTH, tokenLabel } from "@/lib/words";

function Tile({ tok, status, filled }) {
  const base =
    "rounded-lg border-2 flex items-center justify-center font-extrabold uppercase select-none transition-colors";
  let style = "bg-surface border-border-soft text-text";
  if (filled && !status) style = "bg-surface border-text-faint text-text";
  if (status === "correct") style = "bg-accent border-accent text-accent-ink";
  if (status === "present") style = "bg-amber border-amber text-amber-ink";
  if (status === "absent") style = "bg-absent border-absent text-absent-text";
  return (
    <div
      className={`${base} ${style}`}
      style={{ width: "var(--tile)", height: "var(--tile)", fontSize: "calc(var(--tile) * 0.34)" }}
    >
      {tok ? tokenLabel(tok) : ""}
    </div>
  );
}

export default function GameBoard({
  guesses,
  current,
  shakeRow,
  length = WORD_LENGTH,
  maxGuesses = MAX_GUESSES,
}) {
  const rows = [];
  for (let r = 0; r < maxGuesses; r++) {
    let tokens = [];
    let result = null;
    if (r < guesses.length) {
      tokens = guesses[r].tokens;
      result = guesses[r].result;
    } else if (r === guesses.length) {
      tokens = current;
    }
    rows.push(
      <div
        key={r}
        className={`flex justify-center ${shakeRow === r ? "row-shake" : ""}`}
        style={{ gap: "var(--tile-gap)" }}
      >
        {Array.from({ length }).map((_, c) => (
          <Tile
            key={c}
            tok={tokens[c]}
            status={result ? result[c] : null}
            filled={!!tokens[c]}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col" style={{ gap: "var(--tile-gap)" }}>
      {rows}
    </div>
  );
}
