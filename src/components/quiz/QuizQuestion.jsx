import { memo } from "react";
import { motion } from "framer-motion";
import { cx } from "../../utils/misc.js";
import styles from "./quiz.module.css";

/**
 * Eine Quizfrage. Unterstützt Single Choice (Standard), True/False
 * (`type:"boolean"`, options = 2) und Multiple Choice über `corrects`.
 */
const QuizQuestion = memo(function QuizQuestion({ index, question, picked, onPick }) {
  const answered = picked !== undefined;
  const correctSet = new Set(
    Array.isArray(question.corrects) ? question.corrects : [question.correct]
  );

  return (
    <div className={styles.question}>
      <p className={styles.questionText}>{index + 1}. {question.q}</p>
      <div className={styles.options} role="group" aria-label={`Frage ${index + 1}`}>
        {question.options.map((option, oi) => {
          const isCorrect = correctSet.has(oi);
          const isPicked = picked === oi;
          const showCorrect = answered && isCorrect;
          const showWrong = answered && isPicked && !isCorrect;
          return (
            <motion.button
              key={oi}
              className={cx(styles.option, showCorrect && styles.optionCorrect, showWrong && styles.optionWrong)}
              disabled={answered}
              onClick={() => onPick(oi)}
              whileTap={answered ? undefined : { scale: 0.98 }}
            >
              <span className={styles.optionMark} aria-hidden="true">
                {showCorrect ? "✓" : showWrong ? "✕" : ""}
              </span>
              {option}
            </motion.button>
          );
        })}
      </div>
      {answered && question.explain && (
        <motion.p className={styles.explain} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
          💡 {question.explain}
        </motion.p>
      )}
    </div>
  );
});

export default QuizQuestion;
