import { memo } from "react";
import GlassCard from "../ui/GlassCard.jsx";
import { cx } from "../../utils/misc.js";
import styles from "./cards.module.css";

/** Wochen-Header im 21-Tage-Plan. */
const WeekBanner = memo(function WeekBanner({ week, color, doneCount, totalCount }) {
  return (
    <GlassCard tint={color} className={styles.week} style={{ "--c": color }}>
      <span className={cx(styles.weekChip, doneCount === totalCount && styles.weekChipDone)} aria-hidden="true">
        <span className={styles.weekEmoji}>{week.e}</span>
      </span>
      <div style={{ flex: 1 }}>
        <div className={styles.weekKicker}>Woche {week.nr}</div>
        <div className={styles.weekTitle}>{week.t}</div>
        <div className={styles.weekSub}>{week.sub}</div>
      </div>
      <span className={styles.weekBadge}>{doneCount}/{totalCount}</span>
    </GlassCard>
  );
});

export default WeekBanner;
