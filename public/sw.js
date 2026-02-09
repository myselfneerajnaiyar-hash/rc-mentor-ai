self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  self.clients.claim();
});

// ❌ NO fetch handler
// ❌ NO caching
// ❌ NO offline logic
