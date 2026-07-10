import { describe, expect, it } from "vitest";
import { CURATED_INSIGHTS, insightFor } from "../communityInsights.js";
import { GLOSSARY } from "../glossary.js";
import { termModuleEntries } from "../../utils/examAnalysis.js";

const GLOSSARY_LOWER = new Set(Object.keys(GLOSSARY).map((k) => k.toLowerCase()));
const INDEX_LOWER = new Set(termModuleEntries().map((e) => e.term.toLowerCase()));

describe("communityInsights – Datenintegrität", () => {
  it("jeder kuratierte Begriff löst im Glossar oder Analyse-Index auf (Deep-Links funktionieren)", () => {
    for (const term of Object.keys(CURATED_INSIGHTS)) {
      const lower = term.toLowerCase();
      expect(
        GLOSSARY_LOWER.has(lower) || INDEX_LOWER.has(lower),
        `„${term}" fehlt in Glossar und Index`
      ).toBe(true);
    }
  });

  it("alle Werte sind plausible Prozentwerte (1–100)", () => {
    for (const [term, pct] of Object.entries(CURATED_INSIGHTS)) {
      expect(Number.isFinite(pct), term).toBe(true);
      expect(pct).toBeGreaterThanOrEqual(1);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });

  it("insightFor ist case-insensitiv und liefert null für Unbekanntes", () => {
    expect(insightFor("netzeffekte")).toBe(83);
    expect(insightFor("NETZEFFEKTE")).toBe(83);
    expect(insightFor("gibt-es-nicht")).toBeNull();
  });
});
