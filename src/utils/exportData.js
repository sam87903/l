/** Backup, CSV- und Datei-Export. */

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

const BACKUP_KEYS = ["doneDays", "quizBest", "fcKnown", "favorites", "recents", "activity", "settings", "wrongPool", "exams", "srs"];

/** Backup-Text validieren; wirft bei ungültigem Format. */
export function parseBackup(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== "object" || !("doneDays" in data)) {
    throw new Error("Ungültiges Backup-Format");
  }
  const clean = {
    startDate: typeof data.startDate === "string" ? data.startDate : undefined,
    mastered: typeof data.mastered === "number" ? data.mastered : undefined,
  };
  for (const key of BACKUP_KEYS) {
    if (key in data && typeof data[key] === "object" && data[key] !== null) clean[key] = data[key];
  }
  return clean;
}
