/**
 * Klausur-Simulator: erzeugt aus den gespeicherten Altklausuren eine
 * realistische Probeklausur. Das Themenprofil (Module, Aufgabentypen,
 * Schwierigkeit) kommt aus der lokalen Analyse; der MC-Teil zieht aus der
 * Fragenbank (Richtung klausurrelevanter Module geboostet), der offene
 * Teil formuliert Aufgaben zu den Top-Begriffen mit Musterlösung.
 */
import { aggregateExams, analyzeExam } from "./examAnalysis.js";
import { buildSmartQuiz } from "./questionBank.js";
import { GLOSSARY } from "../data/glossary.js";

const GLOSSARY_BY_LOWER = new Map(Object.entries(GLOSSARY).map(([k, v]) => [k.toLowerCase(), { term: k, def: v }]));

export const MC_POINTS = 2;
export const OPEN_POINTS = 6;

/** Größen-Presets der Probeklausur. */
export const EXAM_SIZES = [
  { id: "kurz", label: "Kurz", mc: 10, open: 2 },
  { id: "standard", label: "Standard", mc: 15, open: 4 },
  { id: "voll", label: "Voll", mc: 25, open: 6 },
];

/* Aufgaben-Formulierungen je Schwierigkeitsgrad (wie in echten Klausuren). */
const OPEN_TEMPLATES = {
  leicht: [
    (t) => `Definieren Sie den Begriff „${t}".`,
    (t) => `Nennen Sie die wichtigsten Merkmale von „${t}".`,
  ],
  mittel: [
    (t) => `Erläutern Sie „${t}".`,
    (t) => `Beschreiben Sie „${t}" an einem konkreten Beispiel.`,
  ],
  schwer: [
    (t) => `Diskutieren Sie die Bedeutung von „${t}" im E-Commerce.`,
    (t) => `Beurteilen Sie „${t}" kritisch – Chancen und Grenzen.`,
  ],
};

/**
 * Themenprofil über alle gespeicherten Klausuren.
 * @returns {{ examCount, moduleWeights: {modId: 0..1}, modules, taskTypes, difficultyMix, topTerms }}
 */
export function buildExamProfile(exams = []) {
  if (exams.length === 0) {
    return { examCount: 0, moduleWeights: {}, modules: [], taskTypes: [], difficultyMix: [], topTerms: [] };
  }
  const agg = aggregateExams(exams);
  const analyses = exams.map((e) => analyzeExam(e.text ?? ""));

  // Modul-Scores über alle Klausuren summieren, auf 0..1 normalisieren.
  const moduleScore = new Map();
  for (const a of analyses) {
    for (const m of a.modules) {
      const cur = moduleScore.get(m.module.id) ?? { module: m.module, score: 0 };
      cur.score += m.score;
      moduleScore.set(m.module.id, cur);
    }
  }
  const rankedModules = [...moduleScore.values()].sort((a, b) => b.score - a.score);
  const maxScore = rankedModules[0]?.score ?? 1;
  const moduleWeights = Object.fromEntries(rankedModules.map((m) => [m.module.id, m.score / maxScore]));

  const sumBy = (key) => {
    const acc = new Map();
    for (const a of analyses) {
      for (const item of a[key]) {
        const cur = acc.get(item.id) ?? { ...item, count: 0 };
        cur.count += item.count;
        acc.set(item.id, cur);
      }
    }
    return [...acc.values()].sort((a, b) => b.count - a.count);
  };

  return {
    examCount: exams.length,
    moduleWeights,
    modules: rankedModules,
    taskTypes: sumBy("taskTypes"),
    difficultyMix: sumBy("difficulty"),
    topTerms: agg.terms,
  };
}

/** Musterlösung eines Begriffs: Modul-Thema > Glossar > Lernkarte. */
function resolveModelAnswer(term, module) {
  const lower = term.toLowerCase();
  const topic = module?.topics?.find((t) => t.t.toLowerCase() === lower);
  if (topic) return topic.ex ? `${topic.def}\n\nBeispiel: ${topic.ex}` : topic.def;
  const glossary = GLOSSARY_BY_LOWER.get(lower);
  if (glossary) return glossary.def;
  const card = module?.cards?.find((c) => c.front.toLowerCase() === lower);
  if (card) return card.back;
  return null;
}

/** Offene Aufgaben aus den Top-Begriffen (max. 1 je Modul, mit Musterlösung). */
function buildOpenQuestions(profile, count) {
  // Schwierigkeits-Reihenfolge fürs Abwechseln der Formulierungen.
  const buckets = profile.difficultyMix
    .filter((d) => d.count > 0)
    .map((d) => d.id)
    .filter((id) => OPEN_TEMPLATES[id]);
  if (buckets.length === 0) buckets.push("mittel");

  const open = [];
  const usedModules = new Set();
  const usedTerms = new Set();
  for (const t of profile.topTerms) {
    if (open.length === count) break;
    const key = t.term.toLowerCase();
    if (usedTerms.has(key)) continue;
    const modId = t.module?.id;
    if (modId && usedModules.has(modId)) continue;
    const modelAnswer = resolveModelAnswer(t.term, t.module);
    if (!modelAnswer) continue;
    const bucket = buckets[open.length % buckets.length];
    const templates = OPEN_TEMPLATES[bucket];
    open.push({
      prompt: templates[open.length % templates.length](t.term),
      term: t.term,
      // volles Modul-Objekt: useOpenTopic braucht module.quiz für Deep-Links
      module: t.module ?? null,
      inGlossary: GLOSSARY_BY_LOWER.has(key),
      difficulty: bucket,
      points: OPEN_POINTS,
      modelAnswer,
    });
    usedTerms.add(key);
    if (modId) usedModules.add(modId);
  }
  return open;
}

/**
 * Erzeugt eine Probeklausur aus den gespeicherten Altklausuren.
 * @returns {null | { profile, mc, open, durationMin, maxPoints }}
 */
export function buildMockExam({ exams = [], progress = {}, size = "standard" } = {}) {
  const profile = buildExamProfile(exams);
  if (profile.examCount === 0) return null;

  const preset = EXAM_SIZES.find((s) => s.id === size) ?? EXAM_SIZES[1];
  let { mc: mcCount, open: openCount } = preset;
  // MC/offen-Verhältnis Richtung des dominanten Aufgabentyps verschieben.
  const dominant = profile.taskTypes[0]?.id;
  if (dominant === "mc") {
    mcCount = Math.round(mcCount * 1.2);
    openCount = Math.max(1, openCount - 1);
  } else if (dominant === "theorie" || dominant === "fall") {
    openCount += 1;
    mcCount = Math.max(5, Math.round(mcCount * 0.8));
  }

  const mc = buildSmartQuiz({
    count: mcCount,
    scope: "all",
    progress,
    moduleWeights: profile.moduleWeights,
  }).map((q) => ({ ...q, points: MC_POINTS }));
  const open = buildOpenQuestions(profile, openCount);

  const durationMin = Math.ceil((mc.length * 1.5 + open.length * 8) / 5) * 5;
  return {
    profile,
    mc,
    open,
    durationMin,
    maxPoints: mc.length * MC_POINTS + open.length * OPEN_POINTS,
  };
}

/* Deutsche Notentabelle (Prozent → Note). */
const GRADES = [
  [95, "1,0"], [90, "1,3"], [85, "1,7"], [80, "2,0"], [75, "2,3"],
  [70, "2,7"], [65, "3,0"], [60, "3,3"], [55, "3,7"], [50, "4,0"],
];

const GRADE_LABELS = [
  [1.5, "sehr gut"], [2.5, "gut"], [3.5, "befriedigend"], [4.05, "ausreichend"],
];

/**
 * Probeklausur benoten. `openScores`: Selbsteinschätzung je offener Aufgabe
 * (1 = gewusst, 0.5 = teilweise, 0 = nicht gewusst).
 */
export function gradeMockExam({ mcCorrect = 0, mcTotal = 0, openScores = [] } = {}) {
  const points = mcCorrect * MC_POINTS + openScores.reduce((sum, v) => sum + v * OPEN_POINTS, 0);
  const maxPoints = mcTotal * MC_POINTS + openScores.length * OPEN_POINTS;
  const pct = maxPoints === 0 ? 0 : Math.round((points / maxPoints) * 100);
  const grade = GRADES.find(([min]) => pct >= min)?.[1] ?? "5,0";
  const gradeNum = parseFloat(grade.replace(",", "."));
  const gradeLabel = GRADE_LABELS.find(([max]) => gradeNum <= max)?.[1] ?? "nicht bestanden";
  return { points: Math.round(points * 10) / 10, maxPoints, pct, grade, gradeLabel, passed: pct >= 50 };
}
