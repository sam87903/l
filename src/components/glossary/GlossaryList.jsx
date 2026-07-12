import { memo, useCallback, useEffect, useMemo, useState } from "react";
import GlossaryEntry from "./GlossaryEntry.jsx";
import AlphaNav from "./AlphaNav.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import { useIncrementalList } from "../../hooks/useIncrementalList.js";
import styles from "./glossary.module.css";

const groupLetter = (term) => {
  const ch = term[0].toUpperCase();
  return /[A-ZÄÖÜ]/.test(ch) ? ch : "#";
};

/** Gruppierte, inkrementell gerenderte Glossarliste mit Alpha-Navigation. */
const GlossaryList = memo(function GlossaryList({ terms, openTerms, favorites, onToggleOpen, onToggleFavorite, showAlphaNav }) {
  const { visible, sentinelRef, done, expandTo } = useIncrementalList(terms);
  // Sprungziel, dessen Buchstaben-Gruppe erst noch gerendert werden muss.
  const [pendingLetter, setPendingLetter] = useState(null);

  const groups = useMemo(() => {
    const map = new Map();
    for (const term of visible) {
      const letter = groupLetter(term);
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter).push(term);
    }
    return [...map.entries()];
  }, [visible]);

  const allLetters = useMemo(
    () => [...new Set(terms.map(groupLetter))],
    [terms]
  );

  // Alpha-Sprung: liegt der Buchstabe hinter dem bisher gerenderten Teil,
  // erst genug Einträge nachladen und nach dem Rendern springen.
  const jumpToLetter = useCallback(
    (letter) => {
      const el = document.getElementById(`glos-${letter}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const idx = terms.findIndex((t) => groupLetter(t) === letter);
      if (idx === -1) return;
      expandTo(idx + 1);
      setPendingLetter(letter);
    },
    [terms, expandTo]
  );

  useEffect(() => {
    if (!pendingLetter) return;
    const el = document.getElementById(`glos-${pendingLetter}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setPendingLetter(null);
    }
  }, [pendingLetter, visible]);

  if (terms.length === 0) {
    return <EmptyState icon="🤷">Kein Begriff gefunden – probiere einen anderen Suchbegriff.</EmptyState>;
  }

  return (
    <>
      {showAlphaNav && <AlphaNav letters={allLetters} onJump={jumpToLetter} />}
      {groups.map(([letter, groupTerms]) => (
        <section key={letter} aria-label={`Begriffe mit ${letter}`}>
          <div className={styles.groupHead} id={`glos-${letter}`}>
            <span className={styles.groupLetter}>{letter}</span>
            <span className={styles.groupLine} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
            {groupTerms.map((term) => (
              <GlossaryEntry
                key={term}
                term={term}
                isOpen={openTerms.has(term)}
                isFavorite={favorites.includes(term)}
                onToggleOpen={() => onToggleOpen(term)}
                onToggleFavorite={() => onToggleFavorite(term)}
              />
            ))}
          </div>
        </section>
      ))}
      {!done && <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />}
    </>
  );
});

export default GlossaryList;
