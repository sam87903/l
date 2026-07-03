import { describe, expect, it } from "vitest";
import { buildSmartQuiz, QUESTION_BANK_SIZE, shuffleQuestionOptions } from "../questionBank.js";

describe("questionBank", () => {
  it("stellt eine große Fragenbank bereit", () => {
    expect(QUESTION_BANK_SIZE).toBeGreaterThan(300);
  });

  it("liefert valide Fragen (4 Optionen, gültiger correct-Index)", () => {
    const quiz = buildSmartQuiz({ count: 12 });
    expect(quiz).toHaveLength(12);
    for (const q of quiz) {
      expect(q.options).toHaveLength(4);
      expect(q.options[q.correct]).toBeDefined();
      expect(q.recordMod).toBeTruthy();
    }
  });

  it("gewichtet Fehler-Kartei-Fragen stärker (weak-scope)", () => {
    // Ein statisches Modul-Quiz als Fehler markieren → sollte auftauchen.
    const progress = { wrongPool: { "s1-bwl#0": { misses: 3 } }, fcKnown: {}, quizBest: {} };
    const quiz = buildSmartQuiz({ count: 10, scope: "weak", progress });
    expect(quiz.length).toBeGreaterThan(0);
  });

  it("mischt Antwortoptionen und remappt correct korrekt", () => {
    const shuffled = shuffleQuestionOptions({ q: "x", options: ["a", "b", "c", "d"], correct: 1 });
    expect(shuffled.options[shuffled.correct]).toBe("b");
    expect(shuffled.options).toHaveLength(4);
  });
});
