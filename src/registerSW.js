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
