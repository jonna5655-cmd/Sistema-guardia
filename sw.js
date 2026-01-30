/* Service Worker: Gestión Camilleros
   Permite instalación PWA y manejo de notificaciones
*/

const CACHE_NAME = 'camilleros-cache-v1';
const ASSETS = [
    './',
    './camillero.html',
    './manifest.json'
];

// 1. INSTALACIÓN: Crea el caché para que la App sea instalable
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// 2. ACTIVACIÓN: Limpia versiones viejas
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
});

// 3. ESTRATEGIA DE RED: Intenta red primero, si falla va al caché
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});

// 4. ESCUCHAR NOTIFICACIONES PUSH (Desde el servidor)
self.addEventListener('push', (event) => {
    let data = { title: '🚑 Nuevo Pedido', body: 'Revisa la lista de traslados.' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: 'https://cdn-icons-png.flaticon.com/512/822/822143.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/822/822143.png',
        vibrate: [300, 100, 300, 100, 300],
        data: { url: './camillero.html' },
        tag: 'pedido-notif', // Evita que se amontonen si hay varios
        renotify: true,
        actions: [
            { action: 'open', title: 'VER PEDIDO' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// 5. CLIC EN LA NOTIFICACIÓN: Abre la app o la pone en primer plano
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = new URL('./camillero.html', self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Si la pestaña ya está abierta, poner el foco en ella
            for (let client of windowClients) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no está abierta, abrir una nueva
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
