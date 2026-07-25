import { storage } from "./storage.js";
import { STORAGE_KEYS, AUTO_BACKUP_KEEP, AUTO_BACKUP_BUDGET } from "../constants/config.js";

/**
 * Rotierende Auto-Backups: hält die letzten AUTO_BACKUP_KEEP Schnappschüsse
 * unter einem eigenen Storage-Slot vor. Identische Folge-Snapshots werden
 * übersprungen, damit die Historie nicht mit Duplikaten volläuft.
 *
 * Größenbremse: Ein Snapshot enthält den kompletten Export – inklusive der
 * Volltexte aller Altklausuren (bis 120.000 Zeichen pro Klausur). Bei drei
 * Kopien plus dem Live-Stand sprengt das den Browser-Speicher schon bei
 * wenigen Klausuren, und dann scheitert *jedes* weitere Speichern – auch der
 * Lernfortschritt. Überschreitet ein Snapshot das Budget, werden deshalb die
 * Klausurtexte weggelassen und der Eintrag als schlank markiert. Der
 * Lernfortschritt (das Unersetzliche) bleibt immer vollständig erhalten.
 */

export async function readAutoBackups() {
  try {
    const raw = await storage.get(STORAGE_KEYS.autoBackups);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Grober Vergleich zweier Snapshots (ohne den Zeitstempel). */
function sameData(a, b) {
  if (!a || !b) return false;
  const strip = (d) => JSON.stringify({ ...d, exportedAt: 0 });
  return strip(a) === strip(b);
}

/** Klausur-Volltexte entfernen, Namen und Datum behalten. */
function withoutExamTexts(data) {
  if (!Array.isArray(data.exams) || data.exams.length === 0) return null;
  return {
    ...data,
    exams: data.exams.map(({ text, ...rest }) => ({ ...rest, text: "" })),
  };
}

/**
 * Neuen Snapshot anhängen und auf AUTO_BACKUP_KEEP Versionen kürzen
 * (älteste fällt raus). Gibt die aktualisierte Liste zurück.
 */
export async function pushAutoBackup(data) {
  const list = await readAutoBackups();
  if (list.length > 0 && sameData(list[0].data, data)) return list; // nichts Neues

  let payload = data;
  let slim = false;
  if (JSON.stringify(data).length > AUTO_BACKUP_BUDGET) {
    const lean = withoutExamTexts(data);
    if (lean) {
      payload = lean;
      slim = true;
    }
  }

  const entry = { at: new Date().toISOString(), data: payload, ...(slim && { slim: true }) };
  const next = [entry, ...list].slice(0, AUTO_BACKUP_KEEP);
  const ok = await storage.set(STORAGE_KEYS.autoBackups, JSON.stringify(next));
  if (ok) return next;

  // Kein Platz mehr: lieber nur den neuesten Stand halten als gar keinen.
  const minimal = [{ ...entry, data: withoutExamTexts(payload) ?? payload, slim: true }];
  const okMinimal = await storage.set(STORAGE_KEYS.autoBackups, JSON.stringify(minimal));
  return okMinimal ? minimal : list;
}
