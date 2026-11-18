/* Service Worker - Vanguard Freight Suivi
   Sert uniquement à recevoir et afficher les notifications du client.
   Il ne met rien en cache et ne touche à aucune requête du site. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

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
        icon: 'https://i.ibb.co/kVTBHc25/file-0000000009f4824699d2b3868487fcce.png',
        data: { url: data.url || './suivi.html' }
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const target = new URL((event.notification.data && event.notification.data.url) || './suivi.html', self.registration.scope).href;
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
            for (const c of list) {
                if ('navigate' in c && 'focus' in c) return c.navigate(target).then((w) => (w || c).focus()).catch(() => self.clients.openWindow(target));
            }
            return self.clients.openWindow(target);
        })
    );
});
