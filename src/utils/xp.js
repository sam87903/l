import { XP_RULES } from "../constants/config.js";
import { toLocalISO } from "./dates.js";

/** Gesamt-XP aus den Kernstatistiken. */
export function computeXp({ doneCount, knownTotal, quizzesPerfect, focusTotal, favCount, mastered = 0 }) {
  return (
    doneCount * XP_RULES.day +
    knownTotal * XP_RULES.card +
    quizzesPerfect * XP_RULES.perfectQuiz +
    Math.round(focusTotal) * XP_RULES.minute +
    favCount * XP_RULES.favorite +
    mastered * XP_RULES.mastered
  );
}

/** Kumulierte XP-Schwelle für ein Level (Level 1 beginnt bei 0). */
export const xpForLevel = (level) => Math.round(50 * (level - 1) * level);

/** Level + Fortschritt innerhalb des Levels aus Gesamt-XP. */
export function levelInfo(xp) {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, xpInLevel: xp - base, xpForNext: next - base };
}

/**
 * Lern-Streak: aufeinanderfolgende Tage mit Aktivität, endend heute
 * (oder gestern, wenn heute noch nichts gelernt wurde).
 */
export function computeStreak(activity) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (!activity[toLocalISO(d)]) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (activity[toLocalISO(d)]) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/**
 * Heatmap-Daten: `weeks` Kalenderwochen (Mo–So) bis heute,
 * je Zelle {iso, minutes, future}.
 */
export function heatmapWeeks(activity, weeks = 16) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  // bis zum Sonntag der aktuellen Woche auffüllen (Mo=0 … So=6)
  const dow = (end.getDay() + 6) % 7;
  end.setDate(end.getDate() + (6 - dow));
  const start = new Date(end);
  start.setDate(start.getDate() - weeks * 7 + 1);
  const grid = [];
  const cursor = new Date(start);
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let i = 0; i < 7; i++) {
      const iso = toLocalISO(cursor);
      col.push({ iso, minutes: activity[iso] || 0, future: cursor > today });
      cursor.setDate(cursor.getDate() + 1);
    }
    grid.push(col);
  }
  return grid;
}

/** Fokus-Minuten der letzten `days` Tage, ältester zuerst. */
export function lastDaysSeries(activity, days = 7) {
  const out = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days + 1);
  for (let i = 0; i < days; i++) {
    const iso = toLocalISO(d);
    out.push({
      iso,
      label: d.toLocaleDateString("de-DE", { weekday: "short" }),
      minutes: activity[iso] || 0,
    });
    d.setDate(d.getDate() + 1);
  }
  return out;
}
