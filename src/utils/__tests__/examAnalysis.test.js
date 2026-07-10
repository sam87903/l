import { describe, expect, it } from "vitest";
import { analyzeExam, aggregateExams, buildExamPrompt, examSimilarity } from "../examAnalysis.js";

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

describe("examAnalysis – examSimilarity (Kosinus über Fachbegriffe)", () => {
  const dbText = "ER-Modell, Primärschlüssel und Normalisierung erläutern. SQL JOIN anwenden.";
  const mktText = "Customer Journey beschreiben, SEO und SEA vergleichen, Conversion berechnen.";

  it("identische Texte sind maximal ähnlich (≈1)", () => {
    expect(examSimilarity(dbText, dbText)).toBeCloseTo(1, 5);
  });

  it("thematisch disjunkte Texte sind unähnlich", () => {
    const sim = examSimilarity(dbText, mktText);
    expect(sim).toBeLessThan(0.2);
  });

  it("ist symmetrisch und liefert 0 für leere Texte", () => {
    expect(examSimilarity(dbText, mktText)).toBeCloseTo(examSimilarity(mktText, dbText), 10);
    expect(examSimilarity("", dbText)).toBe(0);
    expect(examSimilarity(dbText, "")).toBe(0);
  });
});

describe("examAnalysis – buildExamPrompt (RAG)", () => {
  const exam = {
    name: "E-Commerce SS24",
    addedAt: "2026-01-15T10:00:00.000Z",
    text: "Erläutern Sie Netzeffekte, die Kritische Masse und das Betreiber-Modell im E-Marketplace.",
  };
  const others = [
    { name: "E-Commerce WS23", addedAt: "2025-07-01T10:00:00.000Z", text: "Netzeffekte und E-Marketplace beschreiben. Kritische Masse definieren." },
    { name: "Statistik WS23", addedAt: "2025-07-02T10:00:00.000Z", text: "Normalverteilung, Standardabweichung und Hypothesentest berechnen." },
  ];

  it("enthält Rolle, Modul-Tipp, alle 6 Abschnitte und Schritt-für-Schritt-Anweisung", () => {
    const prompt = buildExamPrompt(exam, others);
    expect(prompt).toContain("erfahrener Prüfungsanalyst und Dozent");
    expect(prompt).toContain("BPO 02.06.2023");
    expect(prompt).toContain("Das Modul ist");
    for (const heading of [
      "Themencluster & Schwerpunkt",
      "Aufgabentypen & Verteilung",
      "Schwierigkeitsgrad & Stolperstellen",
      "Wiederkehrende Muster & Trends",
      "Top 10 Prüfungswahrscheinlichkeit",
      "Optimale Lernstrategie",
    ]) expect(prompt).toContain(heading);
    expect(prompt).toContain("Denke Schritt für Schritt.");
  });

  it("bettet historische Klausuren mit Ähnlichkeit in % ein", () => {
    const prompt = buildExamPrompt(exam, others);
    expect(prompt).toContain("HISTORISCHER KONTEXT");
    expect(prompt).toContain("E-Commerce WS23");
    expect(prompt).toMatch(/Ähnlichkeit: \d+\.\d %/);
    // die thematisch nähere Klausur steht vor der ferneren
    expect(prompt.indexOf("E-Commerce WS23")).toBeLessThan(prompt.indexOf("Statistik WS23"));
  });

  it("funktioniert ohne weitere Klausuren (kein RAG-Kontext)", () => {
    const prompt = buildExamPrompt(exam, []);
    expect(prompt).toContain("Keine weiteren Klausuren gespeichert");
    expect(prompt).toContain(exam.text);
  });
});

describe("examAnalysis – Abdeckung über den ganzen Lehrplan", () => {
  const cases = [
    ["Datenbanken", "ER-Modell, Primärschlüssel, Fremdschlüssel, Normalisierung bis 3NF, SQL JOIN, referenzielle Integrität.", "DAT"],
    ["Statistik", "Mittelwert, Median, Standardabweichung, Normalverteilung, Hypothesentest, Korrelation und Regression.", "Ang.Stat."],
    ["Softwaretechnik", "UML-Klassendiagramm, Use-Case-Diagramm, Entwurfsmuster, Wasserfallmodell und Scrum, Requirements Engineering.", "SWT EC"],
    ["Operations", "Bullwhip-Effekt, Just-in-Time, Kanban, Meldebestand, Sicherheitsbestand, ABC-Analyse.", "OSCM"],
  ];

  it.each(cases)("erkennt %s-Themen und ordnet sie dem richtigen Modul zu", (_name, text, code) => {
    const { top10, modules } = analyzeExam(text);
    expect(top10.length).toBeGreaterThanOrEqual(3);
    expect(modules.map((m) => m.module.code)).toContain(code);
    // erkannte Themen sind im Glossar hinterlegt (verlinken zur Definition)
    expect(top10.some((t) => t.inGlossary)).toBe(true);
  });
});
