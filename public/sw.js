self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // A simple bypass to satisfy the PWA installability requirements
  // For a production media app, you might want to cache assets, but for now we just pass through.
  event.respondWith(fetch(event.request));
});
