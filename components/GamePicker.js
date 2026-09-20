const GAMES = [
  {
    id: "word",
    icon: "🍃",
    title: "Soʻztop",
    subtitle: "Yashirin oʻzbekcha soʻzni 6 ta urinishda toping.",
  },
  {
    id: "codebreaker",
    icon: "🔐",
    title: "Kod buzuvchi",
    subtitle: "Maxfiy raqamli kodni topib, kod buzuvchiga aylaning.",
  },
];

export default function GamePicker({ activeGame, onSelect }) {
  return (
    <div className="p-4 sm:p-6">
      <h2 className="font-display font-bold text-lg mb-1">Oʻyinlar</h2>
      <p className="text-sm text-text-dim mb-5">Oʻynamoqchi boʻlgan oʻyinni tanlang.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {GAMES.map((g) => {
          const active = activeGame === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onSelect(g.id)}
              className={`text-left rounded-2xl border p-5 transition-colors ${
                active
                  ? "bg-accent/10 border-accent"
                  : "bg-surface border-border hover:border-text-faint"
              }`}
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent to-accent-strong flex items-center justify-center text-accent-ink text-xl mb-4 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.18)]">
                {g.icon}
              </div>
              <h3 className="font-display font-bold text-base mb-1">{g.title}</h3>
              <p className="text-sm text-text-dim leading-snug">{g.subtitle}</p>
              {active && (
                <span className="inline-block mt-3 text-xs font-bold text-accent">Hozir oʻynalmoqda</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
