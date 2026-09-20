export default function GameCardHeader({ icon, title, subtitle, onHelp, onRestart, children }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent to-accent-strong flex items-center justify-center text-accent-ink text-xl shadow-[inset_0_0_0_2px_rgba(255,255,255,0.18)]">
          {icon}
        </div>
        <div>
          <h2 className="font-display font-extrabold text-base leading-none">{title}</h2>
          <p className="text-xs text-text-dim mt-1">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {children}
        <button
          type="button"
          onClick={onRestart}
          aria-label="Qayta boshlash"
          title="Qayta boshlash"
          className="w-9 h-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-text-dim hover:text-text transition-colors"
        >
          ↻
        </button>
        <button
          type="button"
          onClick={onHelp}
          aria-label="Qoidalar"
          title="Qoidalar"
          className="w-9 h-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center font-bold text-text-dim hover:text-text transition-colors"
        >
          ?
        </button>
      </div>
    </div>
  );
}
