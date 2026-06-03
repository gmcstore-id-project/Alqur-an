const CACHE_NAME = 'alquran-digital-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install: cache aset utama
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: hapus cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first untuk aset lokal, network-first untuk API & audio
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Biarkan request ke API eksternal (audio, quran API, dll) lewat network langsung
  if (
    url.includes('api.alquran.cloud') ||
    url.includes('cdn.islamic.network') ||
    url.includes('archive.org') ||
    url.includes('api.anthropic.com') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('unpkg.com') ||
    url.includes('cdn.jsdelivr.net')
  ) {
    return; // biarkan browser handle langsung
  }

  // Untuk aset lokal: cache-first
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
