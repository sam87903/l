import { memo, useMemo } from "react";
import { ChevronRight } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import { useOpenTopic } from "../exams/useOpenTopic.js";
import { bridgeTerms } from "../../utils/insights.js";
import { ACCENT } from "../../constants/theme.js";
import { kb } from "../../utils/misc.js";
import styles from "./semester.module.css";

/**
 * Cross-Modul-Wissensgraph: „Brücken-Themen", die in mehreren Modulen
 * auftauchen (z. B. Netzeffekte) – wer sie sicher kann, versteht gleich
 * mehrere Module besser. Klick öffnet Definition bzw. Modul-Quiz.
 */
const BridgeTopics = memo(function BridgeTopics() {
  const openTopic = useOpenTopic();
  const bridges = useMemo(() => bridgeTerms(12), []);

  if (bridges.length === 0) return null;

  return (
    <GlassCard tint={ACCENT.violet} className={styles.chainsCard} style={{ "--c": ACCENT.violet }}>
      <div className={styles.chainsKicker} style={{ color: ACCENT.violet }}>
        🌉 Brücken-Themen · verbinden mehrere Module
      </div>
      <p className={styles.chainsLead}>
        Diese Begriffe tauchen in mehreren Modulen auf – ein Thema lernen,
        mehrfach profitieren.
      </p>
      {bridges.map((b) => {
        const open = () => openTopic({ term: b.term, inGlossary: b.inGlossary, module: b.modules[0] });
        return (
          <div key={b.term} className={`${styles.bridgeRow} hover-pop`} onClick={open} {...kb(open)}>
            <span className={styles.bridgeTerm}>{b.term}</span>
            <span className={styles.bridgeMods}>
              {b.modules.map((m) => (
                <span key={m.id} className={styles.bridgeChip}>{m.code}</span>
              ))}
            </span>
            <ChevronRight size={14} aria-hidden="true" className={styles.bridgeGo} />
          </div>
        );
      })}
    </GlassCard>
  );
});

export default BridgeTopics;
