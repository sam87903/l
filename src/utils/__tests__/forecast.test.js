import { describe, expect, it } from "vitest";
import { cardMasteryDate, dueForecast, mistakeClearDate } from "../forecast.js";
import { DECKS, GLOSSAR_DECK_ID } from "../decks.js";

const TODAY = "2026-07-25";
const modDeck = DECKS.find((d) => d.id !== GLOSSAR_DECK_ID);

describe("dueForecast", () => {
  it("liefert für leere Daten lauter Nullen", () => {
    const f = dueForecast({ today: TODAY });
    expect(f.days).toHaveLength(14);
    expect(f.total).toBe(0);
    expect(f.peak).toBe(null);
  });

  it("sortiert Karten und Fragen in die richtigen Tage", () => {
    const f = dueForecast({
      srs: { [modDeck.id]: { 0: { box: 2, due: TODAY }, 1: { box: 3, due: "2026-07-28" } } },
      wrongPool: { "a#0": { due: "2026-07-28" } },
      today: TODAY,
    });
    expect(f.days[0].cards).toBe(1);
    expect(f.days[3].cards).toBe(1);
    expect(f.days[3].questions).toBe(1);
    expect(f.days[3].total).toBe(2);
    expect(f.total).toBe(3);
  });

  it("zieht Überfälliges auf den ersten Tag – es steht jetzt an", () => {
    const f = dueForecast({
      srs: { [modDeck.id]: { 0: { box: 1, due: "2026-01-01" } } },
      wrongPool: { "a#0": { due: "2020-05-05" }, "a#1": {} }, // ohne due = sofort
      today: TODAY,
    });
    expect(f.days[0].cards).toBe(1);
    expect(f.days[0].questions).toBe(2);
    expect(f.total).toBe(3);
  });

  it("zaehlt jenseits des Zeitfensters getrennt, statt es zu verschlucken", () => {
    const f = dueForecast({
      srs: { [modDeck.id]: { 0: { box: 5, due: "2026-12-01" } } },
      today: TODAY,
    });
    expect(f.total).toBe(0);
    expect(f.beyond).toBe(1);
  });

  it("ignoriert unbekannte Decks und geloeschte Karten", () => {
    const f = dueForecast({
      srs: {
        "gibt-es-nicht": { 0: { box: 1, due: TODAY } },
        [modDeck.id]: { 99999: { box: 1, due: TODAY } },
      },
      today: TODAY,
    });
    expect(f.total).toBe(0);
  });

  it("findet den Spitzentag und den Tagesdurchschnitt", () => {
    const f = dueForecast({
      wrongPool: {
        a: { due: "2026-07-27" },
        b: { due: "2026-07-27" },
        c: { due: "2026-07-30" },
      },
      today: TODAY,
    });
    expect(f.peak.iso).toBe("2026-07-27");
    expect(f.peak.total).toBe(2);
    expect(f.perDay).toBeCloseTo(3 / 14);
  });
});

describe("mistakeClearDate", () => {
  it("liefert null ohne Eintraege", () => {
    expect(mistakeClearDate({}, TODAY)).toBe(null);
  });

  it("rechnet ab Stufe 1 die vollen Wartezeiten (1 + 3 Tage)", () => {
    const r = mistakeClearDate({ a: { box: 1, due: TODAY } }, TODAY);
    expect(r.days).toBe(4);
    expect(r.iso).toBe("2026-07-29");
    expect(r.count).toBe(1);
  });

  it("ist auf der obersten Stufe sofort erledigt", () => {
    expect(mistakeClearDate({ a: { box: 3, due: TODAY } }, TODAY).days).toBe(0);
  });

  it("nimmt den spaetesten Eintrag als Gesamtdauer", () => {
    const r = mistakeClearDate({ a: { box: 3, due: TODAY }, b: { box: 1, due: "2026-07-27" } }, TODAY);
    expect(r.days).toBe(2 + 4);
  });
});

describe("cardMasteryDate", () => {
  it("liefert null, solange keine Karte bewertet wurde", () => {
    expect(cardMasteryDate({}, TODAY)).toBe(null);
  });

  it("rechnet ab Stufe 1 die Leitner-Kette (3+7+14+30 Tage)", () => {
    const r = cardMasteryDate({ [modDeck.id]: { 0: { box: 1, due: TODAY } } }, TODAY);
    expect(r.days).toBe(54);
    expect(r.started).toBe(1);
  });

  it("meldet die noch nie bewerteten Karten getrennt", () => {
    const r = cardMasteryDate({ [modDeck.id]: { 0: { box: 5, due: TODAY } } }, TODAY);
    expect(r.days).toBe(0); // oberste Stufe erreicht
    expect(r.untouched).toBeGreaterThan(0);
  });
});
