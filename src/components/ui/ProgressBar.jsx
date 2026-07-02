import { memo } from "react";
import { clamp } from "../../utils/misc.js";
import styles from "./ui.module.css";

/** Schlanker Fortschrittsbalken mit Verlaufsfüllung. */
const ProgressBar = memo(function ProgressBar({ value, max = 100, from, to, height = 6, label }) {
  const pct = max > 0 ? clamp(Math.round((value / max) * 100), 0, 100) : 0;
  return (
    <div
      className={styles.track}
      style={{ height }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={styles.fill} style={{ width: `${pct}%`, "--from": from, "--to": to }} />
    </div>
  );
});

export default ProgressBar;
