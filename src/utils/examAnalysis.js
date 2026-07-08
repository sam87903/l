/**
 * Lokale Altklausur-Analyse: erkennt Themencluster, Aufgabentypen,
 * Schwierigkeitsniveau und wiederkehrende Muster über mehrere Klausuren.
 */
import { SEMESTERS } from "../data/semesters/index.js";
import { GLOSSARY } from "../data/glossary.js";

const ALL_MODULES = SEMESTERS.flatMap((s) => s.modules.map((m) => ({ ...m, semNr: s.nr })));
const MODULE_BY_ID = new Map(ALL_MODULES.map((m) => [m.id, m]));
/* Glossar-Schlüssel case-insensitiv, damit z. B. „kritische Masse" zur
   Definition „Kritische Masse" verlinkt. */
const GLOSSARY_KEYS = new Set(Object.keys(GLOSSARY).map((k) => k.toLowerCase()));
const inGlossary = (term) => GLOSSARY_KEYS.has(term.toLowerCase());

/* Begriffe, die zwar im Glossar stehen (z. B. Java-Schlüsselwörter), als
   „Top-Prüfungsthema" aber nur Rauschen sind bzw. fälschlich in Komposita
   greifen (z. B. „break" in „Break-even"). */
const STOPWORDS = new Set(["break", "continue", "goto", "print", "and", "or"]);

/**
 * Kuratierte Prüfungsvokabeln echter Klausuren, die (noch) nicht als
 * Modulthema/Lernkarte/Glossarbegriff erfasst sind – jeweils dem inhaltlich
 * passenden Modul zugeordnet, damit sie erkannt UND zum Lernen verlinkt
 * werden. Format: [Begriff (wie er in Klausuren steht), Modul-ID].
 */
const EXAM_KEYWORDS = [
  // Grundlagen E-Commerce (s1-ecm)
  ["E-Marketplace", "s1-ecm"], ["E-Marktplatz", "s1-ecm"], ["Online-Marktplatz", "s1-ecm"],
  ["Betreiber-Modell", "s1-ecm"], ["Dienstleister-Modell", "s1-ecm"], ["Partner-Modell", "s1-ecm"],
  ["Application Service Providing", "s1-ecm"], ["ASP", "s1-ecm"], ["eMatching", "s1-ecm"],
  ["Chicken-and-Egg-Problem", "s1-ecm"], ["Kritische Masse", "s1-ecm"], ["Netzeffekte", "s1-ecm"],
  ["Lastenheft", "s1-ecm"], ["Realgüterstrom", "s1-ecm"], ["Nominalgüterstrom", "s1-ecm"],
  ["Informationsstrom", "s1-ecm"], ["Frontend", "s1-ecm"], ["Backend", "s1-ecm"],
  ["Warenwirtschaftssystem", "s1-ecm"], ["Powershopping", "s1-ecm"], ["CMS-System", "s1-ecm"],
  // Marketing (s2-mkt)
  ["Customer Journey", "s2-mkt"], ["Suchmaschinenoptimierung", "s2-mkt"], ["SEO", "s2-mkt"],
  ["SEA", "s2-mkt"], ["SEM", "s2-mkt"], ["Affiliate-Marketing", "s2-mkt"],
  ["Permission Marketing", "s2-mkt"], ["Opt-In", "s2-mkt"], ["Double Opt-In", "s2-mkt"],
  ["Skyscraper", "s2-mkt"], ["Pay per Click", "s2-mkt"], ["Pay per Sale", "s2-mkt"],
  ["Pay per Lead", "s2-mkt"], ["Pay per View", "s2-mkt"], ["Conversion", "s2-mkt"],
  // Prozessmanagement im E-Commerce (s2-pme)
  ["E-Fulfillment", "s2-pme"], ["Retourenmanagement", "s2-pme"], ["Distributionslogistik", "s2-pme"],
  ["Payment-Service-Provider", "s2-pme"], ["Lastschriftverfahren", "s2-pme"], ["Warenkorb", "s2-pme"],
  // Geschäftsmodelle im E-Commerce (s5-ebm)
  ["PurePlayer", "s5-ebm"], ["Pure Player", "s5-ebm"], ["Long Tail", "s5-ebm"],
  ["Plattformökonomie", "s5-ebm"], ["Vergleichsportal", "s5-ebm"], ["Teufelskreis", "s5-ebm"],
  ["Marktplatzbetreiber", "s5-ebm"],
  // Handelsmanagement (s1-hbl)
  ["Eigenmarke", "s1-hbl"], ["Private Label", "s1-hbl"], ["Absatzkanal", "s1-hbl"],
  ["Handelsmarke", "s1-hbl"],
  // Investition & Finanzierung (s3-bwl6)
  ["ROI", "s3-bwl6"],
];

/* Suchindex: Themen-Titel + Lernkarten-Begriffe (→ Modul) + Glossarbegriffe
   + kuratierte Prüfungsvokabeln. Stoppwörter werden ausgelassen. */
function buildIndex() {
  const entries = [];
  const push = (term, module, weight) => {
    if (term.length >= 3 && !STOPWORDS.has(term.toLowerCase())) entries.push({ term, module, weight });
  };
  for (const mod of ALL_MODULES) {
    for (const t of mod.topics ?? []) push(t.t, mod, 3);
    for (const c of mod.cards ?? []) push(c.front, mod, 2);
  }
  for (const term of Object.keys(GLOSSARY)) push(term, null, 1);
  for (const [term, moduleId] of EXAM_KEYWORDS) push(term, MODULE_BY_ID.get(moduleId) ?? null, 3);
  return entries;
}
const INDEX = buildIndex();

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function countMatches(textLower, term) {
  try {
    // Wortgrenze über Buchstaben: trennt Wörter sauber (z. B. „AG" nicht in
    // „AGB"), lässt aber zusammengesetzte Fachbegriffe an Bindestrichen zu
    // (z. B. „E-Marketplace" in „E-Marketplace-Management"). Reine Rausch-
    // Treffer wie „break" in „Break-even" fängt stattdessen die STOPWORDS-Liste.
    const re = new RegExp(`(?<![a-zä-üß])${escapeRe(term.toLowerCase())}(?![a-zä-üß])`, "g");
    return (textLower.match(re) ?? []).length;
  } catch {
    return 0;
  }
}

const TASK_TYPES = [
  { id: "rechnen", label: "Rechenaufgaben", icon: "🧮", re: /\b(berechnen|ermitteln|kalkulieren|wie hoch|in prozent|€|abschreibung von|buchungssatz)\b/gi },
  { id: "theorie", label: "Theoriefragen", icon: "📖", re: /\b(nennen|erläutern|beschreiben|definieren|erklären|skizzieren|grenzen sie .{0,20}ab|unterschied zwischen)\b/gi },
  { id: "fall", label: "Fallstudien", icon: "🏢", re: /\b(fallstudie|szenario|praxisfall|folgende situation|das unternehmen|ein händler|ein online-shop)\b/gi },
  { id: "mc", label: "Multiple Choice", icon: "☑️", re: /\b(kreuzen sie|multiple.?choice|richtig oder falsch|welche aussage)\b|(^|\n)\s*[a-e]\)\s/gi },
];

const DIFFICULTY = [
  { id: "leicht", label: "leicht", re: /\b(nennen|aufzählen|definieren|geben sie .{0,15}an|was bedeutet)\b/gi },
  { id: "mittel", label: "mittel", re: /\b(erklären|erläutern|beschreiben|vergleichen|skizzieren|unterscheiden)\b/gi },
  { id: "schwer", label: "schwer", re: /\b(berechnen|analysieren|bewerten|beurteilen|entwickeln|diskutieren|begründen|interpretieren)\b/gi },
];

/**
 * @param {string} text        Klausurtext
 * @param {string[]} otherTexts Texte weiterer gespeicherter Klausuren (Musteranalyse)
 */
export function analyzeExam(text, otherTexts = []) {
  const lower = text.toLowerCase();
  const othersLower = otherTexts.map((t) => t.toLowerCase());

  // 1) Themencluster
  const topicHits = [];
  const moduleScore = new Map();
  for (const entry of INDEX) {
    const count = countMatches(lower, entry.term);
    if (count === 0) continue;
    const recurrence = othersLower.filter((t) => countMatches(t, entry.term) > 0).length;
    topicHits.push({ term: entry.term, count, weight: entry.weight, module: entry.module, recurrence });
    if (entry.module) {
      const cur = moduleScore.get(entry.module.id) ?? { module: entry.module, score: 0, terms: [] };
      cur.score += count * entry.weight;
      cur.terms.push(entry.term);
      moduleScore.set(entry.module.id, cur);
    }
  }
  const modules = [...moduleScore.values()].sort((a, b) => b.score - a.score).slice(0, 5);

  // 2) Aufgabentypen
  const taskTypes = TASK_TYPES.map((t) => ({ ...t, count: (text.match(t.re) ?? []).length }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);

  // 3) Schwierigkeitsniveau
  const difficulty = DIFFICULTY.map((d) => ({ ...d, count: (text.match(d.re) ?? []).length }));
  const diffTotal = difficulty.reduce((n, d) => n + d.count, 0) || 1;
  const overall = [...difficulty].sort((a, b) => b.count - a.count)[0];

  // 4) Top-Themen mit Prüfungswahrscheinlichkeit (Häufigkeit + Wiederkehr)
  const scored = topicHits
    .map((h) => ({ ...h, score: h.count * h.weight + h.recurrence * 4 }))
    .sort((a, b) => b.score - a.score);
  const seen = new Set();
  const top10 = [];
  for (const hit of scored) {
    const key = hit.term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    top10.push(hit);
    if (top10.length === 10) break;
  }
  const maxScore = top10[0]?.score ?? 1;

  // 5) Wiederkehrende Muster (in ≥1 weiterer Klausur)
  const recurring = scored
    .filter((h) => h.recurrence > 0)
    .slice(0, 8)
    .map((h) => ({ term: h.term, inExams: h.recurrence + 1, total: otherTexts.length + 1 }));

  // 6) Stolperstellen: schwere Verben + gewichtige Themen
  const heavyShare = Math.round(((difficulty.find((d) => d.id === "schwer")?.count ?? 0) / diffTotal) * 100);

  return {
    words: text.split(/\s+/).length,
    modules,
    taskTypes,
    difficulty: difficulty.map((d) => ({ ...d, share: Math.round((d.count / diffTotal) * 100) })),
    overallDifficulty: overall?.count ? overall.label : "unbekannt",
    heavyShare,
    top10: top10.map((h, i) => ({
      rank: i + 1,
      term: h.term,
      module: h.module,
      inGlossary: inGlossary(h.term),
      count: h.count,
      recurrence: h.recurrence,
      probability: Math.max(8, Math.round((h.score / maxScore) * 100)),
    })),
    recurring,
  };
}

/**
 * Aggregiert die prüfungsrelevantesten Themen über ALLE gespeicherten
 * Klausuren (Gesamt-Prüfungsradar). Ein Thema wiegt umso schwerer, je in
 * mehr Klausuren es vorkommt – das ist der eigentliche Mehrwert beim
 * Vergleich mehrerer Altklausuren.
 * @param {{name?:string,text:string}[]} exams
 */
export function aggregateExams(exams = []) {
  const total = exams.length;
  if (total === 0) return { total: 0, terms: [] };

  const agg = new Map(); // key: term.toLowerCase → Aggregat
  exams.forEach((exam, idx) => {
    const lower = (exam.text ?? "").toLowerCase();
    for (const entry of INDEX) {
      const count = countMatches(lower, entry.term);
      if (count === 0) continue;
      const key = entry.term.toLowerCase();
      const cur = agg.get(key) ?? {
        term: entry.term,
        module: entry.module,
        weight: entry.weight,
        inGlossary: inGlossary(entry.term),
        mentions: 0,
        exams: new Set(),
      };
      cur.mentions += count;
      cur.exams.add(idx);
      if (!cur.module && entry.module) cur.module = entry.module;
      cur.weight = Math.max(cur.weight, entry.weight);
      agg.set(key, cur);
    }
  });

  // Score: Vorkommen in mehreren Klausuren dominiert, Häufigkeit gewichtet.
  const ranked = [...agg.values()]
    .map((v) => ({ ...v, score: v.exams.size * 100 + v.mentions * v.weight }))
    .sort((a, b) => b.score - a.score);
  const maxScore = ranked[0]?.score ?? 1;

  return {
    total,
    terms: ranked.slice(0, 12).map((v, i) => ({
      rank: i + 1,
      term: v.term,
      module: v.module,
      inGlossary: v.inGlossary,
      inExams: v.exams.size,
      total,
      mentions: v.mentions,
      probability: Math.max(10, Math.round((v.score / maxScore) * 100)),
    })),
  };
}

/** Prompt für die externe KI-Tiefenanalyse einer Altklausur. */
export function buildExamPrompt(examName, text) {
  return `Du bist ein Prüfungsanalyse-System für Hochschul-Altklausuren. Der Nutzer lädt eine Klausur (Text oder PDF-Inhalt) hoch. Deine Aufgabe ist es, die Klausur systematisch zu analysieren und prüfungsrelevante Muster zu erkennen.

Analysiere:
1. Themencluster – Welche Themen kommen am häufigsten vor? Welche Kapitel des Moduls werden geprüft?
2. Aufgabentypen – Rechenaufgaben, Theoriefragen, Fallstudien, Multiple Choice etc.
3. Schwierigkeitsniveau – leicht / mittel / schwer, typische Stolperstellen
4. Wiederkehrende Muster – ähnliche Aufgaben aus anderen Jahren, typische Fragestellungen
5. Lernstrategie – Was sollte der Nutzer priorisiert lernen? Welche Aufgabenarten sollte er üben?

Erstelle außerdem eine "Top 10 Prüfungswahrscheinlichkeit"-Liste von Themen.
Antworte strukturiert.

KONTEXT: Studiengang B.Sc. E-Commerce, Hochschule Ruhr West (BPO 02.06.2023).

KLAUSUR: ${examName}
---
${text}`;
}
