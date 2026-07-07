import { memo } from "react";
import { ChevronRight } from "lucide-react";
import styles from "./exams.module.css";

/**
 * Eine Themenzeile (Top-Thema / Radar-Eintrag): Rang, ausgeschriebener
 * Begriff mit Prüfungswahrscheinlichkeit, Balken und optionaler Meta-Zeile.
 * Ist `onClick` gesetzt, wird die Zeile zu einem Button, der ins gezielte
 * Lernen führt (Glossar-Definition bzw. Quiz).
 */
const TopicRow = memo(function TopicRow({ rank, term, probability, meta, onClick, color = "var(--teal)", actionHint }) {
  const interactive = typeof onClick === "function";
  const Tag = interactive ? "button" : "div";
  return (
    <Tag
      className={interactive ? `${styles.topItem} hover-pop` : styles.topItem}
      style={{ "--c": color }}
      onClick={onClick}
      title={interactive ? actionHint ?? `„${term}" lernen` : undefined}
      aria-label={interactive ? `${term} lernen – ${probability}% Prüfungswahrscheinlichkeit` : undefined}
    >
      <span className={styles.topItemRank}>{rank}</span>
      <span className={styles.topItemMain}>
        <span className={styles.topItemHead}>
          <span className={styles.topItemTerm}>{term}</span>
          <span className={styles.topItemPct}>{probability}%</span>
        </span>
        <span
          className={styles.barTrack}
          role="progressbar"
          aria-valuenow={probability}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${term}: ${probability}% relative Prüfungswahrscheinlichkeit`}
        >
          <span className={styles.barFill} style={{ width: `${probability}%` }} />
        </span>
        {meta && <span className={styles.topItemMeta}>{meta}</span>}
      </span>
      {interactive && <ChevronRight size={16} className={styles.topItemGo} aria-hidden="true" />}
    </Tag>
  );
});

export default TopicRow;
