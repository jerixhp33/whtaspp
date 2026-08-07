const CACHE_NAME = 'chatflow-app-shell-v1';

// Only safe static application shell resources - NEVER cache user messages, data, or API requests!
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // NEVER cache Supabase API calls, backend API calls, or WebSocket upgrades
  if (
    url.pathname.includes('/rest/v1') ||
    url.pathname.includes('/auth/v1') ||
    url.pathname.includes('/storage/v1') ||
    url.pathname.includes('/realtime/v1') ||
    url.pathname.startsWith('/api/') ||
    event.request.headers.get('Upgrade') === 'websocket' ||
    event.request.method !== 'GET'
  ) {
    return; // Pass through to network
  }

  // For HTML navigation requests, return network or fallback to cached app shell (SPA routing)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // Stale-while-revalidate for static assets (JS, CSS, fonts, images)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
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
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// ============================================================
// Push Notification Handler
// ============================================================
self.addEventListener('push', (event) => {
  let data = { title: 'ChatFlow', body: 'New notification', icon: '/icons/icon-192.png' };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = {
        title: payload.title || 'ChatFlow',
        body: payload.body || 'New notification',
        icon: payload.icon || '/icons/icon-192.png',
        badge: payload.badge || '/icons/icon-192.png',
        tag: payload.tag || 'chatflow-notification',
        data: payload.data || {},
        actions: payload.actions || [],
        vibrate: [200, 100, 200],
        requireInteraction: payload.data?.type === 'call_incoming',
      };
    }
  } catch (e) {
    // Use defaults
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      data: data.data,
      actions: data.actions,
      vibrate: data.vibrate,
      requireInteraction: data.requireInteraction,
    })
  );
});

// ============================================================
// Notification Click Handler — Deep Link to Correct Content
// ============================================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  let targetUrl = '/';

  if (notifData.conversation_id) {
    targetUrl = `/?conversation=${notifData.conversation_id}`;
    if (notifData.message_id) {
      targetUrl += `&message=${notifData.message_id}`;
    }
  } else if (notifData.type === 'contact_request' || notifData.type === 'contact_accepted') {
    targetUrl = '/contacts';
  } else if (notifData.type === 'call_missed') {
    targetUrl = notifData.conversation_id
      ? `/?conversation=${notifData.conversation_id}`
      : '/';
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing ChatFlow window if available
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              data: notifData,
              url: targetUrl,
            });
            return;
          }
        }
        // Open new window if no existing client
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
