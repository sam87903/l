/** URL-Helfer für externe Lernressourcen. */

export const BOOK = "https://drive.google.com/file/d/1zu9nR85-tedUw2c074pIm2S_KQdy-kWw/view";

/** Deges-Buch auf einer bestimmten PDF-Seite öffnen (?pli=1 erzwingt Reload). */
export const B = (page) => `${BOOK}?pli=1#page=${page}`;

export const YT = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

/** Studyflix-Inhalte zuverlässig über die YouTube-Suche finden. */
export const SF = (q) => YT("Studyflix " + q);

export const K = (q) => `https://knowunity.de/knows?q=${encodeURIComponent(q)}`;
export const DOC = (q) => `https://www.studocu.com/de/search?q=${encodeURIComponent(q)}`;
export const QZ = (q) => `https://quizlet.com/de/search?query=${encodeURIComponent(q)}&type=sets`;

/* ═══ Link-Kategorien: sortiert „Links & Ressourcen" in klare Gruppen ═══ */

const LINK_GROUPS = [
  { id: "video", label: "🎬 Videos", test: (u) => u.includes("youtube.com") },
  { id: "daten", label: "📊 Daten & Statistiken", test: (u) => u.includes("statista.com") || u.includes("einzelhandel.de") },
  {
    id: "lesen",
    label: "📖 Buch & Nachschlagen",
    test: (u) => u.includes("drive.google.com") || u.includes("gabler") || u.includes("gesetze-im-internet"),
  },
  {
    id: "ueben",
    label: "💻 Üben & Tools",
    test: (u) =>
      /w3schools|mozilla\.org|wiwiweb|sqlbolt|scribbr|ankiweb|quizlet|knowunity|studocu|udemy|elearning|springernature/.test(u),
  },
];

const FALLBACK_GROUP = { id: "mehr", label: "🔗 Weitere Links" };

/**
 * Sortiert eine Linkliste in feste Kategorien (Videos → Daten → Buch →
 * Üben → Weitere). Leere Gruppen entfallen; die Reihenfolge innerhalb
 * einer Gruppe bleibt erhalten.
 */
export function groupLinks(links = []) {
  const buckets = new Map();
  for (const link of links) {
    const group = LINK_GROUPS.find((g) => g.test(link.u ?? "")) ?? FALLBACK_GROUP;
    const list = buckets.get(group.id) ?? [];
    list.push(link);
    buckets.set(group.id, list);
  }
  return [...LINK_GROUPS, FALLBACK_GROUP]
    .filter((g) => buckets.has(g.id))
    .map((g) => ({ id: g.id, label: g.label, links: buckets.get(g.id) }));
}
