/**
 * Persistenz-Schicht: nutzt window.storage (claude.ai-Artefakt),
 * sonst localStorage. Fällt bei Fehlern still auf No-Op zurück.
 */
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

  async set(key, value) {
    try {
      if (typeof window !== "undefined" && window.storage?.set) {
        await window.storage.set(key, value);
        return;
      }
    } catch { /* Artefakt-Storage nicht verfügbar */ }
    try {
      localStorage.setItem(key, value);
    } catch { /* Speicher voll oder blockiert – bewusst ignorieren */ }
  },
};
