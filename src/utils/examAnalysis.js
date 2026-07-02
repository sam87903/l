/**
 * Lokale Altklausur-Analyse: erkennt Themencluster, Aufgabentypen,
 * Schwierigkeitsniveau und wiederkehrende Muster über mehrere Klausuren.
 */
import { SEMESTERS } from "../data/semesters/index.js";
import { GLOSSARY } from "../data/glossary.js";

const ALL_MODULES = SEMESTERS.flatMap((s) => s.modules.map((m) => ({ ...m, semNr: s.nr })));

/* Suchindex: Themen-Titel + Lernkarten-Begriffe (→ Modul) + Glossarbegriffe */
function buildIndex() {
  const entries = [];
  for (const mod of ALL_MODULES) {
    for (const t of mod.topics ?? []) {
      entries.push({ term: t.t, module: mod, weight: 3 });
    }
    for (const c of mod.cards ?? []) {
      if (c.front.length >= 3) entries.push({ term: c.front, module: mod, weight: 2 });
    }
  }
  for (const term of Object.keys(GLOSSARY)) {
    if (term.length >= 3) entries.push({ term, module: null, weight: 1 });
  }
  return entries;
}
const INDEX = buildIndex();

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function countMatches(textLower, term) {
  try {
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
      count: h.count,
      recurrence: h.recurrence,
      probability: Math.max(8, Math.round((h.score / maxScore) * 100)),
    })),
    recurring,
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
