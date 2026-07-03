/**
 * Zentrale Registry aller Lernkarten-Decks (Module + Glossar) und
 * Leitner-Fälligkeitslogik für das deck-übergreifende Karten-Training.
 */
import { SEMESTERS } from "../data/semesters/index.js";
import { GLOSSARY } from "../data/glossary.js";
import { todayISO } from "./dates.js";

export const GLOSSAR_DECK_ID = "glossar";

const GLOSSARY_TERMS = Object.keys(GLOSSARY).sort((a, b) => a.localeCompare(b, "de"));
export const GLOSSARY_CARDS = GLOSSARY_TERMS.map((term) => ({ front: term, back: GLOSSARY[term] }));

export const DECKS = [
  ...SEMESTERS.flatMap((sem) =>
    sem.modules
      .filter((m) => m.cards?.length > 0)
      .map((m) => ({ id: m.id, label: `${m.code} · ${m.name}`, cards: m.cards }))
  ),
  { id: GLOSSAR_DECK_ID, label: "Glossar", cards: GLOSSARY_CARDS },
];

const DECK_BY_ID = new Map(DECKS.map((d) => [d.id, d]));
export const getDeck = (id) => DECK_BY_ID.get(id);

/** Ist ein Leitner-Eintrag heute (oder früher) fällig? */
export const isDue = (entry, today = todayISO()) => Boolean(entry && entry.due <= today);

/** Alle heute fälligen Karten über sämtliche Decks hinweg. */
export function collectDueCards(srs, today = todayISO()) {
  const due = [];
  for (const [deckId, entries] of Object.entries(srs ?? {})) {
    const deck = DECK_BY_ID.get(deckId);
    if (!deck) continue;
    for (const [rawIndex, entry] of Object.entries(entries ?? {})) {
      const index = Number(rawIndex);
      const card = deck.cards[index];
      if (card && isDue(entry, today)) {
        due.push({ deckId, deckLabel: deck.label, index, box: entry.box, front: card.front, back: card.back });
      }
    }
  }
  // Schwächste Boxen zuerst, dann stabil nach Deck/Index.
  return due.sort((a, b) => a.box - b.box || a.deckId.localeCompare(b.deckId) || a.index - b.index);
}

export const countDueCards = (srs, today = todayISO()) => collectDueCards(srs, today).length;
