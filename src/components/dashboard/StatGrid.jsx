import { memo } from "react";
import GlassCard from "../ui/GlassCard.jsx";
import { ACCENT } from "../../constants/theme.js";
import { useProgress } from "../../context/ProgressContext.jsx";
import styles from "./dashboard.module.css";

/** Kernkennzahlen als Kachel-Raster. */
const StatGrid = memo(function StatGrid() {
  const { stats } = useProgress();
  const items = [
    { icon: "✅", value: `${stats.doneCount}/${stats.total}`, label: "Tage",           tint: ACCENT.teal },
    { icon: "🃏", value: stats.knownTotal,                    label: "Karten gewusst", tint: ACCENT.violet },
    { icon: "🏆", value: stats.quizzesPerfect,                label: "Quiz perfekt",   tint: ACCENT.red },
    { icon: "⏱️", value: `${stats.focusTotal}′`,              label: "Fokus-Minuten",  tint: ACCENT.blue },
    { icon: "🔥", value: stats.streak,                        label: "Tage Streak",    tint: ACCENT.red },
    { icon: "⭐", value: stats.favCount,                      label: "Favoriten",      tint: ACCENT.violet },
  ];
  return (
    <div className={styles.statGrid}>
      {items.map((s) => (
        <GlassCard key={s.label} tint={s.tint} className={styles.stat}>
          <div className={styles.statIcon} aria-hidden="true">{s.icon}</div>
          <div className={styles.statValue}>{s.value}</div>
          <div className={styles.statLabel}>{s.label}</div>
        </GlassCard>
      ))}
    </div>
  );
});

export default StatGrid;
