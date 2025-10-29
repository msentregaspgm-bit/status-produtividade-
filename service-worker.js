
const CACHE_NAME = "souza-dashboard-v5";
const urlsToCache = [
  "dashboard.html",
  "index.html",
  "logo.png",
  "manifest.json",
  "offline.html",
  "splash-512.png",
  "splash-1024.png",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if(key !== CACHE_NAME) return caches.delete(key);
      }))
    ).then(()=>self.clients.claim())
  );
});

// Helper: stale-while-revalidate for JSON endpoints (Apps Script)
async function staleWhileRevalidate(request){
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const networkPromise = fetch(request).then(resp => {
    if(resp && resp.ok) cache.put(request, resp.clone());
    return resp;
  }).catch(()=>null);
  return cached || networkPromise || caches.match('offline.html');
}

self.addEventListener('fetch', event => {
  const req = event.request;

  // Apps Script / dynamic JSON endpoint -> stale-while-revalidate
  if(req.url.includes('script.google.com/macros') || req.url.includes('/exec')){
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // navigation requests -> prefer network, fallback to cache / offline
  if(req.mode === 'navigate'){
    event.respondWith(
      fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return resp;
      }).catch(()=>caches.match(req).then(r=>r || caches.match('dashboard.html') || caches.match('offline.html')))
    );
    return;
  }

  // default: cache first, then network, else offline
  event.respondWith(
    caches.match(req).then(cacheResp => {
      return cacheResp || fetch(req).then(networkResp => {
        try{ const copy = networkResp.clone(); caches.open(CACHE_NAME).then(cache => cache.put(req, copy)); }catch(e){}
        return networkResp;
      }).catch(()=>caches.match('offline.html'));
    })
  );
});
