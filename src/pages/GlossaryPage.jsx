import { useCallback, useMemo, useState } from "react";
import PageTransition from "../components/layout/PageTransition.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import GlossaryList from "../components/glossary/GlossaryList.jsx";
import FlashcardDeck from "../components/flashcards/FlashcardDeck.jsx";
import { GLOSSARY } from "../data/glossary.js";
import { ACCENT } from "../constants/theme.js";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";
import { useProgress } from "../context/ProgressContext.jsx";
import { cx } from "../utils/misc.js";
import glossaryStyles from "../components/glossary/glossary.module.css";
import styles from "./pages.module.css";

const ALL_TERMS = Object.keys(GLOSSARY).sort((a, b) => a.localeCompare(b, "de"));
const LEARN_DECK_ID = "glossar";
const LEARN_CARDS = ALL_TERMS.map((term) => ({ front: term, back: GLOSSARY[term] }));

const FILTERS = [
  { id: "all", label: "Alle" },
  { id: "favorites", label: "⭐ Favoriten" },
  { id: "recent", label: "🕘 Zuletzt" },
  { id: "learn", label: "🃏 Lernmodus" },
];

/** Glossar: Live-Suche, Filter, Favoriten, Lernmodus, Alpha-Navigation. */
export default function GlossaryPage() {
  const { favorites, toggleFavorite, recents, pushRecent, fcKnown, setKnownCard } = useProgress();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [openTerms, setOpenTerms] = useState(() => new Set());
  const debouncedQuery = useDebouncedValue(query.trim().toLowerCase());

  const filtered = useMemo(() => {
    let terms = ALL_TERMS;
    if (filter === "favorites") terms = terms.filter((t) => favorites.includes(t));
    if (filter === "recent") terms = recents.filter((t) => t in GLOSSARY);
    if (!debouncedQuery) return terms;
    return terms.filter(
      (t) => t.toLowerCase().includes(debouncedQuery) || GLOSSARY[t].toLowerCase().includes(debouncedQuery)
    );
  }, [filter, favorites, recents, debouncedQuery]);

  const toggleOpen = useCallback(
    (term) => {
      setOpenTerms((prev) => {
        const next = new Set(prev);
        if (next.has(term)) {
          next.delete(term);
        } else {
          next.add(term);
          pushRecent(term);
        }
        return next;
      });
    },
    [pushRecent]
  );

  return (
    <PageTransition>
      <GlassCard tint={ACCENT.violet} className={styles.banner} style={{ "--c": ACCENT.violet }}>
        <div className={styles.bannerGlow} aria-hidden="true" />
        <p className={styles.bannerKicker}>📖 Glossar</p>
        <h2 className={styles.bannerTitle}>{ALL_TERMS.length} Fachbegriffe von A bis Z</h2>
        <p className={styles.bannerText}>
          Alle Kernbegriffe aus BWL, Handel, E-Commerce und Informatik – durchsuchbar,
          mit Favoriten und eigenem Lernmodus.
        </p>
      </GlassCard>

      <SearchInput value={query} onChange={setQuery} placeholder="Begriff oder Definition suchen…" label="Glossar durchsuchen" />

      <div className={glossaryStyles.filters} role="group" aria-label="Glossar filtern">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={cx(glossaryStyles.filter, filter === f.id && glossaryStyles.filterActive, "hover-pop")}
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter === "learn" ? (
        <FlashcardDeck
          cards={LEARN_CARDS}
          color={ACCENT.violet}
          known={new Set(fcKnown[LEARN_DECK_ID] || [])}
          onKnown={(index, isKnown) => setKnownCard(LEARN_DECK_ID, index, isKnown)}
        />
      ) : (
        <>
          <p className={glossaryStyles.count} aria-live="polite">
            {filtered.length} von {ALL_TERMS.length} Begriffen
            {debouncedQuery ? ` für „${query.trim()}"` : ""}
          </p>
          <GlossaryList
            terms={filtered}
            openTerms={openTerms}
            favorites={favorites}
            onToggleOpen={toggleOpen}
            onToggleFavorite={toggleFavorite}
            showAlphaNav={filter === "all" && !debouncedQuery}
          />
        </>
      )}
    </PageTransition>
  );
}
