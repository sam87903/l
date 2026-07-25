import { describe, expect, it } from "vitest";
import { buildFormulaQuiz, FORMULA_QUIZ_CATS, FORMULA_RECORD_MOD } from "../formulaQuiz.js";
import { FORMULAS } from "../../data/formulas.js";

const build = (opts) => buildFormulaQuiz(opts);

describe("buildFormulaQuiz", () => {
  it("liefert die gewünschte Anzahl Fragen", () => {
    expect(build({ count: 10 })).toHaveLength(10);
    expect(build({ count: 5 })).toHaveLength(5);
  });

  it("erzeugt immer vier verschiedene Antwortmöglichkeiten", () => {
    for (const q of build({ count: 15 })) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
    }
  });

  it("markiert genau eine gültige richtige Antwort", () => {
    for (const q of build({ count: 15 })) {
      expect(q.correct).toBeGreaterThanOrEqual(0);
      expect(q.correct).toBeLessThan(q.options.length);
      expect(typeof q.options[q.correct]).toBe("string");
    }
  });

  it("hängt Frage, Erklärung und Thema an", () => {
    for (const q of build({ count: 10 })) {
      expect(q.q.length).toBeGreaterThan(5);
      expect(q.explain.length).toBeGreaterThan(5);
      expect(q.topic).toBeTruthy();
    }
  });

  it("verdrahtet die Fehler-Kartei mit stabilen Schlüsseln", () => {
    const qs = build({ count: 12 });
    for (const q of qs) {
      expect(q.recordMod).toBe(FORMULA_RECORD_MOD);
      expect(q.recordKey).toMatch(/^(formula|name|calc):/);
    }
    // Keine Dublette innerhalb einer Runde
    expect(new Set(qs.map((q) => q.recordKey)).size).toBe(qs.length);
  });

  it("bleibt in der gewählten Kategorie", () => {
    const cat = "kpi";
    const names = new Set(FORMULAS.filter((f) => f.cat === cat).map((f) => f.name));
    for (const q of build({ count: 5, cat })) {
      expect(names.has(q.topic)).toBe(true);
    }
  });

  it("kommt mit einer sehr kleinen Kategorie zurecht, ohne zu erfinden", () => {
    const smallest = [...FORMULA_QUIZ_CATS].sort((a, b) => a.count - b.count)[0];
    const qs = build({ count: 50, cat: smallest.id });
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.length).toBeLessThanOrEqual(50);
    expect(new Set(qs.map((q) => q.recordKey)).size).toBe(qs.length);
  });

  it("liefert für eine unbekannte Kategorie eine leere Runde statt Müll", () => {
    expect(build({ count: 5, cat: "gibt-es-nicht" })).toEqual([]);
  });

  it("lässt Rechenfragen auf Wunsch weg", () => {
    const qs = build({ count: 15, withCalc: false });
    expect(qs.every((q) => !q.recordKey.startsWith("calc:"))).toBe(true);
  });

  it("rechnet Rechenfragen tatsächlich korrekt", () => {
    // Über viele Runden mindestens ein paar Rechenfragen einsammeln
    const calcQs = [];
    for (let i = 0; i < 25 && calcQs.length < 10; i++) {
      calcQs.push(...build({ count: 15 }).filter((q) => q.recordKey.startsWith("calc:")));
    }
    expect(calcQs.length).toBeGreaterThan(0);
    for (const q of calcQs) {
      // Die richtige Antwort muss als Zahl im Fragetext-Ergebnis auftauchen
      expect(q.explain).toContain(q.options[q.correct]);
      // Alle Werte im Fragetext sind Zahlen, kein "NaN"/"undefined"
      expect(q.q).not.toMatch(/NaN|undefined|null/);
      expect(q.options.join(" ")).not.toMatch(/NaN|undefined|Infinity/);
    }
  });
});

describe("FORMULA_QUIZ_CATS", () => {
  it("zählt jede Kategorie und lässt leere weg", () => {
    expect(FORMULA_QUIZ_CATS.length).toBeGreaterThan(0);
    for (const c of FORMULA_QUIZ_CATS) {
      expect(c.count).toBe(FORMULAS.filter((f) => f.cat === c.id).length);
      expect(c.count).toBeGreaterThan(0);
      expect(c.label).toBeTruthy();
    }
  });

  it("deckt alle Formeln ab", () => {
    const total = FORMULA_QUIZ_CATS.reduce((n, c) => n + c.count, 0);
    expect(total).toBe(FORMULAS.length);
  });
});
