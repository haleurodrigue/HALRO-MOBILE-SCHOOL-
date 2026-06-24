const CACHE_NAME = 'halro-school-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon_512.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Suppression de l\'ancien cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  
  // Stratégie Network-First pour la page principale (/) et index.html
  if (e.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          // Mettre en cache la version la plus récente du réseau
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, clone);
          });
          return response;
        })
        .catch(() => {
          // En cas d'absence de réseau, utiliser le cache
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Pour les autres requêtes, Cache-First avec repli réseau et mise en cache dynamique
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((response) => {
        // Enregistrer dynamiquement en cache les assets du bundle et les images
        if (response.status === 200 && (url.pathname.includes('/assets/') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.png') || url.pathname.endsWith('.json'))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(() => {
        // Retourner vide en cas de panne réseau générale
      });
    })
  );
});
