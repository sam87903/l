import { useState } from "react";

/**
 * Animiertes Auf-/Zuklappen ohne Per-Frame-JavaScript: native CSS-Transition
 * von grid-template-rows (0fr → 1fr). Deutlich flüssiger als eine
 * Höhen-Animation per JS, besonders auf Mobilgeräten. Der Inhalt wird erst
 * beim Öffnen gemountet und nach dem Zuklappen wieder entfernt.
 */
export default function Collapse({ open, children }) {
  const [mounted, setMounted] = useState(open);
  // Beim Öffnen sofort mounten (erlaubtes Render-Phase-Update, s. React-Docs).
  if (open && !mounted) setMounted(true);

  const onTransitionEnd = (e) => {
    // Nur auf die eigene Rows-Transition reagieren (nicht auf Kinder).
    if (e.target === e.currentTarget && e.propertyName === "grid-template-rows" && !open) {
      setMounted(false);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: "grid-template-rows var(--dur) var(--ease)",
      }}
      onTransitionEnd={onTransitionEnd}
      aria-hidden={!open}
    >
      <div
        style={{
          overflow: "hidden",
          minHeight: 0,
          opacity: open ? 1 : 0,
          transition: "opacity var(--dur) var(--ease)",
        }}
      >
        {mounted ? children : null}
      </div>
    </div>
  );
}
