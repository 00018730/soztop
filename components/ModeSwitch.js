export default function ModeSwitch({ mode, onDaily, onPractice }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onDaily}
        className={`flex-1 rounded-xl border px-3 py-2 text-xs sm:text-sm font-bold transition-colors ${
          mode === "daily"
            ? "bg-accent border-accent text-accent-ink"
            : "bg-surface border-border text-text-dim"
        }`}
      >
        Kunlik soʻz
      </button>
      <button
        type="button"
        onClick={onPractice}
        className={`flex-1 rounded-xl border px-3 py-2 text-xs sm:text-sm font-bold transition-colors ${
          mode === "practice"
            ? "bg-accent border-accent text-accent-ink"
            : "bg-surface border-border text-text-dim"
        }`}
      >
        Mashq (tasodifiy)
      </button>
    </div>
  );
}
