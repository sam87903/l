import { memo } from "react";
import GlassCard from "../ui/GlassCard.jsx";
import { ACHIEVEMENTS } from "../../constants/achievements.js";
import { ACCENT } from "../../constants/theme.js";
import { useProgress } from "../../context/ProgressContext.jsx";
import { cx } from "../../utils/misc.js";
import styles from "./dashboard.module.css";

/**
 * Erfolge als horizontale Reihe (Dashboard) oder Raster (Statistik).
 * Freigeschaltete Badges zuerst.
 */
const AchievementsRow = memo(function AchievementsRow({ grid = false }) {
  const { stats } = useProgress();
  const sorted = [...ACHIEVEMENTS].sort((a, b) => Number(b.test(stats)) - Number(a.test(stats)));

  return (
    <div className={grid ? styles.quickGrid : styles.badgeRow}>
      {sorted.map((a) => {
        const unlocked = a.test(stats);
        return (
          <GlassCard
            key={a.id}
            tint={unlocked ? ACCENT.teal : undefined}
            className={cx(styles.badge, !unlocked && styles.badgeLocked)}
            title={unlocked ? "Freigeschaltet!" : "Noch gesperrt"}
          >
            <div className={styles.badgeIcon} aria-hidden="true">{a.icon}</div>
            <div className={styles.badgeTitle}>{a.title}</div>
            <div className={styles.badgeDesc}>{a.desc}</div>
          </GlassCard>
        );
      })}
    </div>
  );
});

export default AchievementsRow;
