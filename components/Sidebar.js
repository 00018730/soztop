import { NAV_ITEMS } from "@/components/navIcons";

export default function Sidebar({ view, onChange }) {
  return (
    <nav className="w-[230px] shrink-0 border-r border-border py-4 px-3 hidden md:flex flex-col gap-1">
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const active = view === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-left transition-colors ${
              active ? "bg-accent/15 text-accent" : "text-text-dim hover:text-text hover:bg-surface"
            }`}
          >
            <Icon />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
