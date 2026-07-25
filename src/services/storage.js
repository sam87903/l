/**
 * Persistenz-Schicht: nutzt window.storage (claude.ai-Artefakt),
 * sonst localStorage.
 *
 * Wichtig: Ein fehlgeschlagener Schreibvorgang wird **nicht** verschluckt.
 * Ist der Speicher voll oder blockiert, merkt sich das Modul den Fehler und
 * meldet ihn an Zuhörer. Sonst würde die App wochenlang so tun, als würde sie
 * speichern, während der Lernfortschritt verloren geht – offline auf Reisen
 * wäre das kaum zu bemerken und hinterher nicht mehr zu retten.
 */

/** Zuletzt aufgetretener Schreibfehler ("quota" | "blocked") oder null. */
let writeError = null;
const listeners = new Set();

const notify = () => {
  for (const fn of listeners) {
    try {
      fn(writeError);
    } catch {
      /* ein defekter Zuhörer darf das Speichern nicht stoppen */
    }
  }
};

/** Fehlerart bestimmen – ein voller Speicher ist der häufigste Fall. */
const classify = (err) => {
  const name = err?.name || "";
  const code = err?.code;
  if (name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED" || code === 22 || code === 1014) {
    return "quota";
  }
  return "blocked";
};

/** Auf Änderungen des Schreibfehlers hören. Gibt eine Abmelde-Funktion zurück. */
export function onStorageError(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Aktueller Schreibfehler oder null. */
export function getStorageError() {
  return writeError;
}

export const storage = {
  async get(key) {
    try {
      if (typeof window !== "undefined" && window.storage?.get) {
        const r = await window.storage.get(key);
        return r ? r.value : null;
      }
    } catch { /* Artefakt-Storage nicht verfügbar */ }
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  /** Schreibt und liefert true bei Erfolg, false bei Fehler (voll/blockiert). */
  async set(key, value) {
    try {
      if (typeof window !== "undefined" && window.storage?.set) {
        await window.storage.set(key, value);
        return true;
      }
    } catch { /* Artefakt-Storage nicht verfügbar – localStorage versuchen */ }
    try {
      localStorage.setItem(key, value);
      if (writeError) {
        writeError = null; // wieder Platz da
        notify();
      }
      return true;
    } catch (err) {
      const kind = classify(err);
      if (writeError !== kind) {
        writeError = kind;
        notify();
      }
      return false;
    }
  },

  async remove(key) {
    try {
      if (typeof window !== "undefined" && window.storage?.delete) {
        await window.storage.delete(key);
        return;
      }
    } catch { /* Artefakt-Storage nicht verfügbar */ }
    try {
      localStorage.removeItem(key);
    } catch { /* blockiert – bewusst ignorieren */ }
  },
};
