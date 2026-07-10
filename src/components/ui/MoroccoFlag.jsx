/**
 * Marokkanische Flagge als SVG: rendert auf allen Plattformen identisch –
 * das Emoji 🇲🇦 zeigt z. B. Windows nur als „MA"-Buchstaben an.
 * Farben nach Flaggen-Standard: Rot C1272D, Grün 006233.
 */
export default function MoroccoFlag({ size = 20, className, style }) {
  return (
    <svg
      width={size}
      height={(size * 2) / 3}
      viewBox="0 0 36 24"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="36" height="24" rx="3" fill="#c1272d" />
      {/* Pentagramm: fünf Spitzen, jede zweite verbunden */}
      <path
        d="M18 4 L22.7 18.47 L10.39 9.53 L25.61 9.53 L13.3 18.47 Z"
        fill="none"
        stroke="#006233"
        strokeWidth="1.4"
      />
    </svg>
  );
}
