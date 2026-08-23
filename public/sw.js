const CACHE_NAME = 'menma-dlx-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json'
];

// Installation : on met en cache initialement
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force le nouveau SW à s'activer immédiatement
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activation : on nettoie les anciens caches pour ne pas polluer l'espace
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Prend le contrôle de la page immédiatement
    );
});

// Stratégie "Stale-While-Revalidate" : 
// 1. Répond instantanément avec le cache si disponible
// 2. Fait une requête réseau en parallèle pour mettre à jour le cache
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    
    // Ignorer les requêtes vers l'API Vercel ou d'autres domaines
    const url = new URL(event.request.url);
    if (!url.pathname.endsWith('.css') && !url.pathname.endsWith('.js') && !url.pathname.endsWith('.html') && url.pathname !== '/') {
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((cachedResponse) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    // Fail silently on network error (offline)
                });

                return cachedResponse || fetchPromise;
            });
        })
    );
});
