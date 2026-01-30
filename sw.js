/* Service Worker: Gestión Camilleros
   - Permite la instalación como Aplicación (PWA)
   - Maneja notificaciones en segundo plano
   - Gestiona el caché para funcionamiento estable
*/

const CACHE_NAME = 'camilleros-v1';
const ASSETS_TO_CACHE = [
    './',
    './camillero.html',
    './manifest.json',
    'https://cdn-icons-png.flaticon.com/512/822/822143.png'
];

// 1. INSTALACIÓN: Guarda archivos esenciales en el celular
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Cacheando archivos básicos');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// 2. ACTIVACIÓN: Elimina versiones viejas de la App
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('SW: Borrando caché antiguo', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 3. ESTRATEGIA DE RED: Intenta cargar por internet, si falla usa el caché
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});

// 4. MANEJO DE NOTIFICACIONES (Evento Push)
self.addEventListener('push', (event) => {
    let payload = {
        title: '🚑 NUEVO TRASLADO',
        body: 'Hay un nuevo pedido en la lista.',
        icon: 'https://cdn-icons-png.flaticon.com/512/822/822143.png'
    };

    if (event.data) {
        try {
            payload = event.data.json();
        } catch (e) {
            payload.body = event.data.text();
        }
    }

    const options = {
        body: payload.body,
        icon: payload.icon,
        badge: payload.icon,
        vibrate: [200, 100, 200, 100, 200],
        tag: 'pedido-notificacion',
        renotify: true,
        data: { url: './camillero.html' },
        actions: [
            { action: 'open', title: 'Abrir Panel' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(payload.title, options)
    );
});

// 5. CLIC EN LA NOTIFICACIÓN: Abre la app o enfoca la pestaña abierta
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = new URL('./camillero.html', self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Si la pestaña ya está abierta, ir a ella
            for (let client of windowClients) {
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no está abierta, abrir una nueva pestaña
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
