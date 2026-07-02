import { memo } from "react";
import styles from "./glossary.module.css";

/** Alphabetische Sprungnavigation zu den Buchstaben-Gruppen. */
const AlphaNav = memo(function AlphaNav({ letters }) {
  const jump = (letter) =>
    document.getElementById(`glos-${letter}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className={styles.alphaNav} role="navigation" aria-label="Alphabetische Navigation">
      {letters.map((letter) => (
        <button key={letter} className={`${styles.alphaBtn} hover-pop`} onClick={() => jump(letter)}>
          {letter}
        </button>
      ))}
    </div>
  );
});

export default AlphaNav;
