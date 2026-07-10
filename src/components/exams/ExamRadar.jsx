import { memo, useMemo } from "react";
import GlassCard from "../ui/GlassCard.jsx";
import TopicRow from "./TopicRow.jsx";
import { aggregateExams } from "../../utils/examAnalysis.js";
import { insightFor, INSIGHTS_LABEL } from "../../data/communityInsights.js";
import { useOpenTopic } from "./useOpenTopic.js";
import { ACCENT } from "../../constants/theme.js";
import styles from "./exams.module.css";

/**
 * Gesamt-Prüfungsradar: fasst die wahrscheinlichsten Themen über ALLE
 * gespeicherten Klausuren zusammen. Erscheint erst ab zwei Klausuren, wo der
 * Vergleich echten Mehrwert bringt. Jedes Thema führt direkt ins Lernen.
 */
const ExamRadar = memo(function ExamRadar({ exams }) {
  const openTopic = useOpenTopic();
  const data = useMemo(() => aggregateExams(exams), [exams]);

  if (data.total < 2 || data.terms.length === 0) return null;
  const shown = data.terms.slice(0, 8);

  return (
    <GlassCard tint={ACCENT.orange} className={styles.radar} style={{ "--c": ACCENT.orange }}>
      <div className={styles.radarHead}>
        <span className={styles.radarTitle}>🎯 Prüfungsradar</span>
        <span className={styles.radarSub}>über {data.total} Klausuren</span>
      </div>
      <p className={styles.radarLead}>
        Die wahrscheinlichsten Themen über alle deine Klausuren – tippe ein Thema, um es zu lernen.
      </p>
      <div className={styles.topList}>
        {shown.map((t) => (
          <TopicRow
            key={t.term}
            rank={t.rank}
            term={t.term}
            probability={t.probability}
            color={ACCENT.orange}
            meta={
              t.inExams > 1
                ? `in ${t.inExams} von ${t.total} Klausuren`
                : `in 1 Klausur · ${t.mentions}× erwähnt`
            }
            insight={insightFor(t.term)}
            onClick={() => openTopic(t)}
          />
        ))}
      </div>
      {shown.some((t) => insightFor(t.term) != null) && (
        <p className={styles.insightNote}>📊 Community-Werte: {INSIGHTS_LABEL}.</p>
      )}
    </GlassCard>
  );
});

export default ExamRadar;
