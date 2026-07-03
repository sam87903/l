import { memo, useCallback, useMemo, useState } from "react";
import GlassCard from "../ui/GlassCard.jsx";
import Button from "../ui/Button.jsx";
import QuizQuestion from "./QuizQuestion.jsx";
import QuizAnalysis from "./QuizAnalysis.jsx";
import { shuffleQuestionOptions } from "../../utils/questionBank.js";
import { ACCENT } from "../../constants/theme.js";
import styles from "./quiz.module.css";

const isCorrectAnswer = (question, optionIndex) =>
  Array.isArray(question.corrects)
    ? question.corrects.includes(optionIndex)
    : question.correct === optionIndex;

/** Komplettes Modul-Quiz mit Sofort-Feedback, Bestscore, Retry und Lernanalyse. */
const Quiz = memo(function Quiz({ questions: rawQuestions, color = ACCENT.teal, best, onDone, onAnswer, module, shuffleAnswers = false }) {
  const [answers, setAnswers] = useState({});
  const [round, setRound] = useState(0);
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
      </div>
      {questions.map((q, qi) => (
        <QuizQuestion key={qi} index={qi} question={q} picked={answers[qi]} onPick={(oi) => pick(qi, oi)} />
      ))}
      {finished && (
        <>
          {module && <QuizAnalysis module={module} questions={questions} answers={answers} />}
          <Button tint={color} style={{ width: "100%", marginTop: "var(--s-3)" }}
            onClick={() => { setAnswers({}); setRound((r) => r + 1); }}>
            ↺ Nochmal versuchen
          </Button>
        </>
      )}
    </GlassCard>
  );
});

export default Quiz;
