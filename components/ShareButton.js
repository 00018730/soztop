"use client";

import { useState } from "react";

const IDLE_LABEL = "Natijani nusxalash";

// variant "primary" (accent) is for games where share is the main/only
// call to action on the result screen (the 4 daily games). "secondary"
// (surface-2) is for games that already have a stronger accent CTA next to
// it (2048's "Yana oʻynash", Krestik-nolik/Toʻrt ketma-ket's "Yangi oʻyin"),
// so share doesn't visually compete with it.
const VARIANTS = {
  primary: "bg-accent text-accent-ink font-extrabold",
  secondary: "bg-surface-2 text-text font-bold",
};

// Reusable clipboard-copy button for every game's end-of-round share text —
// extracted from ResultModal's original inline handleShare so every game
// gets the same copy/label-toggle behavior without duplicating it.
export default function ShareButton({ getText, className = "", variant = "primary" }) {
  const [label, setLabel] = useState(IDLE_LABEL);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(getText());
      setLabel("Nusxalandi ✓");
    } catch {
      setLabel("Nusxalab boʻlmadi");
    }
    setTimeout(() => setLabel(IDLE_LABEL), 1600);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`text-sm rounded-xl py-3 ${VARIANTS[variant] || VARIANTS.primary} ${className}`}
    >
      {label}
    </button>
  );
}
