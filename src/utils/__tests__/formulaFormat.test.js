import { describe, expect, it } from "vitest";
import { formulaLines, isMultiStep } from "../formulaFormat.js";
import { FORMULAS } from "../../data/formulas.js";

describe("formulaLines", () => {
  it("lässt eine einfache Gleichung in einer Zeile", () => {
    expect(formulaLines("W = G · p / 100")).toEqual(["W = G · p / 100"]);
  });

  it("bricht die Kalkulationsleiter an jeder Stufe um", () => {
    expect(
      formulaLines("Listen-EK − Rabatt = Einstandspreis → + Handlungskosten → VK")
    ).toEqual([
      "Listen-EK − Rabatt = Einstandspreis",
      "→ + Handlungskosten",
      "→ VK",
    ]);
  });

  it("trennt zwei eigenständige Gleichungen", () => {
    expect(formulaLines("Netto = Brutto / 1,19   ·   USt = Brutto − Netto")).toEqual([
      "Netto = Brutto / 1,19",
      "USt = Brutto − Netto",
    ]);
  });

  it("lässt ein einzelnes Mal-Zeichen in Ruhe", () => {
    // Nur weite Abstände trennen – „a · b" bleibt eine Gleichung.
    expect(formulaLines("CLV = Ø Bestellwert · Kauffrequenz · Lebensdauer")).toHaveLength(1);
  });

  it("kommt mit leerem Eingang zurecht", () => {
    expect(formulaLines("")).toEqual([]);
    expect(formulaLines(undefined)).toEqual([]);
  });

  it("erzeugt für jede echte Formel mindestens eine Zeile ohne Leerzeilen", () => {
    for (const f of FORMULAS) {
      const lines = formulaLines(f.formula);
      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines) expect(line.trim()).toBe(line.trim() && line);
    }
  });

  it("hält die einzelnen Zeilen kurz genug fürs Handy", () => {
    // Nach dem Umbruch soll keine Zeile mehr extrem lang sein.
    const longest = FORMULAS.flatMap((f) => formulaLines(f.formula))
      .reduce((m, l) => Math.max(m, l.length), 0);
    expect(longest).toBeLessThanOrEqual(80);
  });
});

describe("isMultiStep", () => {
  it("erkennt mehrstufige Formeln", () => {
    expect(isMultiStep("a = b → c")).toBe(true);
    expect(isMultiStep("a = b")).toBe(false);
  });
});
