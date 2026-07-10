import { describe, expect, it } from "vitest";
import { buildExamProfile, buildMockExam, gradeMockExam, EXAM_SIZES, MC_POINTS, OPEN_POINTS } from "../examSimulator.js";

const EXAMS = [
  {
    name: "E-Commerce SS24",
    text: `Erläutern Sie Netzeffekte und die Kritische Masse im E-Marketplace.
      Beschreiben Sie die Customer Journey und definieren Sie SEO und SEA.
      Berechnen Sie den Kapitalwert der Investition. Nennen Sie das Betreiber-Modell.`,
  },
  {
    name: "E-Commerce WS23",
    text: `Definieren Sie Netzeffekte. Erläutern Sie das Betreiber-Modell und
      Affiliate-Marketing. Diskutieren Sie den Long Tail der Plattformökonomie.`,
  },
];

describe("examSimulator – buildExamProfile", () => {
  it("liefert normalisierte Modul-Gewichte (0..1) mit Maximum 1", () => {
    const profile = buildExamProfile(EXAMS);
    expect(profile.examCount).toBe(2);
    const weights = Object.values(profile.moduleWeights);
    expect(weights.length).toBeGreaterThan(0);
    expect(Math.max(...weights)).toBe(1);
    for (const w of weights) {
      expect(w).toBeGreaterThan(0);
      expect(w).toBeLessThanOrEqual(1);
    }
  });

  it("liefert bei leerer Eingabe ein leeres Profil", () => {
    const profile = buildExamProfile([]);
    expect(profile.examCount).toBe(0);
    expect(profile.topTerms).toEqual([]);
  });
});

describe("examSimulator – buildMockExam", () => {
  it("liefert null ohne gespeicherte Klausuren (kein Fake-Fallback)", () => {
    expect(buildMockExam({ exams: [] })).toBeNull();
  });

  it("baut MC- und offene Aufgaben inkl. Musterlösung und Punkten", () => {
    const mock = buildMockExam({ exams: EXAMS, size: "standard" });
    expect(mock).not.toBeNull();
    expect(mock.mc.length).toBeGreaterThanOrEqual(5);
    expect(mock.open.length).toBeGreaterThanOrEqual(1);
    for (const q of mock.mc) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.points).toBe(MC_POINTS);
      expect(q.recordMod).toBeTruthy();
    }
    for (const q of mock.open) {
      expect(q.prompt).toContain(q.term);
      expect(q.points).toBe(OPEN_POINTS);
      expect(typeof q.modelAnswer).toBe("string");
      expect(q.modelAnswer.length).toBeGreaterThan(10);
    }
    expect(mock.maxPoints).toBe(mock.mc.length * MC_POINTS + mock.open.length * OPEN_POINTS);
    expect(mock.durationMin).toBeGreaterThan(0);
    expect(mock.durationMin % 5).toBe(0);
  });

  it("offene Aufgaben: max. eine pro Modul, keine doppelten Begriffe", () => {
    const mock = buildMockExam({ exams: EXAMS, size: "voll" });
    const terms = mock.open.map((q) => q.term.toLowerCase());
    expect(new Set(terms).size).toBe(terms.length);
    const modIds = mock.open.map((q) => q.module?.id).filter(Boolean);
    expect(new Set(modIds).size).toBe(modIds.length);
  });

  it("kennt alle drei Größen-Presets", () => {
    expect(EXAM_SIZES.map((s) => s.id)).toEqual(["kurz", "standard", "voll"]);
  });
});

describe("examSimulator – gradeMockExam (deutsche Notentabelle)", () => {
  const grade = (pctTarget) => {
    // 100 MC à 2 P – über mcCorrect lässt sich jeder Prozentwert exakt treffen
    return gradeMockExam({ mcCorrect: pctTarget, mcTotal: 100, openScores: [] });
  };

  it("Notengrenzen: 95 → 1,0 · 50 → 4,0 · 49 → 5,0", () => {
    expect(grade(95).grade).toBe("1,0");
    expect(grade(94).grade).toBe("1,3");
    expect(grade(50).grade).toBe("4,0");
    expect(grade(50).passed).toBe(true);
    expect(grade(49).grade).toBe("5,0");
    expect(grade(49).passed).toBe(false);
  });

  it("rechnet Selbsteinschätzungen der offenen Aufgaben ein", () => {
    const res = gradeMockExam({ mcCorrect: 10, mcTotal: 10, openScores: [1, 0.5, 0] });
    expect(res.points).toBe(10 * MC_POINTS + 1.5 * OPEN_POINTS);
    expect(res.maxPoints).toBe(10 * MC_POINTS + 3 * OPEN_POINTS);
  });

  it("liefert bei leerer Klausur 0 % ohne Division durch null", () => {
    expect(gradeMockExam({}).pct).toBe(0);
  });
});
