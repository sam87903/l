import { memo, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Button from "../ui/Button.jsx";
import QuizQuestion from "./QuizQuestion.jsx";
import { SEMESTERS } from "../../data/semesters/index.js";
import { useProgress } from "../../context/ProgressContext.jsx";
import { ACCENT } from "../../constants/theme.js";
import { MASTERY_STREAK } from "../../constants/config.js";
import styles from "./quiz.module.css";

const MODULE_BY_ID = new Map(SEMESTERS.flatMap((s) => s.modules).map((m) => [m.id, m]));

/**
 * Fehler-Training: wiederholt alle jemals falsch beantworteten Quizfragen,
 * bis jede MASTERY_STREAK-mal in Folge richtig beantwortet wurde.
 */
const MistakeTrainer = memo(function MistakeTrainer() {
  const { wrongPool, recordAnswer, stats } = useProgress();
  const [picked, setPicked] = useState(undefined);

  // Härteste Fehler zuerst (meiste Fehlversuche), stabil sortiert.
  const queue = useMemo(
    () =>
      Object.entries(wrongPool)
        .map(([key, entry]) => {
          const module = MODULE_BY_ID.get(entry.modId);
          const question = module?.quiz?.[entry.qi];
          return question ? { key, ...entry, module, question } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.misses - a.misses || a.key.localeCompare(b.key)),
    [wrongPool]
  );

  const current = queue[0];
  const answered = picked !== undefined;

  const onPick = (oi) => {
    if (answered || !current) return;
    setPicked(oi);
    const correct = Array.isArray(current.question.corrects)
      ? current.question.corrects.includes(oi)
      : current.question.correct === oi;
    recordAnswer(current.modId, current.qi, correct);
  };

  return (
    <GlassCard tint={ACCENT.red} id="fehler-training"
      style={{ "--c": ACCENT.red, padding: "var(--s-4)", marginBottom: "var(--s-4)", scrollMarginTop: "100px" }}>
      <div className={styles.head}>
        <span className={styles.kicker} style={{ "--c": ACCENT.red, color: ACCENT.red }}>
          <span aria-hidden="true">🔁</span> Fehler-Training
        </span>
        <span className={styles.score}>
          {queue.length} offen · {stats.mastered} gemeistert
        </span>
      </div>

      {current ? (
        <>
          <div className={styles.trainerMeta}>
            <span>Modul: <strong>{current.module.code}</strong> {current.module.name}</span>
            <span>{current.misses}× falsch beantwortet</span>
            <span className={styles.trainerStreak}>
              Serie {current.streak ?? 0}/{MASTERY_STREAK} – {MASTERY_STREAK}× richtig = gemeistert
            </span>
          </div>
          <QuizQuestion index={0} question={current.question} picked={picked} onPick={onPick} />
          {answered && (
            <Button tint={ACCENT.red} style={{ width: "100%" }} onClick={() => setPicked(undefined)}>
              Weiter <ArrowRight size={14} aria-hidden="true" />
            </Button>
          )}
        </>
      ) : (
        <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--muted)", lineHeight: 1.6 }}>
          {stats.mastered > 0
            ? `Alle Fehler gemeistert – stark! 🎉 (${stats.mastered} Fragen dauerhaft gelernt)`
            : "Noch keine offenen Fehler. Falsch beantwortete Quizfragen landen automatisch hier und werden wiederholt, bis sie sitzen."}
        </p>
      )}
    </GlassCard>
  );
});

export default MistakeTrainer;
