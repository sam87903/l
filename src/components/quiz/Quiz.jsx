import { memo, useCallback, useMemo, useState } from "react";
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

  const pick = useCallback(
    (qi, oi) => {
      setAnswers((prev) => {
        if (prev[qi] !== undefined) return prev;
        onAnswer?.(qi, isCorrectAnswer(questions[qi], oi));
        const next = { ...prev, [qi]: oi };
        if (Object.keys(next).length === questions.length && onDone) {
          const correct = Object.entries(next).filter(
            ([q, o]) => isCorrectAnswer(questions[q], o)
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
    setRound((r) => r + 1);
  };

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
            <Button tint={color} style={{ width: "100%" }} onClick={() => setReviewIndex(null)}>
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
