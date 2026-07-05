/**
 * Smart-Quiz-Generator: erzeugt aus Modul-Quizfragen, Lernkarten und
 * Glossar hunderte Fragen und gewichtet die Auswahl nach Schwächen
 * (Fehler-Kartei > ungelernte Karten/Begriffe > Rest).
 */
import { SEMESTERS } from "../data/semesters/index.js";
import { GLOSSARY } from "../data/glossary.js";
import { shuffleArray } from "./misc.js";
import { isMistakeDue } from "./mistakes.js";

const OPTION_LENGTH = 150;
const EXPLAIN_LENGTH = 220;
const DISTRACTOR_COUNT = 3;

const truncate = (text, max) =>
  text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;

const GLOSSARY_TERMS = Object.keys(GLOSSARY).sort((a, b) => a.localeCompare(b, "de"));
const ALL_MODULES = SEMESTERS.flatMap((s) => s.modules.map((m) => ({ ...m, semNr: s.nr })));

/** „Was bedeutet X?" – richtige Definition + 3 fremde Definitionen. */
function makeDefinitionQuestion(term, definition, distractorPool) {
  const correctText = truncate(definition, OPTION_LENGTH);
  const distractors = [];
  const seen = new Set([correctText]);
  for (const candidate of shuffleArray(distractorPool)) {
    const text = truncate(candidate, OPTION_LENGTH);
    if (seen.has(text)) continue;
    seen.add(text);
    distractors.push(text);
    if (distractors.length === DISTRACTOR_COUNT) break;
  }
  const options = shuffleArray([correctText, ...distractors]);
  return {
    q: `Was bedeutet „${term}"?`,
    options,
    correct: options.indexOf(correctText),
    explain: `${term}: ${truncate(definition, EXPLAIN_LENGTH)}`,
    topic: term,
  };
}

/** Umkehrrichtung: Definition gegeben – welcher Begriff passt? */
function makeTermQuestion(term, definition, distractorTerms) {
  const distractors = shuffleArray(distractorTerms).slice(0, DISTRACTOR_COUNT);
  const options = shuffleArray([term, ...distractors]);
  return {
    q: `Welcher Fachbegriff wird beschrieben? „${truncate(definition, 170)}"`,
    options,
    correct: options.indexOf(term),
    explain: `Richtig: ${term}.`,
    topic: term,
  };
}

/** Vollständige Fragenbank (Items materialisieren erst per make()). */
function buildBank() {
  const bank = [];

  for (const mod of ALL_MODULES) {
    (mod.quiz ?? []).forEach((q, qi) => {
      bank.push({
        id: `s:${mod.id}:${qi}`,
        kind: "static",
        modId: mod.id,
        semNr: mod.semNr,
        topic: null,
        recordMod: mod.id,
        recordKey: qi,
        make: () => ({ ...q }),
      });
    });
  }

  const allCards = ALL_MODULES.flatMap((mod) =>
    (mod.cards ?? []).map((card, ci) => ({ ...card, modId: mod.id, semNr: mod.semNr, ci }))
  );
  for (const card of allCards) {
    bank.push({
      id: `c:${card.modId}:${card.ci}`,
      kind: "card",
      modId: card.modId,
      semNr: card.semNr,
      cardIndex: card.ci,
      topic: card.front,
      recordMod: "smart",
      recordKey: `c:${card.modId}:${card.ci}`,
      make: () =>
        makeDefinitionQuestion(
          card.front,
          card.back,
          allCards.filter((c) => c.front !== card.front).map((c) => c.back)
        ),
    });
  }

  GLOSSARY_TERMS.forEach((term, index) => {
    const others = GLOSSARY_TERMS.filter((t) => t !== term);
    bank.push({
      id: `g:${index}`,
      kind: "glossar",
      modId: "glossar",
      glossarIndex: index,
      topic: term,
      recordMod: "smart",
      recordKey: `g:${index}`,
      make: () => makeDefinitionQuestion(term, GLOSSARY[term], others.map((t) => GLOSSARY[t])),
    });
    bank.push({
      id: `gr:${index}`,
      kind: "glossar",
      modId: "glossar",
      glossarIndex: index,
      topic: term,
      recordMod: "smart",
      recordKey: `gr:${index}`,
      make: () => makeTermQuestion(term, GLOSSARY[term], others),
    });
  });

  return bank;
}

const BANK = buildBank();

export const QUESTION_BANK_SIZE = BANK.length;

/** Schwächen-Gewicht eines Bank-Items (höher = wird eher gezogen). */
function weightFor(item, { wrongPool = {}, fcKnown = {}, quizBest = {} }) {
  const mistake = wrongPool[`${item.recordMod}#${item.recordKey}`];
  // Fällige Fehler hart drillen; wartende nur leicht (Leitner-Abstand wahren).
  if (mistake) return isMistakeDue(mistake) ? 8 : 2;
  if (item.kind === "static") {
    const best = quizBest[item.modId];
    return !best || best.c < best.t ? 4 : 1;
  }
  if (item.kind === "card") {
    return (fcKnown[item.modId] ?? []).includes(item.cardIndex) ? 1 : 3;
  }
  // Glossar: „gewusst" über den Lernmodus-Stapel (sortierte Begriffsliste)
  return (fcKnown.glossar ?? []).includes(item.glossarIndex) ? 1 : 3;
}

/**
 * Stellt ein Smart-Quiz zusammen (gewichtete Ziehung ohne Zurücklegen).
 * @param {object} opts { count, scope: "all"|"weak"|"sem1", progress }
 */
export function buildSmartQuiz({ count = 10, scope = "all", progress = {} } = {}) {
  let pool = BANK;
  if (scope === "sem1") {
    const sem1Ids = new Set(ALL_MODULES.filter((m) => m.semNr === 1).map((m) => m.id));
    pool = BANK.filter((item) => sem1Ids.has(item.modId));
  }
  let weighted = pool.map((item) => ({ item, weight: weightFor(item, progress) }));
  if (scope === "weak") {
    const onlyWeak = weighted.filter((w) => w.weight > 1);
    if (onlyWeak.length >= Math.min(count, 3)) weighted = onlyWeak;
  }

  const picked = [];
  const working = [...weighted];
  while (picked.length < count && working.length > 0) {
    const total = working.reduce((sum, w) => sum + w.weight, 0);
    let r = Math.random() * total;
    let index = 0;
    for (; index < working.length; index++) {
      r -= working[index].weight;
      if (r <= 0) break;
    }
    const [chosen] = working.splice(Math.min(index, working.length - 1), 1);
    picked.push(chosen.item);
  }

  return picked.map((item) => ({
    ...item.make(),
    topic: item.topic ?? undefined,
    recordMod: item.recordMod,
    recordKey: item.recordKey,
  }));
}

/** Antwortoptionen einer statischen Frage mischen (Index wird remappt). */
export function shuffleQuestionOptions(question) {
  const order = shuffleArray(question.options.map((_, i) => i));
  const remap = new Map(order.map((oldIndex, newIndex) => [oldIndex, newIndex]));
  return {
    ...question,
    options: order.map((i) => question.options[i]),
    correct: remap.get(question.correct),
    corrects: Array.isArray(question.corrects)
      ? question.corrects.map((c) => remap.get(c))
      : undefined,
  };
}
