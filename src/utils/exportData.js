/** Backup, CSV- und Datei-Export. */
import { EXAM_TEXT_LIMIT } from "../constants/config.js";

export function downloadFile(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const downloadJSON = (name, data) =>
  downloadFile(name, JSON.stringify(data, null, 2), "application/json");

/** Zeilen (Array von Arrays) als Excel-kompatibles CSV (Semikolon). */
export function toCSV(rows) {
  return rows
    .map((r) => r.map((c) => `"${String(c ?? "").replaceAll('"', '""')}"`).join(";"))
    .join("\r\n");
}

export const downloadCSV = (name, rows) =>
  downloadFile(name, "﻿" + toCSV(rows), "text/csv;charset=utf-8");

const isObject = (v) => v != null && typeof v === "object" && !Array.isArray(v);
const finitePositive = (v) => Number.isFinite(v) && v >= 0;

/*
 * Pro-Slice-Validierung: ungültige EINTRÄGE werden verworfen statt das
 * ganze Backup abzulehnen – ein kaputter Slice darf nicht alle anderen
 * Daten mit in den Abgrund reißen. (Bewusst ohne Zod: eine einzige
 * Validierungsstelle rechtfertigt keine Bundle-Dependency.)
 */
const SLICE_VALIDATORS = {
  doneDays: (v) =>
    isObject(v) ? Object.fromEntries(Object.entries(v).filter(([, val]) => val === true)) : null,
  quizBest: (v) =>
    isObject(v)
      ? Object.fromEntries(
          Object.entries(v).filter(
            ([, b]) => isObject(b) && finitePositive(b.c) && finitePositive(b.t) && b.t > 0
          )
        )
      : null,
  fcKnown: (v) =>
    isObject(v)
      ? Object.fromEntries(
          Object.entries(v)
            .filter(([, list]) => Array.isArray(list))
            .map(([k, list]) => [k, list.filter((i) => Number.isInteger(i) && i >= 0)])
        )
      : null,
  favorites: (v) => (Array.isArray(v) ? v.filter((t) => typeof t === "string") : null),
  recents: (v) => (Array.isArray(v) ? v.filter((t) => typeof t === "string") : null),
  activity: (v) =>
    isObject(v)
      ? Object.fromEntries(Object.entries(v).filter(([, min]) => finitePositive(min)))
      : null,
  settings: (v) => (isObject(v) ? v : null),
  wrongPool: (v) =>
    isObject(v)
      ? Object.fromEntries(Object.entries(v).filter(([, e]) => isObject(e)))
      : null,
  exams: (v) =>
    Array.isArray(v)
      ? v
          .filter((e) => isObject(e) && typeof e.name === "string" && typeof e.text === "string")
          .map((e) => ({ ...e, text: e.text.slice(0, EXAM_TEXT_LIMIT) }))
      : null,
  srs: (v) =>
    isObject(v)
      ? Object.fromEntries(Object.entries(v).filter(([, entries]) => isObject(entries)))
      : null,
  chainsDone: (v) =>
    isObject(v) ? Object.fromEntries(Object.entries(v).filter(([, b]) => b === true)) : null,
  notes: (v) =>
    isObject(v)
      ? Object.fromEntries(
          Object.entries(v).filter(([, t]) => typeof t === "string" && t.trim()).map(([k, t]) => [k, t.slice(0, 4000)])
        )
      : null,
  simHistory: (v) =>
    Array.isArray(v)
      ? v.filter((e) => isObject(e) && typeof e.grade === "string" && Number.isFinite(e.pct)).slice(0, 20)
      : null,
};

/**
 * Backup-Text validieren; wirft nur bei grundsätzlich falschem Format.
 * Einzelne defekte Slices/Einträge werden still verworfen.
 */
export function parseBackup(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== "object" || !("doneDays" in data)) {
    throw new Error("Ungültiges Backup-Format");
  }
  const clean = {
    startDate: typeof data.startDate === "string" ? data.startDate : undefined,
    mastered: finitePositive(data.mastered) ? data.mastered : undefined,
  };
  for (const [key, validate] of Object.entries(SLICE_VALIDATORS)) {
    if (!(key in data)) continue;
    const value = validate(data[key]);
    if (value != null) clean[key] = value;
  }
  return clean;
}
