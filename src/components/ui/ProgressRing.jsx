import { memo } from "react";
import { clamp } from "../../utils/misc.js";

/**
 * SVG-Fortschrittsring mit korrekter Progressbar-Semantik
 * (role="progressbar" + aria-valuetext, z.B. "14 von 21 Tagen").
 */
const ProgressRing = memo(function ProgressRing({
  value, max = 100, size = 96, stroke = 8, color = "var(--blue)", valueText, children,
}) {
  const pct = max > 0 ? clamp(value / max, 0, 1) : 0;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pctRounded = Math.round(pct * 100);

  return (
    <div
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuetext={valueText ?? `${pctRounded}%`}
    >
      <svg width={size} height={size} aria-hidden="true" focusable="false">
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="color-mix(in srgb, var(--text) 14%, transparent)" strokeWidth={stroke}
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
