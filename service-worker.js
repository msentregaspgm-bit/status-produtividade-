// Improved service-worker with broader caching and offline fallback
const CACHE_NAME = "souza-dashboard-v3";
const urlsToCache = [
  "dashboard.html",
  "logo.png",
  "manifest.json",
  "offline.html",
  // CDNs (cache these requests too)
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  "https://cdn.jsdelivr.net/npm/chart.js",
  "https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)).then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if(key !== CACHE_NAME) return caches.delete(key);
      }))
    ).then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;

  // network-first for API script (try network but fallback to cache)
  if(req.url.includes("script.google.com/macros")){
    event.respondWith(
      fetch(req).then(resp => {
        // clone into cache if ok
        if(resp && resp.ok){
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return resp;
      }).catch(()=>caches.match(req).then(r=>r || caches.match("offline.html")))
    );
    return;
  }

  // for navigation requests, try network then fallback to cache -> offline page
  if(req.mode === 'navigate'){
    event.respondWith(
      fetch(req).then(resp => {
        // store copy
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return resp;
      }).catch(err => caches.match(req).then(r=>r || caches.match("dashboard.html") || caches.match("offline.html")))
    );
    return;
  }

  // for other resources, serve from cache then network, and add to cache
  event.respondWith(
    caches.match(req).then(cacheResp => {
      return cacheResp || fetch(req).then(networkResp => {
        try{
          const copy = networkResp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }catch(e){}
        return networkResp;
      }).catch(()=>caches.match("offline.html"));
    })
  );
});
