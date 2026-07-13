import { memo, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowRight, ChevronDown, ChevronUp, FastForward } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Collapse from "../ui/Collapse.jsx";
import Button from "../ui/Button.jsx";
import QuizQuestion from "./QuizQuestion.jsx";
import { SEMESTERS } from "../../data/semesters/index.js";
import { GENERAL_QUIZ_BY_ID } from "../../data/generalQuiz.js";
import { EXTENDED_QUIZ, baseQuizId } from "../../data/extendedQuiz.js";
import { useProgress } from "../../context/ProgressContext.jsx";
import { ACCENT } from "../../constants/theme.js";
import { MISTAKE_MAX_BOX } from "../../constants/config.js";
import { mistakeBox, reviewMistake, splitMistakes } from "../../utils/mistakes.js";
import { daysUntil } from "../../utils/dates.js";
import { cx, kb } from "../../utils/misc.js";
import styles from "./quiz.module.css";

const MODULE_BY_ID = new Map(SEMESTERS.flatMap((s) => s.modules).map((m) => [m.id, m]));

const inDays = (iso) => {
  const n = daysUntil(iso);
  return n == null || n <= 0 ? "heute" : n === 1 ? "morgen" : `in ${n} Tagen`;
};

/** Fragen-Payload + Quellen-Label zu einem Kartei-Eintrag auflösen. */
function resolveEntry(entry) {
  const extBase = baseQuizId(entry.modId);
  const module = MODULE_BY_ID.get(extBase ?? entry.modId);
  const general = GENERAL_QUIZ_BY_ID.get(entry.modId);
  // Statische Fragen aus Modul-/Erweitert-/Bonus-Satz, generierte aus dem Payload.
  const question =
    entry.question ??
    (extBase ? EXTENDED_QUIZ[extBase]?.[entry.qi] : module?.quiz?.[entry.qi]) ??
    general?.quiz?.[entry.qi];
  if (!question) return null;
  const sourceLabel = module
    ? `${module.code} · ${module.name}${extBase ? " · Erweitert" : ""}`
    : general
      ? `${general.icon} ${general.name}`
      : `Smart-Quiz${entry.question?.topic ? ` · ${entry.question.topic}` : ""}`;
  return { ...entry, question, sourceLabel };
}

/**
 * Fehler-Training (Leitner): falsch beantwortete Quizfragen wandern durch
 * 3 Boxen (sofort / +1 Tag / +3 Tage). Wer die oberste Stufe richtig
 * beantwortet, hat die Frage gemeistert; ein Fehler wirft zurück auf Box 1.
 */
const MistakeTrainer = memo(function MistakeTrainer() {
  const { wrongPool, recordAnswer, stats } = useProgress();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(undefined);
  // Beantwortete Frage bis „Weiter" festhalten, auch wenn sie die Kartei verlässt.
  const [frozen, setFrozen] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [ahead, setAhead] = useState(false);
  const toggle = () => setOpen((v) => !v);
  const location = useLocation();

  // Über „Fehler üben" (Lernanalyse) angesteuert: Training automatisch öffnen.
  useEffect(() => {
    if (location.state?.openTrainer) setOpen(true);
  }, [location.state]);

  const { due, waiting } = useMemo(() => {
    const split = splitMistakes(wrongPool);
    return {
      due: split.due.map(resolveEntry).filter(Boolean),
      waiting: split.waiting.map(resolveEntry).filter(Boolean),
    };
  }, [wrongPool]);

  const queue = due.length > 0 ? due : ahead ? waiting : [];
  const isAheadRun = due.length === 0 && ahead;
  const current = frozen ?? queue[0];
  const answered = picked !== undefined;

  const onPick = (oi) => {
    if (answered || !current) return;
    setPicked(oi);
    setFrozen(current);
    const correct = Array.isArray(current.question.corrects)
      ? current.question.corrects.includes(oi)
      : current.question.correct === oi;
    const result = reviewMistake(current, correct);
    setFeedback(
      result.mastered
        ? { icon: "🎉", text: `Gemeistert – Stufe ${MISTAKE_MAX_BOX} bestanden!`, good: true }
        : correct
          ? { icon: "✅", text: `Hoch auf Stufe ${result.box} – Wiederholung ${inDays(result.due)}.`, good: true }
          : { icon: "↩️", text: "Zurück auf Stufe 1 – gleich noch einmal dran.", good: false }
    );
    recordAnswer(current.modId, current.qi, correct);
  };

  const next = () => {
    setPicked(undefined);
    setFrozen(null);
    setFeedback(null);
  };

  return (
    <GlassCard tint={ACCENT.red} id="fehler-training"
      style={{ "--c": ACCENT.red, marginBottom: "var(--s-4)", overflow: "hidden", scrollMarginTop: "100px" }}>
      <div className={cx(styles.head, "hover-pop")} onClick={toggle} {...kb(toggle)} aria-expanded={open}
        style={{ padding: "var(--s-3) var(--s-4)", cursor: "pointer" }}>
        <span className={styles.kicker} style={{ "--c": ACCENT.red, color: ACCENT.red }}>
          <span aria-hidden="true">🔁</span> Fehler-Training
        </span>
        <span className={styles.score} style={{ marginLeft: "auto" }}>
          {due.length} fällig · {waiting.length} wartend · {stats.mastered} gemeistert
        </span>
        {open ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
      </div>

      <Collapse open={open}>
      <div style={{ padding: "0 var(--s-4) var(--s-4)" }}>
      {current ? (
        <>
          <div className={styles.trainerMeta}>
            <span>Quelle: <strong>{current.sourceLabel}</strong></span>
            <span>{current.misses}× falsch beantwortet</span>
            <span className={styles.trainerStreak}>
              📦 Stufe {mistakeBox(current)}/{MISTAKE_MAX_BOX} – oberste Stufe bestanden = gemeistert
            </span>
            {isAheadRun && (
              <span className={styles.trainerAhead}>⏩ vorgezogen – fällig {inDays(current.due)}</span>
            )}
          </div>
          <QuizQuestion index={0} question={current.question} picked={picked} onPick={onPick} />
          {feedback && (
            <p className={cx(styles.trainerFeedback, feedback.good ? styles.feedbackGood : styles.feedbackBad)}>
              <span aria-hidden="true">{feedback.icon}</span> {feedback.text}
            </p>
          )}
          {answered && (
            <Button tint={ACCENT.red} style={{ width: "100%" }} onClick={next}>
              Weiter <ArrowRight size={14} aria-hidden="true" />
            </Button>
          )}
        </>
      ) : waiting.length > 0 ? (
        <>
          <p className={styles.trainerWait}>
            ⏳ Nichts fällig – {waiting.length === 1 ? "eine Frage wartet" : `${waiting.length} Fragen warten`} auf
            die nächste Wiederholung ({inDays(waiting[0].due)}). Der Abstand festigt das Gelernte.
          </p>
          <Button tint={ACCENT.orange} style={{ width: "100%" }} onClick={() => setAhead(true)}>
            <FastForward size={14} aria-hidden="true" /> Trotzdem vorziehen
          </Button>
        </>
      ) : (
        <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--muted)", lineHeight: 1.6 }}>
          {stats.mastered > 0
            ? `Alle Fehler gemeistert – stark! 🎉 (${stats.mastered} Fragen dauerhaft gelernt)`
            : "Noch keine offenen Fehler. Falsch beantwortete Quizfragen landen automatisch hier und werden in wachsenden Abständen wiederholt, bis sie sitzen."}
        </p>
      )}
      </div>
      </Collapse>
    </GlassCard>
  );
});

export default MistakeTrainer;
