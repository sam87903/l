import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Button from "../ui/Button.jsx";
import ProgressBar from "../ui/ProgressBar.jsx";
import QuizQuestion from "./QuizQuestion.jsx";
import QuizAnalysis from "./QuizAnalysis.jsx";
import { shuffleQuestionOptions } from "../../utils/questionBank.js";
import { useStoredState } from "../../hooks/useStoredState.js";
import { STORAGE_KEYS } from "../../constants/config.js";
import { ACCENT } from "../../constants/theme.js";
import styles from "./quiz.module.css";

const isCorrectAnswer = (question, optionIndex) =>
  Array.isArray(question.corrects)
    ? question.corrects.includes(optionIndex)
    : question.correct === optionIndex;

/** Text der richtigen Antwort(en) – für die Screenreader-Rückmeldung. */
const correctAnswerText = (question) =>
  (Array.isArray(question.corrects) ? question.corrects : [question.correct])
    .map((i) => question.options[i])
    .join(", ");

/**
 * Komplettes Quiz mit Sofort-Feedback, Bestscore, Retry und Lernanalyse.
 * Zwei Ansichten (global gemerkt): Einzelmodus – eine Frage pro Schritt,
 * „Weiter" blättert ohne Scrollen – oder klassische Listenansicht.
 */
const Quiz = memo(function Quiz({ questions: rawQuestions, color = ACCENT.teal, best, onDone, onAnswer, module, shuffleAnswers = false }) {
  const [answers, setAnswers] = useState({});
  const [round, setRound] = useState(0);
  const [view, setView] = useStoredState(STORAGE_KEYS.quizView, "single", { raw: true });
  // Im Einzelmodus: beantwortete Frage bis „Weiter" festhalten (Feedback lesen).
  const [reviewIndex, setReviewIndex] = useState(null);
  // Höfliche Rückmeldung für Screenreader (richtig/falsch + Erklärung).
  const [srFeedback, setSrFeedback] = useState("");
  const nextRef = useRef(null);
  // Bei aktiviertem Shuffle: Optionen je Runde neu mischen (kein
  // Auswendiglernen der Antwort-Position möglich).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const questions = useMemo(
    () => (shuffleAnswers ? rawQuestions.map(shuffleQuestionOptions) : rawQuestions),
    [rawQuestions, shuffleAnswers, round]
  );
  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.entries(answers).filter(
    ([qi, oi]) => isCorrectAnswer(questions[qi], oi)
  ).length;
  const finished = questions.length > 0 && answeredCount === questions.length;

  const single = view !== "list";
  const firstOpen = questions.findIndex((_, i) => answers[i] === undefined);
  const currentIndex = reviewIndex ?? (firstOpen === -1 ? null : firstOpen);

  const pick = useCallback(
    (qi, oi) => {
      setAnswers((prev) => {
        if (prev[qi] !== undefined) return prev;
        const q = questions[qi];
        const wasCorrect = isCorrectAnswer(q, oi);
        onAnswer?.(qi, wasCorrect);
        setSrFeedback(
          [
            wasCorrect ? "Richtig." : `Falsch. Richtige Antwort: ${correctAnswerText(q)}.`,
            q.explain,
          ]
            .filter(Boolean)
            .join(" ")
        );
        const next = { ...prev, [qi]: oi };
        if (Object.keys(next).length === questions.length && onDone) {
          const correct = Object.entries(next).filter(
            ([q2, o]) => isCorrectAnswer(questions[q2], o)
          ).length;
          onDone(correct, questions.length);
        }
        return next;
      });
    },
    [questions, onDone, onAnswer]
  );

  const retry = () => {
    setAnswers({});
    setReviewIndex(null);
    setSrFeedback("");
    setRound((r) => r + 1);
  };

  // Einzelmodus: „Weiter" nach dem Antworten fokussieren, damit Enter
  // sofort weiterblättert (das gerade angeklickte Options-Feld ist deaktiviert).
  const answeredCurrent = currentIndex !== null && answers[currentIndex] !== undefined;
  useEffect(() => {
    if (single && answeredCurrent) nextRef.current?.focus();
  }, [single, answeredCurrent, currentIndex]);

  // Einzelmodus: Zifferntasten 1–9 wählen die passende Antwortoption.
  useEffect(() => {
    if (!single || currentIndex === null) return;
    const onKey = (e) => {
      const el = e.target;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (answers[currentIndex] !== undefined || !/^[1-9]$/.test(e.key)) return;
      const oi = Number(e.key) - 1;
      if (oi < questions[currentIndex].options.length) {
        e.preventDefault();
        setReviewIndex(currentIndex);
        pick(currentIndex, oi);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [single, currentIndex, answers, questions, pick]);

  return (
    <GlassCard tint={color} className={styles.card} style={{ "--c": color }}>
      <div className={styles.head}>
        <span className={styles.kicker}>
          <span aria-hidden="true">🧩</span> Quiz
          {best && <span className={styles.best}>🏆 Best: {best.c}/{best.t}</span>}
        </span>
        <span className={styles.score} aria-live="polite">
          {answeredCount > 0 && `${correctCount}/${answeredCount} richtig${finished ? " · fertig 🎉" : ""}`}
        </span>
        <button
          className={styles.viewToggle}
          onClick={() => setView(single ? "list" : "single")}
          title="Ansicht wechseln"
          aria-label={single ? "Zur Listenansicht wechseln" : "Zur Einzelansicht wechseln"}
        >
          {single ? "☰ Liste" : "1️⃣ Einzeln"}
        </button>
      </div>

      {/* Für Screenreader: kündigt nach jeder Antwort richtig/falsch an. */}
      <span className="visually-hidden" role="status" aria-live="polite">{srFeedback}</span>

      {single && currentIndex !== null && (
        <>
          <div className={styles.stepMeta}>
            <span>Frage {currentIndex + 1} von {questions.length}</span>
          </div>
          <ProgressBar value={answeredCount} max={questions.length} from={color} to={ACCENT.teal}
            height={4} label="Quiz-Fortschritt" />
          <QuizQuestion
            index={currentIndex}
            question={questions[currentIndex]}
            picked={answers[currentIndex]}
            onPick={(oi) => { setReviewIndex(currentIndex); pick(currentIndex, oi); }}
          />
          {answers[currentIndex] !== undefined && (
            <Button ref={nextRef} tint={color} style={{ width: "100%" }}
              onClick={() => { setSrFeedback(""); setReviewIndex(null); }}>
              Weiter <ArrowRight size={14} aria-hidden="true" />
            </Button>
          )}
        </>
      )}

      {!single && questions.map((q, qi) => (
        <QuizQuestion key={qi} index={qi} question={q} picked={answers[qi]} onPick={(oi) => pick(qi, oi)} />
      ))}

      {finished && (!single || currentIndex === null) && (
        <>
          {module && <QuizAnalysis module={module} questions={questions} answers={answers} />}
          <Button tint={color} style={{ width: "100%", marginTop: "var(--s-3)" }} onClick={retry}>
            ↺ Nochmal versuchen
          </Button>
        </>
      )}
    </GlassCard>
  );
});

export default Quiz;
