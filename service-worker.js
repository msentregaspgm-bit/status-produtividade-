const CACHE_NAME = 'souza-dashboard-v1';
self.addEventListener('fetch', event => {
  if (event.request.url.includes('script.google.com')) {
    event.respondWith(fetch(event.request));
  } else {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
  }
});