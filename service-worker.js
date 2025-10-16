self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("souza-cache-v1").then(cache => {
      return cache.addAll([
        "./",
        "./dashboard.html",
        "./manifest.json",
        "./icon-192.png",
        "./icon-512.png",
        "./logo.png"
      ]);
    })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
