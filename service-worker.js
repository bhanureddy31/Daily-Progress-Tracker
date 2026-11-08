// Service Worker for Daily Progress Tracker
const CACHE_NAME = 'daily-progress-tracker-v1';

// Relative assets list - works on localhost, root domains, and GitHub Pages subpaths
const PRECACHE_ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-192.png',
    './icons/icon-maskable-512.png',
    './icons/apple-touch-icon.png',
    './icons/favicon.png'
];

// Install: Cache all core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS);
        }).then(() => {
            return self.skipWaiting();
        })
    );
});

// Activate: Clean up old caches and claim existing clients
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
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Fetch: Stale-while-revalidate strategy for seamless offline availability
self.addEventListener('fetch', (event) => {
    // Only intercept standard GET HTTP/HTTPS requests
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith('http://') && !event.request.url.startsWith('https://')) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Fetch fresh copy from network in parallel
            const fetchPromise = fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Fallback to index.html for navigation when offline
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html') || caches.match('./');
                    }
                });

            // Return cached response if available, otherwise wait for network
            return cachedResponse || fetchPromise;
        })
    );
});
