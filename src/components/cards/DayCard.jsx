import { memo } from "react";
import GlassCard from "../ui/GlassCard.jsx";
import Collapse from "../ui/Collapse.jsx";
import Pill from "../ui/Pill.jsx";
import { fmtDate, dayNum } from "../../utils/dates.js";
import { cx, kb } from "../../utils/misc.js";
import styles from "./cards.module.css";

/** Ein Tag im 21-Tage-Plan: aufklappbar, abhakbar, mit Aufgabe + Links. */
const DayCard = memo(function DayCard({ day, color, startDate, isOpen, isDone, isToday, onToggleOpen, onToggleDone }) {
  const date = fmtDate(startDate, day.nr - 1);

  return (
    <GlassCard
      tint={isDone || isOpen ? color : undefined}
      id={`day-${day.nr}`}
      className={cx(styles.day, isToday && styles.dayToday)}
      style={{ "--c": color }}
    >
      <div className={`${styles.head} hover-pop`} onClick={onToggleOpen} {...kb(onToggleOpen)} aria-expanded={isOpen}>
        <div className={styles.dayNum}>
          <div className={cx(styles.dayNumBig, isDone && styles.dayNumDone)}>{dayNum(day.nr)}</div>
          <div className={styles.dayDate}>{date || "Tag"}</div>
        </div>
        <div className={styles.dayDivider} />
        <div className={styles.dayBody}>
          <div className={cx(styles.dayTitle, isOpen && styles.dayTitleOpen, isDone && styles.dayTitleDone)}>
            {isToday && <span className={styles.todayBadge}>HEUTE</span>}
            {day.e} {day.t}
          </div>
          {!isOpen && <div className={styles.daySub}>{day.d}</div>}
        </div>
        <div
          className={cx(styles.check, isDone && styles.checkDone, "hover-pop")}
          onClick={(e) => { e.stopPropagation(); onToggleDone(); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onToggleDone(); }
          }}
          role="checkbox"
          aria-checked={isDone}
          aria-label={`Tag ${day.nr} als erledigt markieren`}
          tabIndex={0}
        >
          {isDone && "✓"}
        </div>
      </div>
      <Collapse open={isOpen}>
        <div className={styles.dayDetail}>
          <p className={styles.dayDesc}>{day.d}</p>
          <GlassCard className={styles.taskBox}>
            <div className={styles.boxKicker}>✏️ Aufgabe · 20 Min</div>
            <div className={styles.boxText}>{day.a}</div>
          </GlassCard>
          <div className={styles.linkKicker}>🔗 Links & Ressourcen</div>
          <div className={styles.pillRow}>
            {day.lk.map((link, i) => (
              <Pill key={i} label={link.l} href={link.u} color={color} />
            ))}
          </div>
        </div>
      </Collapse>
    </GlassCard>
  );
});

export default DayCard;
