import { describe, expect, it } from "vitest";
import { parseBackup, toCSV } from "../exportData.js";
import { EXAM_TEXT_LIMIT } from "../../constants/config.js";

const validBackup = () => ({
  doneDays: { 1: true, 2: true },
  startDate: "2026-07-10",
  quizBest: { "s1-bwl": { c: 5, t: 8 } },
  fcKnown: { "s1-bwl": [0, 2] },
  favorites: ["Netzeffekte"],
  activity: { "2026-07-01": 20 },
  exams: [{ id: "x", name: "EC SS24", addedAt: "2026-01-01", text: "Netzeffekte…" }],
});

describe("exportData – parseBackup (gehärtet)", () => {
  it("akzeptiert ein valides Backup vollständig", () => {
    const clean = parseBackup(JSON.stringify(validBackup()));
    expect(clean.doneDays).toEqual({ 1: true, 2: true });
    expect(clean.quizBest["s1-bwl"]).toEqual({ c: 5, t: 8 });
    expect(clean.favorites).toEqual(["Netzeffekte"]);
    expect(clean.exams).toHaveLength(1);
  });

  it("wirft nur bei grundsätzlich falschem Format", () => {
    expect(() => parseBackup("null")).toThrow();
    expect(() => parseBackup('{"foo": 1}')).toThrow();
    expect(() => parseBackup("kein json")).toThrow();
  });

  it("verwirft defekte Einträge, behält die gültigen (kein Alles-oder-Nichts)", () => {
    const data = validBackup();
    data.quizBest = {
      "s1-bwl": { c: 5, t: 8 },
      kaputt1: { c: "fünf", t: 8 },
      kaputt2: { c: 5 },
      kaputt3: null,
    };
    data.doneDays = { 1: true, 2: "ja", 3: 1 };
    data.favorites = ["Netzeffekte", 42, null];
    data.activity = { "2026-07-01": 20, "2026-07-02": -5, "2026-07-03": "x" };
    const clean = parseBackup(JSON.stringify(data));
    expect(Object.keys(clean.quizBest)).toEqual(["s1-bwl"]);
    expect(clean.doneDays).toEqual({ 1: true });
    expect(clean.favorites).toEqual(["Netzeffekte"]);
    expect(clean.activity).toEqual({ "2026-07-01": 20 });
  });

  it("verwirft einen komplett falsch getypten Slice, ohne den Rest zu verlieren", () => {
    const data = validBackup();
    data.srs = "kaputt";
    data.wrongPool = 42;
    const clean = parseBackup(JSON.stringify(data));
    expect(clean.srs).toBeUndefined();
    expect(clean.wrongPool).toBeUndefined();
    expect(clean.doneDays).toEqual({ 1: true, 2: true });
  });

  it("clampt überlange Klausurtexte und verwirft Klausuren ohne Text/Name", () => {
    const data = validBackup();
    data.exams = [
      { id: "a", name: "Lang", text: "x".repeat(EXAM_TEXT_LIMIT + 500) },
      { id: "b", name: "Ohne Text" },
      "kein Objekt",
    ];
    const clean = parseBackup(JSON.stringify(data));
    expect(clean.exams).toHaveLength(1);
    expect(clean.exams[0].text.length).toBe(EXAM_TEXT_LIMIT);
  });
});

describe("exportData – toCSV", () => {
  it("escapt Anführungszeichen und trennt mit Semikolon", () => {
    expect(toCSV([["a", 'b"c'], [1, null]])).toBe('"a";"b""c"\r\n"1";""');
  });
});
