import { describe, expect, it } from "vitest";
import { EXTENDED_QUIZ, baseQuizId, extQuizId } from "../extendedQuiz.js";
import { GENERAL_QUIZZES } from "../generalQuiz.js";
import { SEMESTERS } from "../semesters/index.js";

describe("extendedQuiz (Erweitert-Fragensätze)", () => {
  const moduleIds = new Set(SEMESTERS.flatMap((s) => s.modules.map((m) => m.id)));

  it("jeder Schlüssel gehört zu einem echten Modul, Fragen sind gültig", () => {
    expect(Object.keys(EXTENDED_QUIZ).length).toBeGreaterThanOrEqual(20);
    for (const [modId, questions] of Object.entries(EXTENDED_QUIZ)) {
      expect(moduleIds.has(modId)).toBe(true);
      expect(questions.length).toBeGreaterThanOrEqual(10);
      for (const q of questions) {
        expect(q.options).toHaveLength(4);
        expect(q.options[q.correct]).toBeDefined();
        expect(q.explain).toBeTruthy();
        expect(new Set(q.options).size).toBe(4);
      }
    }
  });

  it("dupliziert keine Fragen aus Modul- oder Bonus-Quizzen", () => {
    const known = new Set([
      ...SEMESTERS.flatMap((s) => s.modules.flatMap((m) => (m.quiz ?? []).map((q) => q.q))),
      ...GENERAL_QUIZZES.flatMap((d) => d.quiz.map((q) => q.q)),
    ]);
    const seen = new Set();
    for (const questions of Object.values(EXTENDED_QUIZ)) {
      for (const q of questions) {
        expect(known.has(q.q)).toBe(false);
        expect(seen.has(q.q)).toBe(false);
        seen.add(q.q);
      }
    }
  });

  it("bildet Erweitert-IDs korrekt hin und zurück ab", () => {
    expect(extQuizId("s1-bwl")).toBe("s1-bwl~ext");
    expect(baseQuizId("s1-bwl~ext")).toBe("s1-bwl");
    expect(baseQuizId("s1-bwl")).toBeNull();
  });
});
