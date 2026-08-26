// UniBoard Service Worker - offline support + app updates
const VERSION = 'v3';
const STATIC_CACHE = `uniboard-static-${VERSION}`;
const RUNTIME_CACHE = `uniboard-runtime-${VERSION}`;

const PRECACHE_URLS = [
    './',
    './index.html',
    './manifest.json',
    './assets/icon.svg',
    './assets/icon-192.png',
    './assets/icon-512.png',
    // CSS
    './css/main.css',
    './css/components.css',
    './css/pages.css',
    // Core JS
    './js/firebase-config.js',
    './js/utils.js',
    './js/icons.js',
    './js/auth.js',
    './js/db.js',
    './js/drive.js',
    './js/app.js',
    // Pages
    './js/pages/dashboard.js',
    './js/pages/activities.js',
    './js/pages/calendar.js',
    './js/pages/subjects.js',
    './js/pages/tasks.js',
    './js/pages/exams.js',
    './js/pages/study.js',
    './js/pages/timer.js',
    './js/pages/documents.js',
    './js/pages/contacts.js',
    './js/pages/friends.js',
    './js/pages/settings.js',
    './js/pages/profile.js',
    './js/pages/uni-life.js',
    './js/pages/goals.js',
    './js/pages/reminders.js',
    './js/pages/progress.js',
    './js/pages/finances.js'
];

// CDNs whose files can be cached for offline use
const CDN_ORIGINS = [
    'https://www.gstatic.com',
    'https://apis.google.com',
    'https://accounts.google.com',
    'https://docs.google.com',
    'https://cdnjs.cloudflare.com',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => cache.addAll(PRECACHE_URLS))
        // NOTE: no skipWaiting() here - updates wait for user confirmation
        // (the "Nueva versión disponible" popup sends SKIP_WAITING)
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((key) => key.startsWith('uniboard-') && key !== STATIC_CACHE && key !== RUNTIME_CACHE)
                    .map((key) => caches.delete(key))
            ).then(() => self.clients.claim())
        )
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Only handle GET requests; let Firestore/API traffic pass through untouched
    if (request.method !== 'GET') return;
    const url = new URL(request.url);

    // Page navigations: network-first so users get updates, cached fallback when offline
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
                    return response;
                })
                .catch(() =>
                    caches.match(request).then((cached) => cached || caches.match('./index.html'))
                )
        );
        return;
    }

    // Never intercept the SW script itself
    if (url.pathname.endsWith('/sw.js')) return;

    // App CDN assets (Firebase SDK, fonts): cache-first
    if (CDN_ORIGINS.some((origin) => url.origin === origin)) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
                    }
                    return response;
                });
            })
        );
        return;
    }

    // Same-origin static assets: network-first so updates apply immediately,
    // cached copy as offline fallback
    // ignoreSearch so 'js/app.js?v=9' matches the precached 'js/app.js'
    if (url.origin === self.location.origin) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() => caches.match(request, { ignoreSearch: true }))
        );
    }
});
