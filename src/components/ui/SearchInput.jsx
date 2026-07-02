import { memo } from "react";
import { Search, X } from "lucide-react";
import GlassCard from "./GlassCard.jsx";
import styles from "./ui.module.css";

/** Suchfeld im Glass-Stil mit Lösch-Button. */
const SearchInput = memo(function SearchInput({ value, onChange, placeholder, label }) {
  return (
    <GlassCard className={styles.searchWrap}>
      <Search size={16} aria-hidden="true" style={{ opacity: 0.6, flexShrink: 0 }} />
      <input
        className={styles.searchInput}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
      />
      {value && (
        <button className={styles.searchClear} onClick={() => onChange("")} aria-label="Suche löschen">
          <X size={13} aria-hidden="true" />
        </button>
      )}
    </GlassCard>
  );
});

export default SearchInput;
