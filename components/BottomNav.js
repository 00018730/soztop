import { NAV_ITEMS } from "@/components/navIcons";

export default function BottomNav({ view, onChange }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-20 flex items-stretch justify-around bg-surface border-t border-border pb-[env(safe-area-inset-bottom)]"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const active = view === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold transition-colors ${
              active ? "text-accent" : "text-text-dim"
            }`}
          >
            <Icon />
            <span className="leading-none">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
