import { DIGIT_LENGTHS } from "@/lib/codebreaker";

export default function DigitLengthSwitch({ digitLength, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-full p-1">
      {DIGIT_LENGTHS.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
            digitLength === n ? "bg-accent text-accent-ink" : "text-text-dim"
          }`}
        >
          {n} xonali
        </button>
      ))}
    </div>
  );
}
