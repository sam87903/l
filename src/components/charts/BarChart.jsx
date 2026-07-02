import { memo, useMemo } from "react";
import { useProgress } from "../../context/ProgressContext.jsx";
import { lastDaysSeries } from "../../utils/xp.js";
import styles from "./charts.module.css";

/** Fokus-Minuten der letzten 7 Tage als Balkendiagramm. */
const BarChart = memo(function BarChart({ days = 7 }) {
  const { activity } = useProgress();
  const series = useMemo(() => lastDaysSeries(activity, days), [activity, days]);
  const max = Math.max(20, ...series.map((s) => s.minutes));

  return (
    <div className={styles.bars} role="img" aria-label="Lernminuten der letzten 7 Tage">
      {series.map((s) => (
        <div key={s.iso} className={styles.barCol} title={`${s.iso}: ${s.minutes} Min`}>
          {s.minutes > 0 && <span className={styles.barValue}>{s.minutes}</span>}
          <div className={styles.bar} style={{ height: `${Math.round((s.minutes / max) * 82)}%` }} />
          <span className={styles.barLabel}>{s.label}</span>
        </div>
      ))}
    </div>
  );
});

export default BarChart;
