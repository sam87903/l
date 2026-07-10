import { memo, useMemo, useState } from "react";
import { Sparkles, RotateCcw } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Button from "../ui/Button.jsx";
import Quiz from "./Quiz.jsx";
import { buildSmartQuiz, QUESTION_BANK_SIZE } from "../../utils/questionBank.js";
import { smartModuleWeights } from "../../utils/insights.js";
import { SMART_QUIZ_SIZES } from "../../constants/config.js";
import { useProgress } from "../../context/ProgressContext.jsx";
import { ACCENT } from "../../constants/theme.js";
import { cx } from "../../utils/misc.js";
import styles from "./quiz.module.css";

const SCOPES = [
  { id: "weak", label: "🎯 Schwächen", hint: "Fehler & Ungelerntes zuerst" },
  { id: "sem1", label: "1️⃣ Semester 1", hint: "Nur die ersten Module" },
  { id: "all", label: "🌐 Alles", hint: "Gesamter Stoff gemischt" },
];

/**
 * Adaptives Smart-Quiz: zieht Fragen aus der 500er-Fragenbank und
 * gewichtet sie nach den Schwächen des Nutzers (Fehler-Kartei zuerst).
 */
const SmartQuizCard = memo(function SmartQuizCard() {
  const { wrongPool, fcKnown, quizBest, srs, exams, recordAnswer } = useProgress();
  const [count, setCount] = useState(SMART_QUIZ_SIZES[1]);
  const [scope, setScope] = useState("weak");
  const [session, setSession] = useState(null);
  const progress = useMemo(() => ({ wrongPool, fcKnown, quizBest }), [wrongPool, fcKnown, quizBest]);
  // SRS 2.0: Ziehung Richtung schwacher, klausurrelevanter und lange
  // nicht wiederholter Module verschieben.
  const moduleWeights = useMemo(
    () => smartModuleWeights({ wrongPool, quizBest, srs, fcKnown, exams }),
    [wrongPool, quizBest, srs, fcKnown, exams]
  );

  const start = () => setSession(buildSmartQuiz({ count, scope, progress, moduleWeights }));

  return (
    <GlassCard tint={ACCENT.violet} id="smart-quiz"
      style={{ "--c": ACCENT.violet, padding: "var(--s-4)", marginBottom: "var(--s-4)", scrollMarginTop: "100px" }}>
      <div className={styles.head}>
        <span className={styles.kicker} style={{ "--c": ACCENT.violet, color: ACCENT.violet }}>
          <Sparkles size={14} aria-hidden="true" /> Smart-Quiz
        </span>
        <span className={styles.score}>{QUESTION_BANK_SIZE} Fragen im Pool</span>
      </div>

      {!session ? (
        <>
          <p style={{ margin: "0 0 var(--s-3)", fontSize: "var(--fs-sm)", color: "var(--muted)", lineHeight: 1.6 }}>
            Frisch generierte Fragen aus Lernkarten &amp; Glossar – der Fokus liegt automatisch auf dem,
            was du noch nicht sicher kannst.
          </p>

          <div className={styles.smartRow} role="group" aria-label="Fokus wählen">
            {SCOPES.map((s) => (
              <button key={s.id}
                className={cx(styles.smartOpt, scope === s.id && styles.smartOptActive, "hover-pop")}
                onClick={() => setScope(s.id)} aria-pressed={scope === s.id} title={s.hint}>
                {s.label}
              </button>
            ))}
          </div>

          <div className={styles.smartRow} role="group" aria-label="Fragenanzahl wählen">
            {SMART_QUIZ_SIZES.map((n) => (
              <button key={n}
                className={cx(styles.smartOpt, count === n && styles.smartOptActive, "hover-pop")}
                onClick={() => setCount(n)} aria-pressed={count === n}>
                {n} Fragen
              </button>
            ))}
          </div>

          <Button tint={ACCENT.violet} style={{ width: "100%", marginTop: "var(--s-2)" }} onClick={start}>
            <Sparkles size={15} aria-hidden="true" /> Smart-Quiz starten
          </Button>
        </>
      ) : (
        <>
          <Quiz
            questions={session}
            color={ACCENT.violet}
            onAnswer={(qi, ok) =>
              recordAnswer(session[qi].recordMod, session[qi].recordKey, ok, session[qi])
            }
          />
          <Button style={{ width: "100%" }} onClick={() => setSession(null)}>
            <RotateCcw size={14} aria-hidden="true" /> Neues Smart-Quiz zusammenstellen
          </Button>
        </>
      )}
    </GlassCard>
  );
});

export default SmartQuizCard;
