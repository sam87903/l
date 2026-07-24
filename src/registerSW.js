/**
 * Service Worker nur im Produktions-Build und über HTTP(S) registrieren –
 * die Single-File-Version (file://) läuft ohne SW einwandfrei.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (!window.location.protocol.startsWith("http")) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* Offline-Modus optional – Fehler nicht eskalieren */
    });
  });
}

/**
 * Dauerhafte Speicherung anfordern: Ohne diese Zusage darf der Browser die
 * App-Daten jederzeit verwerfen – auf iOS schon nach längerer Nicht-Nutzung.
 * Für eine Lern-App, die wochenlang offline genutzt wird, wäre das fatal.
 * Läuft still im Hintergrund; das Ergebnis zeigt der Reise-Check.
 */
export function requestPersistentStorageQuietly() {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return;
  navigator.storage
    .persisted()
    .then((already) => (already ? null : navigator.storage.persist()))
    .catch(() => {
      /* Browser verweigert – der Reise-Check macht darauf aufmerksam */
    });
}
