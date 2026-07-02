import { memo } from "react";
import { clamp } from "../../utils/misc.js";

/** SVG-Fortschrittsring (Dashboard-Hero). */
const ProgressRing = memo(function ProgressRing({
  value, max = 100, size = 96, stroke = 8, color = "var(--blue)", children,
}) {
  const pct = max > 0 ? clamp(value / max, 0, 1) : 0;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} role="img" aria-label={`Fortschritt ${Math.round(pct * 100)}%`}>
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.6s var(--ease)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
});

export default ProgressRing;
