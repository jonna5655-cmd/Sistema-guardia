// sw.js - Service Worker
self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : {};
    
    const options = {
        body: data.body || 'Nuevo pedido de traslado recibido',
        icon: 'https://cdn-icons-png.flaticon.com/512/822/822143.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/822/822143.png', // Icono blanco y negro para Android
        vibrate: [200, 100, 200, 100, 200],
        data: {
            url: self.location.origin // Para que al hacer clic abra tu web
        },
        actions: [
            { action: 'open', title: 'Ver Pedido' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || '🚑 NUEVO PEDIDO', options)
    );
});

// Al hacer clic en la notificación
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/') // Abre la raíz de tu sitio
    );
});
