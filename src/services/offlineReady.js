/**
 * Offline-Bereitschaft: alles, was die App vor einer Reise ohne Netz
 * überstehen lassen muss.
 *
 * Wichtigster Punkt ist die dauerhafte Speicherung: Browser dürfen die
 * Daten einer Website jederzeit verwerfen – iOS/Safari löscht sie sogar
 * nach längerer Nicht-Nutzung oder bei knappem Speicher. `storage.persist()`
 * bittet den Browser, genau das zu unterlassen. Ohne diese Zusage kann ein
 * kompletter Lernfortschritt unterwegs verloren gehen.
 */

const has = (obj, key) => typeof obj !== "undefined" && obj && key in obj;

/** Ist dauerhafte Speicherung bereits zugesichert? */
export async function isPersisted() {
  if (!has(navigator, "storage") || !navigator.storage.persisted) return false;
  try {
    return await navigator.storage.persisted();
  } catch {
    return false;
  }
}

/**
 * Dauerhafte Speicherung anfordern. Der Browser entscheidet selbst; bei
 * installierten Web-Apps (Zum Home-Bildschirm) sagt er meist zu.
 */
export async function requestPersistentStorage() {
  if (await isPersisted()) return true;
  if (!has(navigator, "storage") || !navigator.storage.persist) return false;
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/** Belegter Speicher (Bytes) und Kontingent, soweit der Browser es verrät. */
export async function getStorageEstimate() {
  if (!has(navigator, "storage") || !navigator.storage.estimate) return null;
  try {
    const { usage, quota } = await navigator.storage.estimate();
    return { usage: usage ?? 0, quota: quota ?? 0 };
  } catch {
    return null;
  }
}

/** Liegt die App selbst im Offline-Cache (Service Worker aktiv)? */
export async function isAppCached() {
  if (typeof caches === "undefined") return false;
  try {
    const keys = await caches.keys();
    for (const k of keys) {
      const cache = await caches.open(k);
      const hit = (await cache.match("./index.html")) || (await cache.match("./"));
      if (hit) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Läuft ein Service Worker (Voraussetzung für den Offline-Start)? */
export async function isServiceWorkerActive() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    return !!reg?.active;
  } catch {
    return false;
  }
}

/** Bytes menschenlesbar. */
export const fmtBytes = (b) => {
  if (!b) return "0 MB";
  const mb = b / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
};
