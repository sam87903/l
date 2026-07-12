/* Offline-Cache. Strategie:
   - Navigationen (HTML): Network-First → nach einem Deploy sofort die neue
     App, offline Rückfall auf die gecachte Shell.
   - Übrige eigene GET-Assets (gehashtes JS/CSS/Bilder): Cache-First mit
     Hintergrund-Nachladen (stale-while-revalidate). */
const CACHE = "marokko-lernplan-v4";
const PRECACHE = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) return;

  // Navigationen: Network-First, damit Updates ohne Umweg ankommen.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match("./index.html")))
    );
    return;
  }

  // Assets: Cache-First; Treffer wird im Hintergrund aktualisiert.
  event.respondWith(
    caches.match(request).then((hit) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => hit);
      return hit || network;
    })
  );
});
