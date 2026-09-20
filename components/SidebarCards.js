export function InstructionsCard() {
  const steps = [
    "5 harfli soʻzni taxmin qiling.",
    "Harf rangi sizga javob beradi.",
    "Toʻgʻri soʻzni toping!",
  ];
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">💡</span>
        <h2 className="font-display font-bold text-base">Qanday oʻynaladi?</h2>
      </div>
      <ol className="flex flex-col gap-3">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex-none w-5 h-5 rounded-full bg-surface-2 border border-border text-[11px] font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span className="text-sm text-text-dim leading-snug">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function QuoteCard() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <p className="text-sm text-text-dim italic leading-relaxed">
        Aqllingni sinab koʻr,
        <br />
        soʻz dunyosining ustasi boʻl!
      </p>
      <span className="text-lg block mt-3">🌱</span>
    </div>
  );
}

export function DailyImageCard() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-border min-h-[220px] flex items-end bg-surface-2"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(10,15,28,0.15) 0%, rgba(10,15,28,0.85) 100%), url(/city.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="p-5 text-center w-full">
        <p className="text-text text-sm leading-relaxed">
          Yaxshi soʻzlar
          <br />
          har doim topiladi
        </p>
        <div className="w-8 h-px bg-text-faint mx-auto mt-3" />
      </div>
    </div>
  );
}
