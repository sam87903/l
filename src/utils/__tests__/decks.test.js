import { describe, expect, it } from "vitest";
import { DECKS, GLOSSAR_DECK_ID, collectDueCards, countDueCards, getDeck, isDue } from "../decks.js";
import { addDaysISO, todayISO } from "../dates.js";
import { LEITNER_INTERVALS, LEITNER_MAX_BOX } from "../../constants/config.js";

describe("decks", () => {
  it("registriert alle Modul-Decks und das Glossar", () => {
    expect(DECKS.length).toBeGreaterThan(1);
    const glossar = getDeck(GLOSSAR_DECK_ID);
    expect(glossar).toBeDefined();
    expect(glossar.cards.length).toBeGreaterThan(50);
    for (const deck of DECKS) {
      expect(deck.cards.every((c) => c.front && c.back)).toBe(true);
    }
  });

  it("erkennt fällige Leitner-Einträge", () => {
    const today = todayISO();
    expect(isDue({ box: 1, due: today })).toBe(true);
    expect(isDue({ box: 2, due: "2020-01-01" })).toBe(true);
    expect(isDue({ box: 3, due: addDaysISO(3) })).toBe(false);
    expect(isDue(undefined)).toBe(false);
  });

  it("sammelt fällige Karten deck-übergreifend, schwächste Box zuerst", () => {
    const today = todayISO();
    const modDeck = DECKS.find((d) => d.id !== GLOSSAR_DECK_ID);
    const srs = {
      [GLOSSAR_DECK_ID]: {
        0: { box: 3, due: today },
        1: { box: 1, due: addDaysISO(5) }, // noch nicht fällig
      },
      [modDeck.id]: { 0: { box: 1, due: "2020-01-01" } },
      "unbekanntes-deck": { 0: { box: 1, due: today } },
    };
    const due = collectDueCards(srs);
    expect(due).toHaveLength(2);
    expect(due[0].deckId).toBe(modDeck.id); // Box 1 vor Box 3
    expect(due[0].front).toBe(modDeck.cards[0].front);
    expect(due[1].deckId).toBe(GLOSSAR_DECK_ID);
    expect(countDueCards(srs)).toBe(2);
    expect(countDueCards({})).toBe(0);
  });

  it("Leitner-Konfiguration deckt alle Boxen ab", () => {
    for (let box = 1; box <= LEITNER_MAX_BOX; box += 1) {
      expect(LEITNER_INTERVALS[box]).toBeGreaterThanOrEqual(0);
    }
    expect(LEITNER_INTERVALS[1]).toBe(0);
    expect(LEITNER_INTERVALS[LEITNER_MAX_BOX]).toBe(30);
  });

  it("addDaysISO liefert lokale ISO-Daten in der Zukunft", () => {
    expect(addDaysISO(0)).toBe(todayISO());
    expect(addDaysISO(3) > todayISO()).toBe(true);
    expect(addDaysISO(7, new Date("2026-07-01T12:00:00"))).toBe("2026-07-08");
  });
});
