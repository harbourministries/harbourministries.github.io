const CACHE = 'hm-cruise-v3';
const OFFLINE_URLS = ['/', '/index.html'];
const offlineResponse = () => new Response('', { status: 504, statusText: 'Offline' });

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(OFFLINE_URLS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Alleen GET requests cachen
  if (e.request.method !== 'GET') return;
  // API calls altijd live ophalen, fallback naar cache
  if (e.request.url.includes('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match(e.request).then(r => r || offlineResponse())
      )
    );
    return;
  }
  // Overige requests: network-first, cache als fallback
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || offlineResponse()))
  );
});
