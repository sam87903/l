import { describe, expect, it } from "vitest";
import { baseModId, bridgeTerms, deckLabel, moduleWeakness, parseWrongPoolKey } from "../insights.js";

describe("insights – Schlüssel-Parsing", () => {
  it("baseModId strippt nur das ~ext-Suffix", () => {
    expect(baseModId("s2-mkt~ext")).toBe("s2-mkt");
    expect(baseModId("s2-mkt")).toBe("s2-mkt");
    expect(baseModId("gen-hrw")).toBe("gen-hrw");
  });

  it("parseWrongPoolKey teilt am ersten # und löst Smart-Karten aufs Modul auf", () => {
    expect(parseWrongPoolKey("s1-bwl#3")).toEqual({ modId: "s1-bwl" });
    expect(parseWrongPoolKey("s2-mkt~ext#4")).toEqual({ modId: "s2-mkt" });
    expect(parseWrongPoolKey("smart#c:s1-bwl:3")).toEqual({ modId: "s1-bwl" });
    // Glossar-Fragen haben keinen Modulbezug
    expect(parseWrongPoolKey("smart#g:17")).toBeNull();
    expect(parseWrongPoolKey("smart#gr:17")).toBeNull();
    expect(parseWrongPoolKey("kaputt")).toBeNull();
  });
});

describe("insights – moduleWeakness", () => {
  it("liefert ohne Lernsignale eine leere Liste", () => {
    expect(moduleWeakness({})).toEqual([]);
  });

  it("gewichtet Fehler (45 %) am stärksten und hält Scores in 0..1", () => {
    const today = new Date().toISOString().slice(0, 10);
    const weakness = moduleWeakness({
      wrongPool: {
        "s1-bwl#0": { modId: "s1-bwl", box: 1, due: today },
        "s1-bwl#1": { modId: "s1-bwl", box: 1, due: today },
        "smart#c:s1-bwl:2": { modId: "smart", box: 1, due: today },
      },
      quizBest: { "s2-mkt": { c: 10, t: 10 } },
    });
    const bwl = weakness.find((w) => w.modId === "s1-bwl");
    const mkt = weakness.find((w) => w.modId === "s2-mkt");
    expect(bwl).toBeTruthy();
    expect(mkt).toBeTruthy();
    // viele offene Fehler schlagen ein perfektes Quiz
    expect(bwl.score).toBeGreaterThan(mkt.score);
    for (const w of weakness) {
      expect(w.score).toBeGreaterThanOrEqual(0);
      expect(w.score).toBeLessThanOrEqual(1);
      expect(w.module.code).toBeTruthy();
    }
  });

  it("bündelt Basis- und Erweitert-Quiz aufs selbe Modul", () => {
    const weakness = moduleWeakness({
      quizBest: { "s2-mkt": { c: 2, t: 10 }, "s2-mkt~ext": { c: 10, t: 10 } },
    });
    const mkt = weakness.find((w) => w.modId === "s2-mkt");
    // Durchschnitt aus 0.2 und 1.0 → quizWeak 0.4
    expect(mkt.parts.quiz).toBeCloseTo(0.4, 5);
  });
});

describe("insights – bridgeTerms (Brücken-Themen)", () => {
  it("liefert nur Begriffe mit ≥ 2 Modulen, sortiert nach Modulanzahl", () => {
    const bridges = bridgeTerms();
    expect(bridges.length).toBeGreaterThan(0);
    expect(bridges.length).toBeLessThanOrEqual(12);
    for (const b of bridges) {
      expect(b.modules.length).toBeGreaterThanOrEqual(2);
      // eindeutige Module je Begriff
      expect(new Set(b.modules.map((m) => m.id)).size).toBe(b.modules.length);
    }
    for (let i = 1; i < bridges.length; i++) {
      expect(bridges[i - 1].modules.length).toBeGreaterThanOrEqual(bridges[i].modules.length);
    }
  });

  it("blendet Organisations-Module aus (kein Wahlpflichtbereich-Rauschen)", () => {
    for (const b of bridgeTerms()) {
      expect(b.term.toLowerCase()).not.toBe("wahlpflichtbereich");
      for (const m of b.modules) {
        expect(m.code).not.toMatch(/^(Wahlmodul|Praxis)/);
      }
    }
  });
});

describe("insights – deckLabel", () => {
  it("beschriftet Modul-, Erweitert-, Bonus- und Glossar-Decks lesbar", () => {
    expect(deckLabel("s2-mkt")).toMatch(/·/);
    expect(deckLabel("s2-mkt~ext")).toContain("– Erweitert");
    expect(deckLabel("gen-hrw")).toContain("Studienplan");
    expect(deckLabel("glossar")).toBe("Glossar");
    expect(deckLabel("unbekannt")).toBe("unbekannt");
  });
});
