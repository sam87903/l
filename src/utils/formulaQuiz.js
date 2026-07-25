/**
 * Formel-Trainer: macht aus der Formelsammlung abfragbare Quizfragen.
 *
 * Die 47 Formeln waren bisher reines Nachschlagewerk mit Rechner – man konnte
 * sie ansehen, aber nicht üben. Hier entstehen drei Fragetypen im Format der
 * bestehenden Quiz-Engine, sodass falsche Antworten automatisch in der
 * Fehler-Kartei landen.
 */
import { FORMULAS, FORMULA_CATS } from "../data/formulas.js";
import { shuffleArray } from "./misc.js";

/** Wählbare Länge einer Trainingsrunde. */
export const FORMULA_QUIZ_SIZES = [5, 10, 15];
/** Kennung für die Fehler-Kartei (siehe MistakeTrainer). */
export const FORMULA_RECORD_MOD = "formel";

const DISTRACTORS = 3;

const fmtNum = (n, dec = 2) =>
  new Intl.NumberFormat("de-DE", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);

const withUnit = (text, unit) => (unit ? `${text} ${unit}` : text);

/**
 * Drei Ablenker ziehen – bevorzugt aus derselben Kategorie, weil Formeln
 * verwandter Themen schwerer zu unterscheiden sind als völlig fremde.
 */
function pickDistractors(formula, valueOf) {
  const correct = valueOf(formula);
  const seen = new Set([correct]);
  const out = [];
  const sameCat = FORMULAS.filter((f) => f.id !== formula.id && f.cat === formula.cat);
  const others = FORMULAS.filter((f) => f.id !== formula.id && f.cat !== formula.cat);
  for (const f of [...shuffleArray(sameCat), ...shuffleArray(others)]) {
    const text = valueOf(f);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
    if (out.length === DISTRACTORS) break;
  }
  return out;
}

/** Aus richtiger Antwort + Ablenkern eine gemischte Frage bauen. */
function assemble(correctText, distractors, rest) {
  if (distractors.length < DISTRACTORS) return null;
  const options = shuffleArray([correctText, ...distractors]);
  return { ...rest, options, correct: options.indexOf(correctText) };
}

/** Typ 1: Name gegeben, Formel gesucht. */
function makeFormulaQuestion(f) {
  return assemble(f.formula, pickDistractors(f, (x) => x.formula), {
    q: `Wie berechnest du: ${f.name}?`,
    explain: `${f.name}: ${f.formula} — ${f.desc}`,
    topic: f.name,
  });
}

/** Typ 2: Formel gegeben, Bedeutung gesucht. */
function makeNameQuestion(f) {
  return assemble(f.name, pickDistractors(f, (x) => x.name), {
    q: `Welche Größe berechnet diese Formel?\n${f.formula}`,
    explain: `${f.formula} berechnet: ${f.name}. ${f.desc}`,
    topic: f.name,
  });
}

/**
 * Wertebereiche je Eingabefeld, nach Größenordnung des Fachbegriffs.
 *
 * Die Reihenfolge ist bedeutsam: Die erste passende Regel gewinnt, damit
 * „Bestellkosten/Bestellung" nicht in der allgemeinen Kosten-Regel landet.
 * Ohne diese Abstufung entstehen Aufgaben wie „541 € Umsatz bei 626
 * Bestellungen" – rechnerisch korrekt, fachlich Unsinn.
 */
const RANGES = [
  [/lieferzeit/, [2, 20]],
  [/tage/, [30, 360]],
  [/jahresbedarf/, [2000, 40000]],
  // Wortgrenze nötig: „Jahresbedarf" darf nicht als Zeitraum gelesen werden.
  [/\bjahre\b|nutzungsdauer|laufzeit|kundenlebensdauer/, [2, 10]],
  [/impression/, [20000, 400000]],
  [/besucher/, [2000, 40000]],
  [/klicks/, [200, 4000]],
  [/warenkörbe|warenkorb/, [3000, 20000]],
  [/versendete|versandte|artikel/, [3000, 20000]],
  [/retouren/, [20, 400]],
  [/neukunden/, [50, 800]],
  [/bestellkosten/, [20, 150]],
  // Kaufhäufigkeit je Kunde – nicht zu verwechseln mit Bestellungen gesamt.
  [/käufe pro jahr|kauffrequenz/, [2, 12]],
  [/bestellung|käufe/, [200, 2000]],
  [/tagesverbrauch/, [5, 60]],
  [/sicherheitsbestand/, [50, 500]],
  [/lagerbestand/, [5000, 60000]],
  [/umschlagshäufigkeit/, [2, 12]],
  [/preis/, [10, 200]],
  [/bezugskosten/, [20, 300]],
  [/restwert/, [500, 5000]],
  // Gewinn bewusst kleiner als Umsatz/Kapital – sonst entstehen Aufgaben
  // mit über 100 % Umsatzrendite, was es nicht geben kann.
  [/gewinn/, [2000, 40000]],
  [/rückfluss/, [5000, 60000]],
  [/menge|anzahl|stück|ausbringung|faktoreinsatz/, [50, 2000]],
  [/anschaffung|kapital|darlehen|umsatz|kosten|ertrag|aufwand|steuer|brutto|grundwert|umlaufverm|wareneinsatz|verbindlichk/, [50000, 400000]],
];

function rangeFor(input) {
  if (String(input.unit ?? "").includes("%")) return [2, 25];
  const label = String(input.label ?? "").toLowerCase();
  for (const [pattern, range] of RANGES) {
    if (pattern.test(label)) return range;
  }
  return [20, 900];
}

const randInt = ([min, max]) => min + Math.floor(Math.random() * (max - min + 1));

/**
 * Ist das Ergebnis fachlich brauchbar? Verhindert Aufgaben mit negativen
 * Handelsspannen, Cent-Beträgen als Ø-Bestellwert oder Prozentwerten
 * jenseits jeder Praxis. Unbrauchbare Würfe werden neu gezogen.
 */
function plausible(result, out) {
  if (!Number.isFinite(result)) return false;
  const unit = String(out.unit ?? "");
  if (unit.includes("%")) return result >= 0.1 && result <= 1000;
  if (unit.includes("€")) return result >= 1;
  return Math.abs(result) >= 0.01;
}

/**
 * Typ 3: echtes Rechnen mit erzeugten Werten.
 *
 * Bewusst streng abgesichert: Nur Formeln mit reinen Zahlenfeldern und einem
 * einzelnen, endlichen Ergebnis kommen infrage. Alles andere (Freitextfelder,
 * mehrzeilige Kalkulationen, Division durch null) liefert null und wird
 * übersprungen, statt eine kaputte Frage zu erzeugen.
 */
function makeCalcQuestion(f) {
  if (typeof f.calc !== "function" || !f.out) return null;
  if (!Array.isArray(f.inputs) || f.inputs.length === 0) return null;
  if (f.inputs.some((i) => i.free)) return null;

  // Mehrere Versuche: Manche Formeln (Handelsspanne, Wachstum) brauchen ein
  // bestimmtes Verhältnis der Werte, damit das Ergebnis Sinn ergibt.
  let values = null;
  let result = null;
  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = Object.fromEntries(f.inputs.map((i) => [i.k, String(randInt(rangeFor(i)))]));
    let value;
    try {
      value = f.calc(candidate);
    } catch {
      return null;
    }
    if (typeof value === "number" && plausible(value, f.out)) {
      values = candidate;
      result = value;
      break;
    }
  }
  if (values === null) return null;

  const dec = f.out.dec ?? 2;
  const correctText = withUnit(fmtNum(result, dec), f.out.unit);

  // Ablenker aus typischen Rechenfehlern: Faktor vertauscht, halbiert,
  // verdoppelt, um zehn Prozent daneben.
  const seen = new Set([correctText]);
  const distractors = [];
  for (const factor of shuffleArray([0.5, 2, 1.1, 0.9, 1.25, 0.75, 10, 0.1])) {
    const candidate = withUnit(fmtNum(result * factor, dec), f.out.unit);
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    distractors.push(candidate);
    if (distractors.length === DISTRACTORS) break;
  }

  const given = f.inputs
    .map((i) => `${i.label}${i.unit ? ` (${i.unit})` : ""} = ${values[i.k]}`)
    .join(", ");

  return assemble(correctText, distractors, {
    q: `${f.name} berechnen: ${given}. Wie lautet das Ergebnis?`,
    explain: `${f.formula} → ${correctText}. ${f.desc}`,
    topic: f.name,
  });
}

const MAKERS = {
  formula: makeFormulaQuestion,
  name: makeNameQuestion,
  calc: makeCalcQuestion,
};

/**
 * Trainingsrunde zusammenstellen.
 *
 * @param {object}  opts
 * @param {number}  opts.count  Anzahl Fragen
 * @param {string}  opts.cat    Kategorie-ID oder "alle"
 * @param {boolean} opts.withCalc  Rechenfragen zulassen
 * @returns {Array} Fragen im Format der Quiz-Engine, inkl. recordMod/recordKey
 */
export function buildFormulaQuiz({ count = 10, cat = "alle", withCalc = true } = {}) {
  const pool = cat === "alle" ? FORMULAS : FORMULAS.filter((f) => f.cat === cat);
  if (pool.length === 0) return [];

  const kinds = withCalc ? ["formula", "name", "calc"] : ["formula", "name"];
  const questions = [];
  const used = new Set();

  // Jede Formel darf pro Runde nur einmal drankommen, solange der Vorrat reicht.
  for (const f of shuffleArray(pool)) {
    if (questions.length >= count) break;
    for (const kind of shuffleArray(kinds)) {
      const key = `${kind}:${f.id}`;
      if (used.has(key)) continue;
      const question = MAKERS[kind](f);
      if (!question) continue;
      used.add(key);
      questions.push({
        ...question,
        recordMod: FORMULA_RECORD_MOD,
        recordKey: key,
      });
      break;
    }
  }

  // Zu kleine Kategorie: mit weiteren Fragetypen derselben Formeln auffüllen.
  if (questions.length < count) {
    for (const f of shuffleArray(pool)) {
      if (questions.length >= count) break;
      for (const kind of kinds) {
        const key = `${kind}:${f.id}`;
        if (used.has(key)) continue;
        const question = MAKERS[kind](f);
        if (!question) continue;
        used.add(key);
        questions.push({ ...question, recordMod: FORMULA_RECORD_MOD, recordKey: key });
        break;
      }
    }
  }

  return questions.slice(0, count);
}

/** Kategorien mit Formelanzahl – für die Auswahl im Trainer. */
export const FORMULA_QUIZ_CATS = FORMULA_CATS.map((c) => ({
  ...c,
  count: FORMULAS.filter((f) => f.cat === c.id).length,
})).filter((c) => c.count > 0);
