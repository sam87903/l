import { describe, expect, it } from "vitest";
import { isBetterScore } from "../scores.js";

describe("isBetterScore", () => {
  it("übernimmt das erste Ergebnis", () => {
    expect(isBetterScore(undefined, 3, 10)).toBe(true);
  });

  it("übernimmt die bessere Quote", () => {
    expect(isBetterScore({ c: 5, t: 10 }, 8, 10)).toBe(true);
  });

  it("verwirft die schlechtere Quote", () => {
    expect(isBetterScore({ c: 8, t: 10 }, 5, 10)).toBe(false);
  });

  it("schützt ein fehlerfreies Ergebnis vor einem grösseren, schlechteren", () => {
    // Der Kern des behobenen Fehlers: 8 Treffer sind mehr als 5,
    // aber 8/10 ist schlechter als 5/5.
    expect(isBetterScore({ c: 5, t: 5 }, 8, 10)).toBe(false);
  });

  it("erkennt die bessere Quote trotz weniger Treffer", () => {
    expect(isBetterScore({ c: 8, t: 20 }, 7, 8)).toBe(true);
  });

  it("bevorzugt bei gleicher Quote den grösseren Fragensatz", () => {
    expect(isBetterScore({ c: 5, t: 5 }, 10, 10)).toBe(true);
    expect(isBetterScore({ c: 10, t: 10 }, 5, 5)).toBe(false);
  });

  it("ignoriert Ergebnisse ohne Fragen", () => {
    expect(isBetterScore({ c: 1, t: 5 }, 0, 0)).toBe(false);
  });

  it("kommt mit kaputten Altwerten ohne Gesamtzahl klar", () => {
    expect(isBetterScore({ c: 3 }, 4, 10)).toBe(true);
    expect(isBetterScore({ c: 3 }, 2, 10)).toBe(false);
  });
});
