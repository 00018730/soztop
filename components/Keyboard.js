"use client";

import { tokenLabel } from "@/lib/words";

const ROW1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
const ROW2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];
const ROW3 = ["z", "x", "c", "v", "b", "n", "m"];
const EXTRA = ["oʻ", "gʻ"];

function Key({ tok, label, wide, status, onPress }) {
  const base =
    "rounded-lg font-bold text-[12px] sm:text-sm flex items-center justify-center select-none transition-transform active:scale-90";
  const styles = {
    correct: "bg-accent text-accent-ink",
    present: "bg-amber text-amber-ink",
    absent: "bg-absent text-absent-text",
  };
  const style = status ? styles[status] : "bg-surface-2 text-text";
  return (
    <button
      type="button"
      className={`${base} ${style} ${wide ? "flex-[1.7] px-1 text-[10px] sm:text-xs" : "flex-1"}`}
      style={{ height: "var(--key-h)" }}
      onClick={(e) => {
        onPress(tok);
        // Don't leave focus sitting on this button — otherwise a later
        // physical Enter/Space press could re-trigger it as a "ghost click"
        // on top of our own keydown handling.
        e.currentTarget.blur();
      }}
    >
      {label ?? tokenLabel(tok)}
    </button>
  );
}

export default function Keyboard({ keyStatus, onChar, onEnter, onBackspace }) {
  return (
    <div
      className="w-full max-w-[440px] flex flex-col pb-[max(6px,env(safe-area-inset-bottom))]"
      style={{ gap: "var(--key-gap)" }}
    >
      <div className="flex justify-center" style={{ gap: "var(--key-gap)" }}>
        {ROW1.map((k) => (
          <Key key={k} tok={k} status={keyStatus[k]} onPress={onChar} />
        ))}
      </div>
      <div className="flex justify-center px-3" style={{ gap: "var(--key-gap)" }}>
        {ROW2.map((k) => (
          <Key key={k} tok={k} status={keyStatus[k]} onPress={onChar} />
        ))}
      </div>
      <div className="flex justify-center" style={{ gap: "var(--key-gap)" }}>
        <Key tok="ENTER" label="KIRITISH" wide status={null} onPress={onEnter} />
        {ROW3.map((k) => (
          <Key key={k} tok={k} status={keyStatus[k]} onPress={onChar} />
        ))}
        <Key tok="BACK" label="⌫" wide status={null} onPress={onBackspace} />
      </div>
      <div className="flex justify-center" style={{ gap: "var(--key-gap)" }}>
        {EXTRA.map((k) => (
          <Key key={k} tok={k} wide status={keyStatus[k]} onPress={onChar} />
        ))}
      </div>
    </div>
  );
}
