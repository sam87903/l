import { memo } from "react";
import { SEMESTERS } from "../../data/semesters/index.js";
import { ACCENT } from "../../constants/theme.js";
import { cx } from "../../utils/misc.js";
import styles from "./semester.module.css";

/* Jedes Semester hat seinen eigenen Akzentton – macht die Reihe lebendig
   und gibt jedem Semester eine wiedererkennbare Farbe. */
const SEM_COLORS = [
  ACCENT.red, ACCENT.teal, ACCENT.violet, ACCENT.blue,
  ACCENT.orange, "#ec6bae", "#4cc3f7",
];

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
            style={{ "--c": SEM_COLORS[(sem.nr - 1) % SEM_COLORS.length] }}
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
