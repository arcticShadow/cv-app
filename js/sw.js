// js/sw.js
const CACHE_NAME = 'cv-app-v1';
const ASSETS = [
    '/',
    'index.html',
    'css/style.css',
    'js/app.js',
    'js/md-parser.js',
    'js/sitemap.js',
    'js/config.js',
    'js/full-renderer.js',
    'js/components/experience-entry.js',
    'js/components/project-entry.js',
    'sitemap.json',
    'config.json',
    'manifest.json',
    'favicon.svg'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cached => cached || fetch(event.request))
    );
});
