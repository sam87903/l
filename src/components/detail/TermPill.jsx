import { memo } from "react";
import { motion } from "framer-motion";
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
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} style={{ display: "inline-flex" }}>
          <ChevronDown size={11} aria-hidden="true" />
        </motion.span>
      </button>
      {isOpen && definition && (
        <motion.div initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
          <GlassCard tint={color} className={styles.termPopup}>
            <div className={styles.termPopupTitle}>
              <span className={styles.subDot} aria-hidden="true" />
              {term}
            </div>
            <p className={styles.termPopupText}>{definition}</p>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
});

export default TermPill;
