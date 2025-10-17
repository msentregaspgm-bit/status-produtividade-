const CACHE_NAME = 'souza-cache-v1';
const FILES_TO_CACHE = [
  '/dashboard.html',
  '/manifest.json',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png'
];

// install
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// activate
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => { if(k !== CACHE_NAME) return caches.delete(k); })))
  );
  self.clients.claim();
});

// fetch (cache first, then network)
self.addEventListener('fetch', evt => {
  if(evt.request.method !== 'GET') return;
  evt.respondWith(
    caches.match(evt.request).then(cached => {
      if(cached) return cached;
      return fetch(evt.request).then(res => {
        // put in cache (but not opaque 3rd-party)
        if(!res || res.status !== 200 || res.type === 'opaque') return res;
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(evt.request, copy));
        return res;
      }).catch(()=> caches.match('/dashboard.html'));
    })
  );
});

// basic push placeholder (if you add push later)
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data.json(); } catch(e) { data = { title:'Atualização', body: 'Dados atualizados' }; }
  self.registration.showNotification(data.title || 'Souza Transportes', { body: data.body || 'Dados atualizados', icon: '/icon-192.png' });
});
