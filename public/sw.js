const SW_VERSION = "rc-mentor-sw-v3"; // 🔥 CHANGE THIS EVERY DEPLOY

self.addEventListener("install", (event) => {
  console.log("SW installing:", SW_VERSION);
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("SW activating:", SW_VERSION);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
