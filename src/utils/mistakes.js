/**
 * Leitner-Logik der Fehler-Kartei: falsch beantwortete Quizfragen wandern
 * durch 3 Boxen (sofort / +1 Tag / +3 Tage). Wer die oberste Stufe richtig
 * beantwortet, hat die Frage gemeistert; ein Fehler wirft zurück auf Box 1.
 * Alt-Einträge aus v3 (nur `streak`) werden verlustfrei abgebildet.
 */
import { MISTAKE_INTERVALS, MISTAKE_MAX_BOX } from "../constants/config.js";
import { addDaysISO, todayISO } from "./dates.js";

/** Box eines Eintrags; Alt-Einträge: streak 0 → Box 1, streak 1 → Box 2. */
export const mistakeBox = (entry) =>
  Math.min(entry?.box ?? (entry?.streak ?? 0) + 1, MISTAKE_MAX_BOX);

/** Fällig heute (oder früher); Einträge ohne due-Datum sofort. */
export const isMistakeDue = (entry, today = todayISO()) =>
  !entry?.due || entry.due <= today;

/**
 * Ergebnis einer Antwort: richtig hebt eine Box (oberste Stufe bestanden →
 * `mastered`), falsch setzt auf Box 1 zurück und macht sofort wieder fällig.
 */
export function reviewMistake(entry, wasCorrect, today = new Date()) {
  if (!wasCorrect) return { mastered: false, box: 1, due: addDaysISO(0, today) };
  const prevBox = mistakeBox(entry);
  if (prevBox >= MISTAKE_MAX_BOX) return { mastered: true };
  const box = prevBox + 1;
  return { mastered: false, box, due: addDaysISO(MISTAKE_INTERVALS[box], today) };
}

/**
 * Kartei in fällige und wartende Einträge teilen. Fällige: schwächste zuerst
 * (Box aufsteigend, dann meiste Fehlversuche); Wartende: nächste Fälligkeit zuerst.
 */
export function splitMistakes(pool, today = todayISO()) {
  const due = [];
  const waiting = [];
  for (const [key, entry] of Object.entries(pool ?? {})) {
    (isMistakeDue(entry, today) ? due : waiting).push({ key, ...entry });
  }
  due.sort(
    (a, b) =>
      mistakeBox(a) - mistakeBox(b) ||
      (b.misses ?? 0) - (a.misses ?? 0) ||
      a.key.localeCompare(b.key)
  );
  waiting.sort((a, b) => a.due.localeCompare(b.due) || a.key.localeCompare(b.key));
  return { due, waiting };
}
