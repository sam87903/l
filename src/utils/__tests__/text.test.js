import { describe, expect, it } from "vitest";
import { fold, matches } from "../text.js";

describe("fold", () => {
  it("zieht Umlaute und ß auf Grundbuchstaben zusammen", () => {
    expect(fold("Ökonomie")).toBe("okonomie");
    expect(fold("Grundsätze")).toBe("grundsatze");
    expect(fold("Größe")).toBe("grosse");
    expect(fold("Übersicht")).toBe("ubersicht");
  });

  it("entfernt sonstige Akzente", () => {
    expect(fold("Café")).toBe("cafe");
  });
});

describe("matches", () => {
  it("findet trotz fehlendem Umlaut", () => {
    expect(matches("Ökonomie", "okonomie")).toBe(true);
    expect(matches("Liquiditätsgrad", "liquiditat")).toBe(true);
  });

  it("findet trotz ausgeschriebenem Umlaut", () => {
    expect(matches("Ökonomie", "oekonomie")).toBe(true);
    expect(matches("Übersicht", "uebersicht")).toBe(true);
  });

  it("findet ß über ss", () => {
    expect(matches("Großhandel", "grosshandel")).toBe(true);
    expect(matches("Großhandel", "grosshandel".toUpperCase())).toBe(true);
  });

  it("findet weiterhin exakt geschriebene Begriffe", () => {
    expect(matches("Deckungsbeitrag", "deckungsbeitrag")).toBe(true);
    expect(matches("Deckungsbeitrag", "Deckung")).toBe(true);
  });

  it("liefert bei leerer Suche alles", () => {
    expect(matches("egal", "")).toBe(true);
  });

  it("findet nichts Falsches", () => {
    expect(matches("Bilanz", "guv")).toBe(false);
    expect(matches("Ökonomie", "onomie x")).toBe(false);
  });
});
