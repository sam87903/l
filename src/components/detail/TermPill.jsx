import { memo } from "react";
import { ChevronDown } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import { GLOSSARY } from "../../data/glossary.js";
import { cx } from "../../utils/misc.js";
import styles from "./detail.module.css";

/** Klickbarer Kernbegriff mit Inline-Definition aus dem Glossar. */
const TermPill = memo(function TermPill({ term, color, isOpen, onToggle }) {
  const definition = GLOSSARY[term];

  return (
    <div className={styles.termWrap} style={{ "--c": color }}>
      <button
        className={cx(styles.termBtn, isOpen && styles.termBtnOpen, "hover-pop")}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        {term}
        <span className={cx("anim-rotate", isOpen && "anim-rotateOpen")}>
          <ChevronDown size={11} aria-hidden="true" />
        </span>
      </button>
      {isOpen && definition && (
        <div className="anim-popIn">
          <GlassCard tint={color} className={styles.termPopup}>
            <div className={styles.termPopupTitle}>
              <span className={styles.subDot} aria-hidden="true" />
              {term}
            </div>
            <p className={styles.termPopupText}>{definition}</p>
          </GlassCard>
        </div>
      )}
    </div>
  );
});

export default TermPill;
