import { describe, expect, it } from "vitest";
import { buildRecommendations } from "../recommend.js";
import { todayISO } from "../dates.js";

const WEAK_MODULE = {
  modId: "s2-mkt",
  score: 0.7,
  module: { id: "s2-mkt", code: "M EC", name: "Marketing im E-Commerce", quiz: [{ q: "x" }] },
  parts: { mistakes: 1, quiz: 0.5, srs: 0.5 },
};

describe("recommend – buildRecommendations", () => {
  it("liefert ohne Signale keine Empfehlungen", () => {
    expect(buildRecommendations({})).toEqual([]);
  });

  it("priorisiert: fällige Fehler vor SRS-Karten vor schwachem Modul (max. 3)", () => {
    const recs = buildRecommendations({
      stats: { mistakesDue: 4, streak: 3 },
      srs: { "s1-bwl": { 0: { box: 1, due: "2020-01-01" } } },
      weakness: [WEAK_MODULE],
      examFreq: { "s2-mkt": 0.8 },
      topTerms: [{ term: "Netzeffekte", inExams: 2, total: 2 }],
      activity: {},
    });
    expect(recs.length).toBe(3);
    expect(recs.map((r) => r.id)).toEqual(["mistakes", "srs", "weak-module"]);
    expect(recs[0].urgent).toBe(true);
    for (const r of recs) {
      expect(r.title).toBeTruthy();
      expect(r.reason).toBeTruthy();
      expect(r.action.to).toBeTruthy();
    }
  });

  it("schwaches Modul mit Quiz verlinkt ins Modul-Quiz", () => {
    const recs = buildRecommendations({ weakness: [WEAK_MODULE], examFreq: {} });
    const weak = recs.find((r) => r.id === "weak-module");
    expect(weak.action.state.openQuiz).toBe("s2-mkt");
  });

  it("ignoriert Module unterhalb der Schwäche-Schwelle", () => {
    const recs = buildRecommendations({ weakness: [{ ...WEAK_MODULE, score: 0.2 }] });
    expect(recs.find((r) => r.id === "weak-module")).toBeUndefined();
  });

  it("Klausur-Top-Begriff verlinkt in die Glossar-Definition (kanonische Schreibweise)", () => {
    const recs = buildRecommendations({
      topTerms: [{ term: "netzeffekte", inExams: 3, total: 3 }],
    });
    const term = recs.find((r) => r.id === "exam-term");
    expect(term).toBeTruthy();
    expect(term.action.state.openTerm).toBe("Netzeffekte");
  });

  it("Streak-Retter erscheint nur ohne heutige Aktivität", () => {
    const base = { stats: { streak: 5, mistakesDue: 0 } };
    const inactive = buildRecommendations({ ...base, activity: {} });
    expect(inactive.some((r) => r.id === "streak")).toBe(true);
    const active = buildRecommendations({ ...base, activity: { [todayISO()]: 15 } });
    expect(active.some((r) => r.id === "streak")).toBe(false);
  });
});
