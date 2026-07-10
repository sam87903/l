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
  ["ROI", "s3-bwl6"], ["Kapitalwert", "s3-bwl6"], ["Amortisation", "s3-bwl6"],
  // Datenbanken (s2-dat)
  ["ER-Modell", "s2-dat"], ["Primärschlüssel", "s2-dat"], ["Fremdschlüssel", "s2-dat"],
  ["Normalisierung", "s2-dat"], ["Referenzielle Integrität", "s2-dat"], ["NoSQL", "s2-dat"],
  ["Relationale Algebra", "s2-dat"], ["Kardinalität", "s2-dat"], ["Datenbankschema", "s2-dat"],
  // Angewandte Statistik (s3-stat)
  ["Standardabweichung", "s3-stat"], ["Normalverteilung", "s3-stat"], ["Hypothesentest", "s3-stat"],
  ["Korrelation", "s3-stat"], ["Regression", "s3-stat"], ["Signifikanzniveau", "s3-stat"],
  ["Konfidenzintervall", "s3-stat"], ["Binomialverteilung", "s3-stat"], ["Grundgesamtheit", "s3-stat"],
  // Softwaretechnik (s3-swt)
  ["UML", "s3-swt"], ["Klassendiagramm", "s3-swt"], ["Use-Case-Diagramm", "s3-swt"],
  ["Entwurfsmuster", "s3-swt"], ["Wasserfallmodell", "s3-swt"], ["Requirements Engineering", "s3-swt"],
  ["Refactoring", "s3-swt"], ["Vorgehensmodell", "s3-swt"], ["Pflichtenheft", "s3-swt"],
  // Operations & Supply Chain (s4-oscm)
  ["Bullwhip-Effekt", "s4-oscm"], ["Just-in-Time", "s4-oscm"], ["Kanban", "s4-oscm"],
  ["Sicherheitsbestand", "s4-oscm"], ["ABC-Analyse", "s4-oscm"], ["Meldebestand", "s4-oscm"],
  ["Losgröße", "s4-oscm"], ["Durchlaufzeit", "s4-oscm"], ["Wiederbeschaffungszeit", "s4-oscm"],
  // Webtechnologien (s4-app)
  ["HTML", "s4-app"], ["CSS", "s4-app"], ["JavaScript", "s4-app"],
  ["REST", "s4-app"], ["JSON", "s4-app"], ["XML", "s4-app"],
  // MMI & GUI (s4-mmi)
  ["Usability", "s4-mmi"], ["Wireframe", "s4-mmi"], ["Barrierefreiheit", "s4-mmi"],
  ["Prototyp", "s4-mmi"], ["Interaktionsdesign", "s4-mmi"], ["Mensch-Maschine-Interaktion", "s4-mmi"],
  // Entrepreneurship (s4-ent)
  ["Venture Capital", "s4-ent"], ["Business Angel", "s4-ent"], ["Startup", "s4-ent"],
  ["MVP", "s4-ent"], ["Crowdfunding", "s4-ent"], ["Bootstrapping", "s4-ent"], ["Elevator Pitch", "s4-ent"],
  // Informatik & Programmierung (s1-gip)
  ["Algorithmus", "s1-gip"], ["Boolesche Algebra", "s1-gip"], ["Hexadezimalsystem", "s1-gip"],
  ["Compiler", "s1-gip"], ["Array", "s1-gip"],
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

/** Begriff→Modul-Zuordnungen des Suchindex (z. B. für Brücken-Themen). */
export const termModuleEntries = () =>
  INDEX.map(({ term, module, weight }) => ({ term, module, weight }));

/* ═══ Text-Ähnlichkeit für den RAG-Prompt ═══ */

/* Deduplizierte Begriffsliste als Vektor-Dimensionen. */
const VECTOR_TERMS = [...new Set(INDEX.map((e) => e.term.toLowerCase()))];

/** Fachbegriff-Zählvektor eines (bereits kleingeschriebenen) Klausurtexts. */
function termVector(textLower) {
  const vec = new Map();
  for (const term of VECTOR_TERMS) {
    const count = countMatches(textLower, term);
    if (count > 0) vec.set(term, count);
  }
  return vec;
}

/**
 * Kosinus-Ähnlichkeit zweier Klausurtexte über ihre Fachbegriff-Vektoren
 * (0..1). Zählt Häufigkeiten (ein 6× geprüftes Thema zieht stärker als ein
 * 1× erwähntes) und ist längennormalisiert – Klausurtexte variieren stark.
 */
export function examSimilarity(textA, textB) {
  const a = termVector((textA ?? "").toLowerCase());
  const b = termVector((textB ?? "").toLowerCase());
  if (a.size === 0 || b.size === 0) return 0;
  let dot = 0;
  for (const [term, count] of a) dot += count * (b.get(term) ?? 0);
  const norm = (v) => Math.sqrt([...v.values()].reduce((s, c) => s + c * c, 0));
  const denom = norm(a) * norm(b);
  return denom === 0 ? 0 : dot / denom;
}

/* Wie viele historische Klausuren maximal in den Prompt eingebettet werden
   und wie viel Text je Klausur (RAG-Kontext klein genug für jeden Chat). */
const PROMPT_HISTORY_LIMIT = 5;
const PROMPT_EXCERPT_CHARS = 1450;

/**
 * RAG-Prompt für die externe KI-Tiefenanalyse: bettet die ähnlichsten
 * gespeicherten Altklausuren als historischen Kontext ein (Ähnlichkeit per
 * Kosinus über Fachbegriff-Vektoren) und ergänzt den lokal erkannten
 * Modulbezug.
 * @param {{name:string, text:string, addedAt?:string}} exam
 * @param {{name:string, text:string, addedAt?:string}[]} otherExams
 */
export function buildExamPrompt(exam, otherExams = []) {
  const analysis = analyzeExam(exam.text, otherExams.map((e) => e.text ?? ""));
  const top = analysis.modules[0];
  const moduleTip = top
    ? `Das Modul ist vermutlich „${top.module.name}" (${top.module.code}, Semester ${top.module.semNr}, Prüfungsform: ${top.module.exam}).`
    : "Das Modul ist unbekannt – leite es aus dem Klausurinhalt ab.";

  const ranked = otherExams
    .map((e) => ({ ...e, similarity: examSimilarity(exam.text, e.text ?? "") }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, PROMPT_HISTORY_LIMIT);

  const history = ranked.length
    ? ranked
        .map((e, i) => {
          const date = e.addedAt ? new Date(e.addedAt).toLocaleDateString("de-DE") : "";
          const excerpt = (e.text ?? "").slice(0, PROMPT_EXCERPT_CHARS);
          const truncated = (e.text ?? "").length > PROMPT_EXCERPT_CHARS ? "…" : "";
          return `**Klausur ${i + 1}: ${e.name ?? "Unbenannt"}**
Ähnlichkeit: ${(e.similarity * 100).toFixed(1)} %${date ? `\nHinzugefügt: ${date}` : ""}
---
${excerpt}${truncated}`;
        })
        .join("\n\n---\n\n")
    : "Keine weiteren Klausuren gespeichert – analysiere auf Basis der aktuellen Klausur.";

  return `Du bist ein **erfahrener Prüfungsanalyst und Dozent** für den Studiengang B.Sc. E-Commerce an der Hochschule Ruhr West (BPO 02.06.2023).

**Deine Aufgabe:**
Analysiere die **neue Klausur** sehr gründlich unter Berücksichtigung des gesamten historischen Prüfungsverhaltens.
${moduleTip}
Denke wie ein strenger Prüfer dieses Moduls.

---

**AKTUELLE KLAUSUR:**
${exam.name}
---
${exam.text}

---

**HISTORISCHER KONTEXT** (ähnlichste gespeicherte Klausuren):

${history}

---

**Analysiere bitte folgende Aspekte strukturiert:**

1. **Themencluster & Schwerpunkt**
   Welche Themen/Kapitel werden in der neuen Klausur besonders stark geprüft? Wie hat sich der Fokus im Vergleich zu früheren Klausuren entwickelt?

2. **Aufgabentypen & Verteilung**
   Welche Aufgabentypen dominieren (Rechenaufgaben, Theorie, Fallstudien, Multiple Choice, Diagramme etc.)? Gibt es eine Veränderung gegenüber früher?

3. **Schwierigkeitsgrad & Stolperstellen**
   Gesamteinschätzung (leicht / mittel / schwer) + konkrete typische Fehlerquellen und Stolperfallen.

4. **Wiederkehrende Muster & Trends**
   Welche Inhalte, Fragestellungen oder Aufgabentypen tauchen regelmäßig auf? Gibt es „Klassiker" dieses Moduls? Berücksichtige auch die zeitliche Entwicklung der Prüfungen.

5. **Top 10 Prüfungswahrscheinlichkeit (RAG-basiert)**
   Erstelle eine priorisierte Liste der wichtigsten Themen. Berücksichtige sowohl die aktuelle Klausur als auch die historische Häufigkeit. Gib jeweils eine **geschätzte Wahrscheinlichkeit in %** an.

6. **Optimale Lernstrategie**
   Was sollte der Student **dringend priorisieren**? Welche Aufgabenarten und Themen muss er besonders intensiv üben? Gib konkrete Empfehlungen und schlage konkrete Lernressourcen oder Übungsarten vor.

**Zusätzliche Anweisungen:**
- Sei **konkret, ehrlich und praxisnah**
- Vergleiche explizit mit den historischen Klausuren
- Hebe **neue Trends** und **besonders wiederkehrende Themen** deutlich hervor
- Nutze Aufzählungspunkte, Fettschrift und Tabellen wo sinnvoll (Tabelle für die Top-10-Liste)
- Antworte auf Deutsch

Denke Schritt für Schritt.`;
}
