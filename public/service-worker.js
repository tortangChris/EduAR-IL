self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  event.waitUntil(
    caches.open("eduAR-cache").then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/favicon.ico",
        "/manifest.json",
        "/pwa-192x192.png",
        "/pwa-512x512.png",
      ]);
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
});

self.addEventListener("fetch", (event) => {
  console.log("Fetching:", event.request.url);
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
