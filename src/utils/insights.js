/**
 * Analytik-Hub: leitet aus den bestehenden Fortschritts-Slices
 * (Fehler-Kartei, Quiz-Bestwerte, SRS-Boxen, gelernten Karten) pro Modul
 * einen Schwäche-Score ab und liefert Querschnitts-Auswertungen
 * (Klausur-Häufigkeit, Brücken-Themen, Deck-Beschriftungen).
 * Kein eigener persistierter State – alles wird on demand berechnet.
 */
import { SEMESTERS } from "../data/semesters/index.js";
import { GENERAL_QUIZZES } from "../data/generalQuiz.js";
import { EXT_SUFFIX } from "../data/extendedQuiz.js";
import { termModuleEntries } from "./examAnalysis.js";
import { buildExamProfile } from "./examSimulator.js";
import { getDeck } from "./decks.js";
import { isMistakeDue } from "./mistakes.js";
import { todayISO } from "./dates.js";
import { LEITNER_MAX_BOX } from "../constants/config.js";

const ALL_MODULES = SEMESTERS.flatMap((s) => s.modules.map((m) => ({ ...m, semNr: s.nr })));
const MODULE_BY_ID = new Map(ALL_MODULES.map((m) => [m.id, m]));
const GENERAL_BY_ID = new Map(GENERAL_QUIZZES.map((d) => [d.id, d]));

/** `s2-mkt~ext` → `s2-mkt` (Quiz-Best-Keys der erweiterten Fragensätze). */
export const baseModId = (id = "") => id.endsWith(EXT_SUFFIX) ? id.slice(0, -EXT_SUFFIX.length) : id;

/**
 * Modul-ID aus einem Fehler-Kartei-Schlüssel (`recordMod#recordKey`).
 * Smart-Quiz-Karten kodieren das Modul im Key (`smart#c:s1-bwl:3`),
 * Glossar-Fragen (`smart#g:17`) haben keinen Modulbezug → null.
 * Der Schlüssel wird am ERSTEN `#` geteilt (recordKey enthält `:`).
 */
export function parseWrongPoolKey(key = "") {
  const hash = key.indexOf("#");
  if (hash <= 0) return null;
  const mod = key.slice(0, hash);
  const rest = key.slice(hash + 1);
  if (mod === "smart") {
    const [kind, cardMod] = rest.split(":");
    return kind === "c" && cardMod ? { modId: cardMod } : null;
  }
  return { modId: baseModId(mod) };
}

/**
 * Schwäche-Score je Modul (0..1, 1 = größte Schwäche) aus drei Signalen:
 * offene Fehler (45 %), Quiz-Bestwerte (35 %), Karten-/SRS-Stand (20 %).
 * Module ganz ohne Lernsignal werden ausgelassen (keine Rangliste aus Nichts).
 */
export function moduleWeakness({ wrongPool = {}, quizBest = {}, srs = {}, fcKnown = {} } = {}) {
  // Fehler je Modul einsammeln (fällige zählen doppelt).
  const mistakesByMod = new Map();
  for (const [key, entry] of Object.entries(wrongPool)) {
    const parsed = parseWrongPoolKey(key);
    if (!parsed || !MODULE_BY_ID.has(parsed.modId)) continue;
    const weight = isMistakeDue(entry) ? 2 : 1;
    mistakesByMod.set(parsed.modId, (mistakesByMod.get(parsed.modId) ?? 0) + weight);
  }

  // Quiz-Ergebnisse (Basis + Erweitert) je Modul bündeln.
  const quizByMod = new Map();
  for (const [key, best] of Object.entries(quizBest)) {
    const mod = baseModId(key);
    if (!MODULE_BY_ID.has(mod) || !best?.t) continue;
    const list = quizByMod.get(mod) ?? [];
    list.push(best.c / best.t);
    quizByMod.set(mod, list);
  }

  const results = [];
  for (const module of ALL_MODULES) {
    const mistakesRaw = mistakesByMod.get(module.id) ?? 0;
    const ratios = quizByMod.get(module.id);
    const srsEntries = Object.values(srs[module.id] ?? {});
    const known = (fcKnown[module.id] ?? []).length;
    const cardCount = getDeck(module.id)?.cards.length ?? 0;

    const hasSignal = mistakesRaw > 0 || ratios || srsEntries.length > 0 || known > 0;
    if (!hasSignal) continue;

    const mistakes = Math.min(1, mistakesRaw / 5);
    const quizWeak = ratios ? 1 - ratios.reduce((s, r) => s + r, 0) / ratios.length : 0.5;
    let srsWeak;
    if (srsEntries.length > 0) {
      const avgBox = srsEntries.reduce((s, e) => s + (e.box ?? 1), 0) / srsEntries.length;
      srsWeak = 1 - avgBox / LEITNER_MAX_BOX;
    } else if (cardCount > 0) {
      srsWeak = 1 - known / cardCount;
    } else {
      srsWeak = 0.5;
    }

    const score = 0.45 * mistakes + 0.35 * quizWeak + 0.2 * srsWeak;
    results.push({
      modId: module.id,
      module,
      score,
      parts: { mistakes, quiz: quizWeak, srs: srsWeak },
    });
  }
  return results.sort((a, b) => b.score - a.score);
}

/** Klausur-Häufigkeit je Modul (0..1) über alle gespeicherten Klausuren. */
export const examModuleFrequency = (exams = []) => buildExamProfile(exams).moduleWeights;

const MS_PER_DAY = 86400000;

/**
 * SRS 2.0: kombinierte Modul-Gewichte für die Smart-Quiz-Ziehung.
 * Schwäche (60 %) + Klausur-Häufigkeit (30 %) + „Difficulty Decay" (10 %):
 * je länger die fälligste SRS-Karte eines Moduls überzogen ist, desto
 * stärker rückt das Modul wieder in den Fokus (Sättigung bei 30 Tagen).
 */
export function smartModuleWeights({ wrongPool, quizBest, srs, fcKnown, exams } = {}) {
  const weights = {};
  for (const w of moduleWeakness({ wrongPool, quizBest, srs, fcKnown })) {
    weights[w.modId] = 0.6 * w.score;
  }
  for (const [modId, freq] of Object.entries(examModuleFrequency(exams))) {
    weights[modId] = (weights[modId] ?? 0) + 0.3 * freq;
  }
  const today = todayISO();
  for (const [deckId, entries] of Object.entries(srs ?? {})) {
    if (!MODULE_BY_ID.has(deckId)) continue;
    let maxOverdueDays = 0;
    for (const entry of Object.values(entries ?? {})) {
      if (entry?.due && entry.due <= today) {
        const days = (Date.parse(today) - Date.parse(entry.due)) / MS_PER_DAY;
        maxOverdueDays = Math.max(maxOverdueDays, days);
      }
    }
    if (maxOverdueDays > 0) {
      weights[deckId] = (weights[deckId] ?? 0) + 0.1 * Math.min(1, maxOverdueDays / 30);
    }
  }
  return weights;
}

/**
 * Brücken-Themen: Begriffe, die in ≥ 2 Modulen vorkommen (Themen, Karten,
 * kuratierte Prüfungsvokabeln). Sortiert nach Modulanzahl, dann Gewicht.
 */
export function bridgeTerms(limit = 12) {
  const byTerm = new Map();
  for (const { term, module, weight } of termModuleEntries()) {
    const key = term.toLowerCase();
    const cur = byTerm.get(key) ?? { term, modules: new Map(), weight: 0, inGlossary: false };
    if (module) cur.modules.set(module.id, module);
    else cur.inGlossary = true; // Eintrag ohne Modul = Glossarbegriff
    cur.weight = Math.max(cur.weight, weight);
    byTerm.set(key, cur);
  }
  return [...byTerm.values()]
    .filter((t) => t.modules.size >= 2)
    .sort((a, b) => b.modules.size - a.modules.size || b.weight - a.weight || a.term.localeCompare(b.term, "de"))
    .slice(0, limit)
    .map((t) => ({
      term: t.term,
      modules: [...t.modules.values()],
      inGlossary: t.inGlossary,
    }));
}

/** Lesbare Beschriftung eines Quiz-/Deck-Schlüssels (behebt rohe IDs in Listen). */
export function deckLabel(id = "") {
  const base = baseModId(id);
  const ext = base !== id;
  const module = MODULE_BY_ID.get(base);
  if (module) return `${module.code} · ${module.name}${ext ? " – Erweitert" : ""}`;
  const general = GENERAL_BY_ID.get(id);
  if (general) return `${general.icon} ${general.name}`;
  if (id === "glossar") return "Glossar";
  return id;
}
