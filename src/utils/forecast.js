/**
 * Blick nach vorn: Wie viel Wiederholung steht in den nächsten Tagen an?
 *
 * Beide Leitner-Systeme der App kennen bisher nur „heute fällig". Wer wissen
 * will, ob morgen 5 oder 50 Karten warten – etwa um eine Reise zu planen –
 * bekam darauf keine Antwort. Hier wird ausschließlich aus vorhandenen Daten
 * gerechnet; es wird nichts zusätzlich gespeichert.
 */
import { DECKS, getDeck } from "./decks.js";
import { mistakeBox } from "./mistakes.js";
import {
  LEITNER_INTERVALS,
  LEITNER_MAX_BOX,
  MISTAKE_INTERVALS,
  MISTAKE_MAX_BOX,
} from "../constants/config.js";
import { addDaysISO, toLocalISO, todayISO } from "./dates.js";

export const FORECAST_DAYS = 14;

/** ISO-Datum als lokales Date – ohne den UTC-Versatz von `new Date("…")`. */
const isoToDate = (iso) => {
  const [y, m, d] = String(iso).split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

/** Ganze Tage von `today` bis `iso` (negativ = überfällig). */
const offsetDays = (iso, today) =>
  Math.round((isoToDate(iso) - isoToDate(today)) / 86400000);

/** Gesamtzahl aller Lernkarten über sämtliche Decks. */
export const totalCardCount = () => DECKS.reduce((n, d) => n + d.cards.length, 0);

/**
 * Tagesweise Vorschau über `days` Tage.
 *
 * Überfälliges landet bewusst im ersten Tag: Es steht jetzt an, nicht in der
 * Vergangenheit. Was hinter dem Zeitfenster liegt, wird in `beyond` gezählt,
 * damit die Summen ehrlich bleiben.
 *
 * @returns {{days: Array<{iso,offset,cards,questions,total}>, total:number,
 *            cards:number, questions:number, beyond:number, peak:object|null,
 *            perDay:number}}
 */
export function dueForecast({ srs = {}, wrongPool = {}, days = FORECAST_DAYS, today = todayISO() } = {}) {
  const buckets = [];
  const byIso = new Map();
  for (let i = 0; i < days; i++) {
    const iso = addDaysISO(i, isoToDate(today));
    const bucket = { iso, offset: i, cards: 0, questions: 0, total: 0 };
    buckets.push(bucket);
    byIso.set(iso, bucket);
  }

  let beyond = 0;
  /** Einen Eintrag in den passenden Tag einsortieren. */
  const place = (due, field) => {
    // Ohne Datum gilt sofort fällig (Alt-Einträge der Fehler-Kartei).
    const offset = due ? offsetDays(due, today) : 0;
    if (offset >= days) {
      beyond += 1;
      return;
    }
    const bucket = offset <= 0 ? buckets[0] : byIso.get(due);
    if (!bucket) return;
    bucket[field] += 1;
    bucket.total += 1;
  };

  for (const [deckId, entries] of Object.entries(srs)) {
    const deck = getDeck(deckId);
    if (!deck) continue;
    for (const [rawIndex, entry] of Object.entries(entries ?? {})) {
      // Karten, die es im Deck nicht mehr gibt, zählen nicht mit.
      if (!deck.cards[Number(rawIndex)] || !entry) continue;
      place(entry.due, "cards");
    }
  }

  for (const entry of Object.values(wrongPool)) {
    if (!entry) continue;
    place(entry.due, "questions");
  }

  const cards = buckets.reduce((n, b) => n + b.cards, 0);
  const questions = buckets.reduce((n, b) => n + b.questions, 0);
  const total = cards + questions;
  const peak = buckets.reduce((best, b) => (!best || b.total > best.total ? b : best), null);

  return {
    days: buckets,
    cards,
    questions,
    total,
    beyond,
    peak: peak && peak.total > 0 ? peak : null,
    perDay: days > 0 ? total / days : 0,
  };
}

/** Restliche Wartetage von `box` bis zur obersten Stufe, gemäß Intervalltabelle. */
const remainingWait = (box, intervals, maxBox) => {
  let sum = 0;
  for (let k = box + 1; k <= maxBox; k++) sum += intervals[k] ?? 0;
  return sum;
};

/**
 * Frühestes Datum, an dem die Fehler-Kartei leer wäre – vorausgesetzt, jede
 * Frage wird ab jetzt bei jeder Fälligkeit richtig beantwortet.
 *
 * Bewusst als „frühestens": Ein Fehler wirft eine Frage auf Stufe 1 zurück.
 * Das ist eine Untergrenze, keine Vorhersage des tatsächlichen Verlaufs.
 */
export function mistakeClearDate(wrongPool = {}, today = todayISO()) {
  const entries = Object.values(wrongPool).filter(Boolean);
  if (entries.length === 0) return null;
  let maxDays = 0;
  for (const entry of entries) {
    const wait = Math.max(0, entry.due ? offsetDays(entry.due, today) : 0);
    const rest = remainingWait(mistakeBox(entry), MISTAKE_INTERVALS, MISTAKE_MAX_BOX);
    maxDays = Math.max(maxDays, wait + rest);
  }
  return { days: maxDays, iso: addDaysISO(maxDays, isoToDate(today)), count: entries.length };
}

/**
 * Frühestes Datum, an dem alle bereits begonnenen Karten die oberste
 * Leitner-Stufe erreicht hätten – ebenfalls bei lückenloser, fehlerfreier
 * Wiederholung. Noch nie bewertete Karten bleiben außen vor und werden
 * separat als `untouched` gemeldet, damit die Zahl nicht zu gut aussieht.
 */
export function cardMasteryDate(srs = {}, today = todayISO()) {
  let maxDays = 0;
  let started = 0;
  for (const [deckId, entries] of Object.entries(srs)) {
    const deck = getDeck(deckId);
    if (!deck) continue;
    for (const [rawIndex, entry] of Object.entries(entries ?? {})) {
      if (!deck.cards[Number(rawIndex)] || !entry) continue;
      started += 1;
      const box = Math.min(entry.box ?? 1, LEITNER_MAX_BOX);
      if (box >= LEITNER_MAX_BOX) continue;
      const wait = Math.max(0, entry.due ? offsetDays(entry.due, today) : 0);
      maxDays = Math.max(maxDays, wait + remainingWait(box, LEITNER_INTERVALS, LEITNER_MAX_BOX));
    }
  }
  if (started === 0) return null;
  return {
    days: maxDays,
    iso: addDaysISO(maxDays, isoToDate(today)),
    started,
    untouched: Math.max(0, totalCardCount() - started),
  };
}

/** Kurzes deutsches Datum („14.08.") für Beschriftungen. */
export const fmtForecastDate = (iso) =>
  isoToDate(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });

/** Wochentag-Kürzel („Mo") für die Achsenbeschriftung. */
export const fmtForecastWeekday = (iso) =>
  isoToDate(iso).toLocaleDateString("de-DE", { weekday: "short" });

/** Nur zur Wiederverwendung in Tests/Komponenten. */
export { isoToDate, offsetDays, toLocalISO };
