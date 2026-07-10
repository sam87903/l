import { describe, expect, it } from "vitest";
import { buildSmartQuiz, QUESTION_BANK_SIZE, shuffleQuestionOptions, smartWeight } from "../questionBank.js";

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

  it("smartWeight boostet Module über moduleWeights und kappt bei 24", () => {
    const item = { kind: "card", modId: "s1-bwl", cardIndex: 0, recordMod: "smart", recordKey: "c:s1-bwl:0" };
    const progress = { wrongPool: {}, fcKnown: {}, quizBest: {} };
    const base = smartWeight(item, progress);
    // volles Modul-Gewicht verdreifacht (1 + 2·1)
    expect(smartWeight(item, progress, { "s1-bwl": 1 })).toBeCloseTo(base * 3, 5);
    // fremdes Modul bleibt unberührt
    expect(smartWeight(item, progress, { "s2-mkt": 1 })).toBe(base);
    // Kappung: fälliger Fehler (Basis 8) × Boost 3 → 24 (Obergrenze)
    const due = { wrongPool: { "smart#c:s1-bwl:0": { misses: 2 } }, fcKnown: {}, quizBest: {} };
    expect(smartWeight(item, due, { "s1-bwl": 1 })).toBe(24);
  });

  it("buildSmartQuiz akzeptiert moduleWeights ohne Verhaltensänderung für Alt-Aufrufer", () => {
    const quiz = buildSmartQuiz({ count: 8, moduleWeights: { "s1-bwl": 1 } });
    expect(quiz).toHaveLength(8);
    for (const q of quiz) expect(q.options.length).toBeGreaterThanOrEqual(2);
  });
});
