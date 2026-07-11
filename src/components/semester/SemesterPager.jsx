import { memo } from "react";
import { SEMESTERS } from "../../data/semesters/index.js";
import { cx } from "../../utils/misc.js";
import styles from "./semester.module.css";

/* Gradient-Stil: jedes Semester bekommt einen zweifarbigen Verlauf –
   Ziffer und Oberkanten-Streifen tragen ihn, der aktive Knopf füllt
   sich damit. */
const SEM_GRADIENTS = [
  ["#ff6b6b", "#f0a24b"], // 1 · Sonnenuntergang
  ["#2dd4a8", "#4cc3f7"], // 2 · Lagune
  ["#a78bfa", "#ec6bae"], // 3 · Violett–Pink
  ["#5b7cfa", "#2dd4a8"], // 4 · Blau–Türkis
  ["#f0a24b", "#ec6bae"], // 5 · Gold–Pink
  ["#ec6bae", "#a78bfa"], // 6 · Pink–Violett
  ["#4cc3f7", "#5b7cfa"], // 7 · Himmel–Blau
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
            style={(([c1, c2]) => ({ "--c": c1, "--c1": c1, "--c2": c2 }))(SEM_GRADIENTS[(sem.nr - 1) % SEM_GRADIENTS.length])}
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
