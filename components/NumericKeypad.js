"use client";

const ROW1 = ["1", "2", "3", "4", "5"];
const ROW2 = ["6", "7", "8", "9", "0"];

function Key({ tok, label, wide, status, onPress }) {
  const base =
    "rounded-lg font-bold text-base sm:text-lg flex items-center justify-center select-none transition-transform active:scale-90";
  const styles = {
    correct: "bg-accent text-accent-ink",
    present: "bg-amber text-amber-ink",
    absent: "bg-absent text-absent-text",
  };
  const style = status ? styles[status] : "bg-surface-2 text-text";
  return (
    <button
      type="button"
      className={`${base} ${style} ${wide ? "flex-[1.7] px-1 text-[11px] sm:text-xs" : "flex-1"}`}
      style={{ height: "var(--key-h)" }}
      onClick={(e) => {
        onPress(tok);
        // Same ghost-click hardening as the letter keyboard.
        e.currentTarget.blur();
      }}
    >
      {label ?? tok}
    </button>
  );
}

export default function NumericKeypad({ keyStatus, onDigit, onEnter, onBackspace }) {
  return (
    <div
      className="w-full max-w-[440px] flex flex-col pb-[max(6px,env(safe-area-inset-bottom))]"
      style={{ gap: "var(--key-gap)" }}
    >
      <div className="flex justify-center" style={{ gap: "var(--key-gap)" }}>
        {ROW1.map((d) => (
          <Key key={d} tok={d} status={keyStatus[d]} onPress={onDigit} />
        ))}
      </div>
      <div className="flex justify-center" style={{ gap: "var(--key-gap)" }}>
        {ROW2.map((d) => (
          <Key key={d} tok={d} status={keyStatus[d]} onPress={onDigit} />
        ))}
      </div>
      <div className="flex justify-center" style={{ gap: "var(--key-gap)" }}>
        <Key tok="ENTER" label="KIRITISH" wide status={null} onPress={onEnter} />
        <Key tok="BACK" label="⌫" wide status={null} onPress={onBackspace} />
      </div>
    </div>
  );
}
