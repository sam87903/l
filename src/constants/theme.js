/** Marokko-Akzentfarben – themenunabhängig, gespiegelt in styles/tokens.css. */
export const ACCENT = {
  red: "#ff6b6b",
  teal: "#2dd4a8",
  violet: "#a78bfa",
  blue: "#5b7cfa",
  blueD: "#0e1c60",
};

/** Wochenfarben des 21-Tage-Plans (Index = Wochennummer 1–3). */
export const WEEK_COLORS = [null, ACCENT.red, ACCENT.teal, ACCENT.violet];

/** Farbzuordnung der Ressourcen-Icons (Detail-Ansicht). */
export const ICON_COLORS = {
  "📖": ACCENT.violet, "🧠": "#c026a8", "💬": ACCENT.teal, "📊": "#167a5e",
  "💻": ACCENT.blue, "🌐": "#1d6fa8", "🃏": ACCENT.red, "🎓": ACCENT.red,
  "📚": ACCENT.violet, "▶": ACCENT.blue,
};

export const iconColor = (icon) => ICON_COLORS[icon] || "#8a96b8";
