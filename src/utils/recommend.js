/**
 * „Heute empfohlen": priorisiert die nächsten Lernschritte aus
 * Fehler-Kartei, SRS-Fälligkeiten, Modul-Schwächen, Klausur-Themen und
 * Streak-Schutz. Passt den Lernplan dynamisch an, ohne den 21-Tage-Plan
 * selbst umzubauen.
 */
import { countDueCards } from "./decks.js";
import { todayISO } from "./dates.js";
import { GLOSSARY } from "../data/glossary.js";

const MAX_RECOMMENDATIONS = 3;
/** Unterhalb dieser Schwäche gilt ein Modul nicht als empfehlenswert. */
const WEAKNESS_FLOOR = 0.35;

/**
 * @param {object} input
 * @param {object} input.stats      abgeleitete Kennzahlen (mistakesDue, streak …)
 * @param {Array}  input.weakness   moduleWeakness()-Ergebnis (sortiert)
 * @param {object} input.examFreq   examModuleFrequency()-Ergebnis
 * @param {Array}  input.topTerms   aggregateExams-Terme (rank 1 zuerst)
 * @param {object} input.srs        SRS-Slice (für fällige Karten)
 * @param {object} input.activity   Aktivitäts-Map (ISO-Tag → Minuten)
 * @returns {{id, icon, urgent?, title, reason, action:{to, state}}[]} max. 3
 */
export function buildRecommendations({
  stats = {},
  weakness = [],
  examFreq = {},
  topTerms = [],
  srs = {},
  activity = {},
} = {}) {
  const recs = [];

  if (stats.mistakesDue > 0) {
    recs.push({
      id: "mistakes",
      icon: "🔁",
      urgent: true,
      title: `${stats.mistakesDue} fällige ${stats.mistakesDue === 1 ? "Frage" : "Fragen"} wiederholen`,
      reason: "Fehler-Training zuerst – Wiederholung zum richtigen Zeitpunkt festigt am stärksten.",
      action: { to: "/plan", state: { openTrainer: true } },
    });
  }

  const dueCards = countDueCards(srs);
  if (dueCards > 0) {
    recs.push({
      id: "srs",
      icon: "🃏",
      title: `${dueCards} fällige Lernkarte${dueCards === 1 ? "" : "n"} wiederholen`,
      reason: "Spaced Repetition wirkt nur, wenn fällige Karten auch drankommen.",
      action: { to: "/plan", state: { scrollTo: "karten-training" } },
    });
  }

  const weakest = weakness[0];
  if (weakest && weakest.score >= WEAKNESS_FLOOR) {
    const inExams = (examFreq[weakest.modId] ?? 0) > 0;
    recs.push({
      id: "weak-module",
      icon: "🎯",
      title: `${weakest.module.code} gezielt üben`,
      reason: inExams
        ? `${weakest.module.name} ist dein schwächstes Modul – und Schwerpunkt deiner gespeicherten Klausuren.`
        : `${weakest.module.name} ist aktuell dein schwächstes Modul.`,
      action: weakest.module.quiz?.length
        ? { to: "/plan", state: { openQuizSection: true, openQuiz: weakest.modId } }
        : { to: "/plan", state: { scrollTo: "smart-quiz" } },
    });
  }

  const topTerm = topTerms[0];
  if (topTerm) {
    const canonical = Object.keys(GLOSSARY).find(
      (k) => k.toLowerCase() === topTerm.term.toLowerCase()
    );
    if (canonical) {
      recs.push({
        id: "exam-term",
        icon: "📄",
        title: `„${canonical}" sicher können`,
        reason: `Top-Thema deiner Klausuren (in ${topTerm.inExams} von ${topTerm.total}).`,
        action: { to: "/glossar", state: { query: canonical, openTerm: canonical } },
      });
    }
  }

  if (stats.streak > 0 && !((activity[todayISO()] ?? 0) > 0)) {
    recs.push({
      id: "streak",
      icon: "🔥",
      title: "Streak retten – heute noch lernen",
      reason: `${stats.streak} Tage in Folge: 5 Fokus-Minuten oder ein abgehakter Plan-Tag reichen.`,
      action: { to: "/plan", state: {} },
    });
  }

  return recs.slice(0, MAX_RECOMMENDATIONS);
}
