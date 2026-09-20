import { WORD_LENGTHS } from "@/lib/words";

export default function WordLengthControls({ wordLength, onLength, endless, onToggleEndless }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-full p-1">
        {WORD_LENGTHS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onLength(n)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              wordLength === n ? "bg-accent text-accent-ink" : "text-text-dim"
            }`}
          >
            {n} harfli
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onToggleEndless}
        className={`rounded-full px-3 py-1.5 text-xs font-bold border transition-colors ${
          endless
            ? "bg-accent text-accent-ink border-accent"
            : "bg-surface-2 text-text-dim border-border"
        }`}
      >
        ♾ Cheksiz oʻyin
      </button>
    </div>
  );
}
