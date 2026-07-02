/** Kleine Allzweck-Helfer. */

/** CSS-Klassen bedingt zusammensetzen. */
export const cx = (...parts) => parts.filter(Boolean).join(" ");

/** Fisher-Yates-Shuffle (liefert neues Array). */
export function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/** Tastatur-Props für klickbare Nicht-Button-Elemente (WCAG 2.1.1). */
export function kb(fn) {
  return {
    role: "button",
    tabIndex: 0,
    onKeyDown: (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fn();
      }
    },
  };
}
