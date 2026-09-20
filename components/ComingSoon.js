export default function ComingSoon({ icon, title, note }) {
  return (
    <div className="p-4 sm:p-6 flex items-center justify-center h-full min-h-[50vh]">
      <div className="bg-surface border border-border rounded-2xl p-8 max-w-sm text-center">
        <span className="text-4xl block mb-3">{icon}</span>
        <h2 className="font-display font-bold text-lg mb-1">{title}</h2>
        <p className="text-sm text-text-dim leading-relaxed">{note ?? "Bu boʻlim tez orada ishga tushadi."}</p>
      </div>
    </div>
  );
}
