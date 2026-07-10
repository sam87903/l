import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Sparkles } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import { useProgress } from "../../context/ProgressContext.jsx";
import { moduleWeakness } from "../../utils/insights.js";
import { buildExamProfile } from "../../utils/examSimulator.js";
import { buildRecommendations } from "../../utils/recommend.js";
import { ACCENT } from "../../constants/theme.js";
import { cx, kb } from "../../utils/misc.js";
import styles from "./dashboard.module.css";

/**
 * „✨ Heute empfohlen": bis zu drei priorisierte Lernschritte, dynamisch
 * aus Fehler-Kartei, SRS, Modul-Schwächen, Klausur-Themen und Streak.
 */
const RecommendationCard = memo(function RecommendationCard() {
  const { stats, wrongPool, quizBest, srs, fcKnown, exams, activity } = useProgress();
  const navigate = useNavigate();

  const recommendations = useMemo(() => {
    const weakness = moduleWeakness({ wrongPool, quizBest, srs, fcKnown });
    const profile = buildExamProfile(exams);
    return buildRecommendations({
      stats,
      weakness,
      examFreq: profile.moduleWeights,
      topTerms: profile.topTerms,
      srs,
      activity,
    });
  }, [stats, wrongPool, quizBest, srs, fcKnown, exams, activity]);

  if (recommendations.length === 0) return null;

  const open = (rec) =>
    // ts erzwingt ein frisches location.state, damit Ziel-Effekte erneut feuern
    navigate(rec.action.to, { state: { ...rec.action.state, ts: Date.now() } });

  return (
    <GlassCard tint={ACCENT.violet} className={styles.recCard} style={{ "--c": ACCENT.violet }}>
      <div className={styles.recKicker}>
        <Sparkles size={14} aria-hidden="true" /> Heute empfohlen
      </div>
      {recommendations.map((rec) => (
        <div
          key={rec.id}
          className={cx(styles.recRow, rec.urgent && styles.recRowUrgent, "hover-pop")}
          onClick={() => open(rec)}
          {...kb(() => open(rec))}
          aria-label={rec.title}
        >
          <span className={styles.recIcon} aria-hidden="true">{rec.icon}</span>
          <span className={styles.recBody}>
            <span className={styles.recTitle}>{rec.title}</span>
            <span className={styles.recReason}>{rec.reason}</span>
          </span>
          <ChevronRight size={15} aria-hidden="true" className={styles.recGo} />
        </div>
      ))}
    </GlassCard>
  );
});

export default RecommendationCard;
