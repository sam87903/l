import { memo } from "react";
import { SEMESTERS } from "../../data/semesters/index.js";
import { cx } from "../../utils/misc.js";
import styles from "./semester.module.css";

/* Gradient-Stil: alle Semester tragen denselben Verlauf – Blau–Türkis
   (Farben von Semester 4). Ziffer, Ring und aktiver Fill nutzen ihn. */
const SEM_GRADIENT = ["#5b7cfa", "#2dd4a8"];

/**
 * Horizontal scrollbare Segmented Control für Semester 1–7.
 * Filtert den Tab-Inhalt (HIG: Segmented Control ≠ Navigation);
 * Auswahl über Farbe UND Balken/Fettung (WCAG 1.4.1), Ziele ≥44px.
 */
const SemesterPager = memo(function SemesterPager({ selected, onSelect }) {
  return (
    <div className={styles.pager} role="group" aria-label="Semester auswählen">
      {SEMESTERS.map((sem) => {
        const active = selected === sem.nr;
        return (
          <button
            key={sem.nr}
            className={cx(styles.pagerBtn, active && styles.pagerBtnActive, "hover-pop")}
            style={{ "--c": SEM_GRADIENT[0], "--c1": SEM_GRADIENT[0], "--c2": SEM_GRADIENT[1] }}
            onClick={() => onSelect(sem.nr)}
            aria-pressed={active}
            aria-label={`Semester ${sem.nr}: ${sem.title}`}
          >
            <span className={styles.pagerNum}>{sem.nr}</span>
            <span className={styles.pagerLabel}>Sem.</span>
          </button>
        );
      })}
    </div>
  );
});

export default SemesterPager;
