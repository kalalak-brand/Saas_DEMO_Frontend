/**
 * Kalalak Insight — Service Worker
 * Handles:
 *   1. Push notifications with sound playback via connected clients
 *   2. Notification click routing
 *   3. Basic app-shell caching for offline support
 *
 * Time: O(1) per push event, Space: O(c) where c = cached resources
 */

const CACHE_NAME = 'kalalak-v2';

// ── App shell resources to cache for offline support ──
const APP_SHELL = [
  '/',
  '/index.html',
  '/vite.svg',
  '/manifest.json',
];

// ══════════════════════════════════════════
// INSTALL — Pre-cache app shell
// ══════════════════════════════════════════
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch(() => {
        // Non-critical: some resources may not exist in dev
        console.log('[SW] Some app shell resources could not be cached');
      });
    })
  );
  // Activate immediately without waiting for old clients to close
  self.skipWaiting();
});

// ══════════════════════════════════════════
// ACTIVATE — Clean old caches
// ══════════════════════════════════════════
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  // Take control of all open clients immediately
  self.clients.claim();
});

// ══════════════════════════════════════════
// FETCH — Network-first with cache fallback
// ══════════════════════════════════════════
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests and API calls
  if (request.method !== 'GET') return;
  if (request.url.includes('/api/')) return;
  if (request.url.includes('socket.io')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses for offline use
        if (response.ok && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(request).then((cached) => {
          return cached || caches.match('/index.html');
        });
      })
  );
});

// ══════════════════════════════════════════
// PUSH — Handle incoming push notifications
// ══════════════════════════════════════════
self.addEventListener('push', function (event) {
  let pushData = {};

  if (event.data) {
    try {
      pushData = event.data.json();
    } catch (e) {
      pushData = { title: 'New Notification', body: event.data.text() };
    }
  }

  const title = pushData.title || 'Kalalak Notification';

  // Determine urgency level for visual differentiation
  const isEscalation = pushData.escalationLevel === '15min' || (pushData.title && pushData.title.includes('Escalation'));
  const isUrgent = pushData.escalationLevel === '10min' || isEscalation;

  const options = {
    body: pushData.body || 'You have a new update.',
    icon: '/vite.svg',
    badge: '/vite.svg',
    vibrate: isEscalation
      ? [300, 100, 300, 100, 300, 100, 300] // Aggressive for escalation
      : isUrgent
        ? [200, 100, 200, 100, 200]          // Moderate for 10min
        : [200, 100, 200],                   // Standard for 5min/normal
    data: {
      url: pushData.url || '/',
      playSound: pushData.playSound !== false, // Default: play sound
      escalationLevel: pushData.escalationLevel || 'normal',
    },
    tag: pushData.tag || 'kalalak-' + Date.now(), // Prevent duplicates with same tag
    renotify: true, // Re-alert even if same tag (important for escalations)
    requireInteraction: true, // Keep visible until user interacts
    silent: false, // Allow OS sound
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      // After showing notification, tell any open client windows to play sound
      if (pushData.playSound !== false) {
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
          for (const client of clientList) {
            client.postMessage({
              type: 'PLAY_NOTIFICATION_SOUND',
              escalationLevel: pushData.escalationLevel || 'normal',
            });
          }
        });
      }
    })
  );
});

// ══════════════════════════════════════════
// NOTIFICATION CLICK — Route to relevant page
// ══════════════════════════════════════════
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // If a window client is already open, focus it and navigate
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if ('focus' in client) {
          client.focus();
          client.postMessage({ type: 'NAVIGATE', url: urlToOpen });
          return;
        }
      }
      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
