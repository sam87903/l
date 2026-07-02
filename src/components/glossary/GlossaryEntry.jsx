import { memo } from "react";
import { ChevronDown, ChevronUp, Star } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Collapse from "../ui/Collapse.jsx";
import { GLOSSARY } from "../../data/glossary.js";
import { ACCENT } from "../../constants/theme.js";
import { cx, kb } from "../../utils/misc.js";
import styles from "./glossary.module.css";

/** Ein Glossar-Eintrag: aufklappbare Definition + Favoriten-Stern. */
const GlossaryEntry = memo(function GlossaryEntry({ term, isOpen, isFavorite, onToggleOpen, onToggleFavorite }) {
  return (
    <GlassCard tint={isOpen ? ACCENT.violet : undefined} style={{ borderRadius: "var(--r-sm)" }}>
      <div
        className={`${styles.entryRow} hover-pop`}
        onClick={onToggleOpen}
        {...kb(onToggleOpen)}
        aria-expanded={isOpen}
      >
        <span className={cx(isOpen && styles.entryOpen)} style={{ flex: 1 }}>{term}</span>
        <button
          className={cx(styles.starBtn, isFavorite && styles.starActive, "hover-pop")}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          aria-label={isFavorite ? `${term} aus Favoriten entfernen` : `${term} zu Favoriten hinzufügen`}
          aria-pressed={isFavorite}
        >
          <Star size={15} fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" />
        </button>
        {isOpen ? <ChevronUp size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}
      </div>
      <Collapse open={isOpen}>
        <div className={styles.entryDef}>
          <p className={styles.entryDefText}>{GLOSSARY[term]}</p>
        </div>
      </Collapse>
    </GlassCard>
  );
});

export default GlossaryEntry;
