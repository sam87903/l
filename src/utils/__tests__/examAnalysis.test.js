import { describe, expect, it } from "vitest";
import { analyzeExam, aggregateExams } from "../examAnalysis.js";

describe("examAnalysis – Wortgrenze (Rausch-Filter)", () => {
  it("filtert das Stoppwort break aus den Top-Themen", () => {
    // „break" ist ein Java-Glossarbegriff, greift aber fälschlich in
    // „Break-even" – die STOPWORDS-Liste hält es aus den Top-Themen.
    const text =
      "Aufgabe: Berechnen Sie den Break-even-Point und den Deckungsbeitrag. " +
      "Erläutern Sie das Wirtschaftlichkeitsprinzip.";
    const { top10 } = analyzeExam(text);
    const terms = top10.map((t) => t.term.toLowerCase());
    expect(terms).not.toContain("break");
  });

  it("erkennt zusammengesetzte Fachbegriffe an Bindestrichen", () => {
    // „E-Marketplace" muss auch in „E-Marketplace-Management" zählen.
    const { top10 } = analyzeExam(
      "Erläutern Sie die quantitativen Probleme des E-Marketplace-Managements."
    );
    const terms = top10.map((t) => t.term.toLowerCase());
    expect(terms).toContain("e-marketplace");
  });
});

describe("examAnalysis – echte E-Commerce-Klausurvokabeln", () => {
  it("erkennt zentrale E-Commerce-Prüfungsbegriffe und ordnet sie Modulen zu", () => {
    const text = `Definieren Sie den Begriff E-Shop. Erläutern Sie das E-Marketplace-Management,
      Netzeffekte und die kritische Masse. Nennen Sie die drei Grundmodelle des elektronischen
      Verkaufs: Betreiber-Modell, Dienstleister-Modell und Partner-Modell. Beschreiben Sie die
      Customer Journey. Erklären Sie SEO, SEA und Affiliate-Marketing. Was ist Permission Marketing
      mit Opt-In? Zeigen Sie am Beispiel eines PurePlayer die Plattformökonomie und den Long Tail.`;
    const { top10, modules } = analyzeExam(text);
    const terms = top10.map((t) => t.term.toLowerCase());
    // eine Auswahl der neu abgedeckten Begriffe muss auftauchen
    const recognized = [
      "e-marketplace",
      "customer journey",
      "betreiber-modell",
      "netzeffekte",
      "permission marketing",
      "plattformökonomie",
    ].filter((t) => terms.includes(t));
    expect(recognized.length).toBeGreaterThanOrEqual(3);
    // erkannte Themen tragen einen Modulbezug für die Lern-Verlinkung
    expect(top10.some((t) => t.module)).toBe(true);
    expect(modules.length).toBeGreaterThan(0);
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
