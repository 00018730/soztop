"use client";

import { useState } from "react";

const IDLE_LABEL = "Natijani nusxalash";

// Reusable clipboard-copy button for every game's end-of-round share text —
// extracted from ResultModal's original inline handleShare so every game
// gets the same copy/label-toggle behavior without duplicating it.
export default function ShareButton({ getText, className = "" }) {
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
      className={`bg-accent text-accent-ink font-extrabold text-sm rounded-xl py-3 ${className}`}
    >
      {label}
    </button>
  );
}
