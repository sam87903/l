import { storage } from "./storage.js";
import { STORAGE_KEYS, AUTO_BACKUP_KEEP } from "../constants/config.js";

/**
 * Rotierende Auto-Backups: hält die letzten AUTO_BACKUP_KEEP Schnappschüsse
 * unter einem eigenen Storage-Slot vor. Identische Folge-Snapshots werden
 * übersprungen, damit die Historie nicht mit Duplikaten volläuft.
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

/**
 * Neuen Snapshot anhängen und auf AUTO_BACKUP_KEEP Versionen kürzen
 * (älteste fällt raus). Gibt die aktualisierte Liste zurück.
 */
export async function pushAutoBackup(data) {
  const list = await readAutoBackups();
  if (list.length > 0 && sameData(list[0].data, data)) return list; // nichts Neues
  const entry = { at: new Date().toISOString(), data };
  const next = [entry, ...list].slice(0, AUTO_BACKUP_KEEP);
  await storage.set(STORAGE_KEYS.autoBackups, JSON.stringify(next));
  return next;
}
