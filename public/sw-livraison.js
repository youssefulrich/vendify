// public/sw-livraison.js
// Service Worker pour les notifications push livreurs Vendify

self.addEventListener('install', (e) => {
  console.log('[SW] Installé')
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  console.log('[SW] Activé')
  e.waitUntil(clients.claim())
})

// Réception d'une notification push
self.addEventListener('push', (e) => {
  if (!e.data) return

  const data = e.data.json()

  const options = {
    body:    data.body || 'Nouvelle livraison disponible dans votre zone !',
    icon:    '/icon-192.png',
    badge:   '/badge-72.png',
    vibrate: [200, 100, 200, 100, 200],
    tag:     data.tag || 'livraison-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    data: {
      url:          data.url || '/livreur/' + (data.driver_id || ''),
      delivery_id:  data.delivery_id,
      driver_id:    data.driver_id,
    },
    actions: [
      { action: 'accepter', title: '✅ Voir la livraison' },
      { action: 'ignorer',  title: '❌ Ignorer' },
    ],
  }

  e.waitUntil(
    self.registration.showNotification(
      data.title || '🛵 Nouvelle livraison !',
      options
    )
  )
})

// Clic sur la notification
self.addEventListener('notificationclick', (e) => {
  e.notification.close()

  if (e.action === 'ignorer') return

  const url = e.notification.data?.url || '/'

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si l'app est déjà ouverte, focus
      for (const client of clientList) {
        if (client.url.includes('/livreur/') && 'focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      // Sinon ouvrir un nouvel onglet
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})