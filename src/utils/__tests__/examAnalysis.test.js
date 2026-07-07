import { describe, expect, it } from "vitest";
import { analyzeExam, aggregateExams } from "../examAnalysis.js";

describe("examAnalysis – Wortgrenze (Rausch-Filter)", () => {
  it("zählt einen kurzen Begriff nicht innerhalb eines Bindestrich-Kompositums", () => {
    // „break" (Java-Glossarbegriff) darf NICHT in „Break-even" mitzählen.
    const text =
      "Aufgabe: Berechnen Sie den Break-even-Point und den Deckungsbeitrag. " +
      "Erläutern Sie das Wirtschaftlichkeitsprinzip.";
    const { top10 } = analyzeExam(text);
    const terms = top10.map((t) => t.term.toLowerCase());
    expect(terms).not.toContain("break");
  });
});

describe("examAnalysis – aggregateExams (Prüfungsradar)", () => {
  const exams = [
    { name: "A", text: "Wirtschaftlichkeitsprinzip erläutern. Grundlagen des E-Commerce beschreiben." },
    { name: "B", text: "Wirtschaftlichkeitsprinzip berechnen. Rechtsformen GmbH und AG." },
  ];

  it("liefert total und eine sortierte, begrenzte Themenliste", () => {
    const res = aggregateExams(exams);
    expect(res.total).toBe(2);
    expect(res.terms.length).toBeGreaterThan(0);
    expect(res.terms.length).toBeLessThanOrEqual(12);
    // absteigend nach Wahrscheinlichkeit
    for (let i = 1; i < res.terms.length; i++) {
      expect(res.terms[i - 1].probability).toBeGreaterThanOrEqual(res.terms[i].probability);
    }
  });

  it("gewichtet Themen höher, die in mehreren Klausuren vorkommen", () => {
    const res = aggregateExams(exams);
    const shared = res.terms.find((t) => t.term.toLowerCase() === "wirtschaftlichkeitsprinzip");
    expect(shared).toBeTruthy();
    expect(shared.inExams).toBe(2);
    expect(shared.total).toBe(2);
    // ein in beiden Klausuren vorkommendes Thema steht vor einem nur einmaligen
    const single = res.terms.find((t) => t.inExams === 1);
    if (single) expect(shared.rank).toBeLessThan(single.rank);
  });

  it("markiert Glossarbegriffe (inGlossary) für die Verlinkung", () => {
    const res = aggregateExams(exams);
    expect(res.terms.some((t) => typeof t.inGlossary === "boolean")).toBe(true);
  });

  it("liefert bei leerer Eingabe ein leeres Ergebnis", () => {
    expect(aggregateExams([])).toEqual({ total: 0, terms: [] });
  });
});
