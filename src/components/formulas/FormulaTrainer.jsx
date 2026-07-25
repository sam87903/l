import { memo, useState } from "react";
import { RotateCcw, Target } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Button from "../ui/Button.jsx";
import Quiz from "../quiz/Quiz.jsx";
import { buildFormulaQuiz, FORMULA_QUIZ_CATS, FORMULA_QUIZ_SIZES } from "../../utils/formulaQuiz.js";
import { useProgress } from "../../context/ProgressContext.jsx";
import { ACCENT } from "../../constants/theme.js";
import { cx } from "../../utils/misc.js";
import styles from "./formulas.module.css";

/**
 * Formel-Trainer: fragt die Formelsammlung ab, statt sie nur nachschlagen zu
 * lassen. Drei Fragetypen – Formel zum Namen, Name zur Formel und echtes
 * Rechnen mit erzeugten Werten. Falsche Antworten landen über recordAnswer
 * automatisch im Fehler-Training.
 */
const FormulaTrainer = memo(function FormulaTrainer() {
  const { recordAnswer } = useProgress();
  const [count, setCount] = useState(FORMULA_QUIZ_SIZES[1]);
  const [cat, setCat] = useState("alle");
  const [withCalc, setWithCalc] = useState(true);
  const [session, setSession] = useState(null);

  const start = () => setSession(buildFormulaQuiz({ count, cat, withCalc }));

  return (
    <GlassCard tint={ACCENT.violet} className={styles.trainer} style={{ "--c": ACCENT.violet }}>
      <div className={styles.trainerHead}>
        <Target size={15} color={ACCENT.violet} aria-hidden="true" />
        <span className={styles.trainerKicker}>Formeln abfragen</span>
      </div>

      {!session ? (
        <>
          <p className={styles.trainerText}>
            Nachschlagen kann jeder – hier wirst du abgefragt: Formel zum Begriff, Begriff zur
            Formel und echte Rechenaufgaben mit wechselnden Zahlen. Was du falsch hast, landet
            automatisch im Fehler-Training.
          </p>

          <div className={styles.optRow} role="group" aria-label="Bereich wählen">
            <button
              className={cx(styles.opt, cat === "alle" && styles.optOn, "hover-pop")}
              onClick={() => setCat("alle")}
              aria-pressed={cat === "alle"}
            >
              🌐 Alle
            </button>
            {FORMULA_QUIZ_CATS.map((c) => (
              <button
                key={c.id}
                className={cx(styles.opt, cat === c.id && styles.optOn, "hover-pop")}
                onClick={() => setCat(c.id)}
                aria-pressed={cat === c.id}
                title={`${c.count} Formeln`}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          <div className={styles.optRow} role="group" aria-label="Fragenanzahl wählen">
            {FORMULA_QUIZ_SIZES.map((n) => (
              <button
                key={n}
                className={cx(styles.opt, count === n && styles.optOn, "hover-pop")}
                onClick={() => setCount(n)}
                aria-pressed={count === n}
              >
                {n} Fragen
              </button>
            ))}
            <button
              className={cx(styles.opt, withCalc && styles.optOn, "hover-pop")}
              onClick={() => setWithCalc((v) => !v)}
              aria-pressed={withCalc}
              title="Rechenaufgaben mit erzeugten Zahlen"
            >
              🔢 Rechnen
            </button>
          </div>

          <Button tint={ACCENT.violet} style={{ width: "100%", marginTop: "var(--s-2)" }} onClick={start}>
            <Target size={15} aria-hidden="true" /> Abfrage starten
          </Button>
        </>
      ) : session.length === 0 ? (
        <>
          <p className={styles.trainerText}>
            Für diese Auswahl lassen sich gerade keine Fragen bauen. Wähle einen anderen Bereich.
          </p>
          <Button style={{ width: "100%" }} onClick={() => setSession(null)}>
            <RotateCcw size={14} aria-hidden="true" /> Zurück zur Auswahl
          </Button>
        </>
      ) : (
        <>
          <Quiz
            questions={session}
            color={ACCENT.violet}
            shuffleAnswers
            onAnswer={(qi, ok) =>
              recordAnswer(session[qi].recordMod, session[qi].recordKey, ok, session[qi])
            }
          />
          <Button style={{ width: "100%" }} onClick={() => setSession(null)}>
            <RotateCcw size={14} aria-hidden="true" /> Neue Abfrage zusammenstellen
          </Button>
        </>
      )}
    </GlassCard>
  );
});

export default FormulaTrainer;
