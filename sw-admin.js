/* Service Worker - Vanguard Freight Admin
   Scope isolé sur admin.html pour ne pas entrer en conflit avec suivi.html.
   Ne touche jamais aux requêtes cross-origin (Supabase, CDN) ni aux requêtes non-GET. */
const CACHE = 'vf-admin-v2';
const CORE = ['./admin.html', './manifest-admin.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE)
            .then((cache) => Promise.all(CORE.map((u) => cache.add(u).catch(() => {}))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k.startsWith('vf-admin-') && k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    // Réseau d'abord (données toujours fraîches), cache en secours hors-ligne
    event.respondWith(
        fetch(req)
            .then((res) => {
                if (res && res.ok) {
                    const copy = res.clone();
                    caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
                }
                return res;
            })
            .catch(() =>
                caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('./admin.html') : undefined))
            )
    );
});

// ======================================================
//  NOTIFICATIONS PUSH : affichage quand la fonction notify-admin envoie un message
// ======================================================
self.addEventListener('push', (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (e) {
        data = { body: event.data ? event.data.text() : '' };
    }
    const title = data.title || 'Vanguard Freight';
    const options = {
        body: data.body || '',
        tag: data.tag || 'msg',
        icon: './icon-192.png',
        badge: './icon-192.png',
        data: { url: data.url || './admin.html' }
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const target = new URL((event.notification.data && event.notification.data.url) || './admin.html', self.registration.scope).href;
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
            for (const c of list) {
                if ('focus' in c) return c.focus();
            }
            return self.clients.openWindow(target);
        })
    );
});
