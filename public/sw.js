// 🚨 HARD RESET SERVICE WORKER — DO NOT CACHE ANYTHING

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // ALWAYS go to network — no cache
  event.respondWith(fetch(event.request));
});
