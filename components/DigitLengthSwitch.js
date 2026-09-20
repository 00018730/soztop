import { DIGIT_LENGTHS } from "@/lib/codebreaker";

export default function DigitLengthSwitch({ digitLength, onChange }) {
  return (
    <div className="flex gap-2">
      {DIGIT_LENGTHS.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`flex-1 rounded-xl border px-3 py-2 text-xs sm:text-sm font-bold transition-colors ${
            digitLength === n
              ? "bg-accent border-accent text-accent-ink"
              : "bg-surface border-border text-text-dim"
          }`}
        >
          {n} xonali kod
        </button>
      ))}
    </div>
  );
}
