/**
 * Offline-Cache der App.
 *
 * Strategie:
 * - Navigationen/HTML: Netz zuerst (Updates kommen sofort an), bei Offline
 *   aus dem Cache – die App startet also auch ohne Internet.
 * - Eigene Assets (Icons, Manifest): Cache zuerst.
 * - cdn.jsdelivr.net (KI-Stimmen-Bibliothek vits-web + onnxruntime-Wasm):
 *   Cache zuerst mit Nachladen – nach dem ersten Nutzen funktioniert die
 *   KI-Stimme auch offline (das Stimmmodell selbst liegt in IndexedDB).
 *
 * 8a689d289fb0 wird beim Deploy durch den Commit-Stand ersetzt; dadurch ändert
 * sich sw.js bei jedem Release und der Browser rotiert den Cache sauber.
 */
const VERSION = "8a689d289fb0";
const CACHE = `mrk-app-${VERSION}`;
const CDN_CACHE = "mrk-cdn-v1"; // versionsstabil – Bibliothek ändert sich selten
const PRECACHE = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE && k !== CDN_CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

/** Antwort in Cache legen (nur vollständige 200er). */
const putIfOk = (cacheName, request, response) => {
  if (response && response.status === 200) {
    const copy = response.clone();
    caches.open(cacheName).then((cache) => cache.put(request, copy));
  }
  return response;
};

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // KI-Stimmen-Bibliothek & Wasm: Cache zuerst, sonst Netz + merken.
  if (url.hostname === "cdn.jsdelivr.net") {
    event.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((r) => putIfOk(CDN_CACHE, request, r)))
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // App-Start (Navigation): frisch aus dem Netz, offline aus dem Cache.
  if (request.mode === "navigate" || url.pathname.endsWith("/index.html")) {
    event.respondWith(
      fetch(request)
        .then((r) => putIfOk(CACHE, request, r))
        .catch(() => caches.match(request).then((hit) => hit || caches.match("./index.html")))
    );
    return;
  }

  // Eigene Assets: Cache zuerst.
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request)
          .then((r) => putIfOk(CACHE, request, r))
          .catch(() => caches.match("./index.html"))
    )
  );
});
