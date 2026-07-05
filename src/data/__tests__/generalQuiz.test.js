import { describe, expect, it } from "vitest";
import { GENERAL_QUIZZES, GENERAL_QUIZ_BY_ID } from "../generalQuiz.js";
import { SEMESTERS } from "../semesters/index.js";

describe("generalQuiz (Bonus-Decks)", () => {
  it("liefert vier Decks mit gültigen Fragen (4 Optionen, correct, explain)", () => {
    expect(GENERAL_QUIZZES.length).toBe(4);
    for (const deck of GENERAL_QUIZZES) {
      expect(deck.quiz.length).toBeGreaterThanOrEqual(10);
      for (const q of deck.quiz) {
        expect(q.options).toHaveLength(4);
        expect(q.options[q.correct]).toBeDefined();
        expect(q.explain).toBeTruthy();
        expect(new Set(q.options).size).toBe(4);
      }
    }
  });

  it("kollidiert nicht mit Modul-IDs und dupliziert keine Modul-Fragen", () => {
    const moduleIds = new Set(SEMESTERS.flatMap((s) => s.modules.map((m) => m.id)));
    const moduleQuestions = new Set(
      SEMESTERS.flatMap((s) => s.modules.flatMap((m) => (m.quiz ?? []).map((q) => q.q)))
    );
    for (const deck of GENERAL_QUIZZES) {
      expect(moduleIds.has(deck.id)).toBe(false);
      expect(GENERAL_QUIZ_BY_ID.get(deck.id)).toBe(deck);
      for (const q of deck.quiz) expect(moduleQuestions.has(q.q)).toBe(false);
    }
  });
});
