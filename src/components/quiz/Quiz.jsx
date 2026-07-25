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

  // Antworten liegen zusätzlich in einer Ref, damit die Meldungen an das
  // Fehler-Training (onAnswer) und die Bestwert-Speicherung (onDone) außerhalb
  // des State-Updaters passieren können. Im Updater wären es Seiteneffekte –
  // React darf ihn mehrfach ausführen, und dann zählte jede Antwort doppelt.
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const pick = useCallback(
    (qi, oi) => {
      const prev = answersRef.current;
      if (prev[qi] !== undefined) return;
      const next = { ...prev, [qi]: oi };
      answersRef.current = next;
      setAnswers(next);

      onAnswer?.(qi, isCorrectAnswer(questions[qi], oi));
      if (Object.keys(next).length === questions.length && onDone) {
        const correct = Object.entries(next).filter(
          ([q, o]) => isCorrectAnswer(questions[q], o)
        ).length;
        onDone(correct, questions.length);
      }
    },
    [questions, onDone, onAnswer]
  );

  const retry = () => {
    setAnswers({});
    setReviewIndex(null);
    setRound((r) => r + 1);
  };

  // Tastatur im Einzelmodus: Ziffern wählen die Antwort. Am Laptop lässt sich
  // ein Quiz damit ohne Maus durchspielen.
  const answeredCurrent = currentIndex !== null && answers[currentIndex] !== undefined;
  useEffect(() => {
    if (!single || currentIndex === null || answeredCurrent) return;
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;
      const n = Number(e.key);
      const optionCount = questions[currentIndex]?.options?.length ?? 0;
      if (Number.isInteger(n) && n >= 1 && n <= optionCount) {
        e.preventDefault();
        setReviewIndex(currentIndex);
        pick(currentIndex, n - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [single, currentIndex, answeredCurrent, questions, pick]);

  // Nach der Antwort wandert der Fokus auf „Weiter". Damit blättert Enter
  // zur nächsten Frage – vorher landete Enter noch auf der Modulzeile
  // dahinter und klappte das ganze Quiz wieder zu.
  const nextBtnRef = useRef(null);
  useEffect(() => {
    if (single && answeredCurrent) nextBtnRef.current?.focus({ preventScroll: true });
  }, [single, answeredCurrent, currentIndex]);

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
        >
          {single ? "☰ Liste" : "1️⃣ Einzeln"}
        </button>
      </div>

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
            <Button ref={nextBtnRef} tint={color} style={{ width: "100%" }} onClick={() => setReviewIndex(null)}>
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
