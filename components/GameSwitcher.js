export default function GameSwitcher({ game, onChange }) {
  return (
    <div className="flex gap-2 bg-surface border border-border rounded-full p-1">
      <button
        type="button"
        onClick={() => onChange("word")}
        className={`flex-1 rounded-full px-3 py-2 text-xs sm:text-sm font-bold transition-colors ${
          game === "word" ? "bg-accent text-accent-ink" : "text-text-dim"
        }`}
      >
        Soʻztop
      </button>
      <button
        type="button"
        onClick={() => onChange("codebreaker")}
        className={`flex-1 rounded-full px-3 py-2 text-xs sm:text-sm font-bold transition-colors ${
          game === "codebreaker" ? "bg-accent text-accent-ink" : "text-text-dim"
        }`}
      >
        Kod buzuvchi
      </button>
    </div>
  );
}
