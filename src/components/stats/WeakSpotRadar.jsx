import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import Disclosure from "../ui/Disclosure.jsx";
import Button from "../ui/Button.jsx";
import { useProgress } from "../../context/ProgressContext.jsx";
import { moduleWeakness } from "../../utils/insights.js";
import { ACCENT } from "../../constants/theme.js";
import styles from "./stats.module.css";

const TOP_N = 5;

/**
 * Weak-Spot Radar: die fünf größten Schwachstellen über alle Module,
 * abgeleitet aus Fehler-Kartei (45 %), Quiz-Bestwerten (35 %) und
 * Karten-/SRS-Stand (20 %).
 */
const WeakSpotRadar = memo(function WeakSpotRadar() {
  const { wrongPool, quizBest, srs, fcKnown } = useProgress();
  const navigate = useNavigate();

  const weakest = useMemo(
    () => moduleWeakness({ wrongPool, quizBest, srs, fcKnown }).slice(0, TOP_N),
    [wrongPool, quizBest, srs, fcKnown]
  );

  if (weakest.length === 0) return null;

  return (
    <Disclosure icon="🎯" title="Schwachstellen-Radar" meta={`Top ${weakest.length}`} defaultOpen>
      {weakest.map((w, i) => (
        <div key={w.modId} className={styles.weakRow}>
          <span className={styles.weakRank}>{i + 1}.</span>
          <div className={styles.weakBody}>
            <div className={styles.weakHead}>
              <span className={styles.weakName}>{w.module.code} · {w.module.name}</span>
              <span className={styles.weakPct}>{Math.round(w.score * 100)} %</span>
            </div>
            <div
              className={styles.weakTrack}
              role="img"
              aria-label={`${w.module.name}: Schwäche ${Math.round(w.score * 100)} %`}
            >
              <div className={styles.weakFill} style={{ width: `${Math.max(6, Math.round(w.score * 100))}%` }} />
            </div>
            <div className={styles.weakChips}>
              <span className={styles.weakChip}>Fehler {Math.round(w.parts.mistakes * 100)} %</span>
              <span className={styles.weakChip}>Quiz {Math.round(w.parts.quiz * 100)} %</span>
              <span className={styles.weakChip}>Karten {Math.round(w.parts.srs * 100)} %</span>
            </div>
          </div>
        </div>
      ))}
      <Button
        tint={ACCENT.violet}
        style={{ width: "100%", marginTop: "var(--s-2)" }}
        onClick={() => navigate("/plan", { state: { scrollTo: "smart-quiz", ts: Date.now() } })}
      >
        <Sparkles size={14} aria-hidden="true" /> Schwächen im Smart-Quiz üben
      </Button>
    </Disclosure>
  );
});

export default WeakSpotRadar;
