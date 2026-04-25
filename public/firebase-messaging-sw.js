/**
 * Kalalak Insight — Firebase Cloud Messaging Service Worker
 *
 * Handles:
 *   1. Firebase Messaging background push notifications (app closed or background)
 *   2. Notification click routing (focus window or open new)
 *   3. Sound playback via postMessage to connected clients
 *   4. App-shell caching for offline support
 *
 * IMPORTANT: This file MUST be named 'firebase-messaging-sw.js' and placed in /public/
 * It uses Firebase compat SDK v9+ (importScripts CDN) because service workers cannot
 * use ES modules (import/export) syntax in all browsers.
 *
 * Time: O(1) per push event, Space: O(c) where c = cached resources
 */

/* global importScripts, firebase, self */

// ── Load Firebase compat SDK via CDN (required for service worker context) ──
// Pin to a specific major version to avoid unexpected breaking changes
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const CACHE_NAME = 'kalalak-v3';

// ── App shell resources to cache for offline support ──
const APP_SHELL = [
    '/',
    '/index.html',
    '/vite.svg',
    '/manifest.json',
];

// ── Firebase config — injected from the main app via postMessage ──
// The main app sends its config on the first message after SW activation.
// Until config is received, FCM background messaging is not initialized.
let firebaseInitialized = false;

/**
 * Initialize Firebase inside the service worker.
 * Called when the main app sends a 'FIREBASE_CONFIG' message.
 * Idempotent — skips if already initialized.
 *
 * Time: O(1), Space: O(1)
 */
function initFirebaseInSW(config) {
    if (firebaseInitialized) return;
    if (!config?.projectId) return;

    try {
        firebase.initializeApp(config);
        const messaging = firebase.messaging();

        /**
         * Handle background push messages from FCM.
         * This fires when the browser tab is closed or backgrounded.
         * Foreground messages are handled in the main app (useFcmToken → onMessage).
         *
         * Time: O(1), Space: O(1)
         */
        messaging.onBackgroundMessage((payload) => {
            const title = payload.notification?.title || 'Kalalak Notification';
            const body  = payload.notification?.body  || 'You have a new update.';
            const data  = payload.data || {};

            // Determine urgency for adaptive vibration pattern
            const escalationLevel = data.escalationLevel || 'normal';
            const isEscalation = escalationLevel === '15min';
            const isUrgent     = escalationLevel === '10min';

            const options = {
                body,
                icon: '/vite.svg',
                badge: '/vite.svg',
                vibrate: isEscalation
                    ? [300, 100, 300, 100, 300, 100, 300] // Aggressive for 15min escalation
                    : isUrgent
                        ? [200, 100, 200, 100, 200]       // Moderate for 10min warning
                        : [200, 100, 200],                 // Standard for 5min/normal
                data: {
                    url: data.link || '/management/service-requests',
                    escalationLevel,
                    playSound: true,
                },
                tag: `kalalak-${data.requestId || Date.now()}`, // Deduplication key
                renotify: true,                                  // Re-alert on same tag (escalations)
                requireInteraction: isEscalation || isUrgent,    // Keep visible until interacted
                silent: false,
            };

            // Show OS notification
            self.registration.showNotification(title, options).then(() => {
                // Tell any open app clients to play the notification sound
                self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
                    for (const client of clients) {
                        client.postMessage({
                            type: 'PLAY_NOTIFICATION_SOUND',
                            escalationLevel,
                        });
                    }
                });
            });
        });

        firebaseInitialized = true;
        console.log('[FCM SW] Firebase initialized in service worker.');
    } catch (err) {
        console.error('[FCM SW] Firebase initialization failed:', err);
    }
}

// ══════════════════════════════════════════
// INSTALL — Pre-cache app shell
// ══════════════════════════════════════════
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(APP_SHELL).catch(() => {
                console.log('[FCM SW] Some app shell resources could not be cached.');
            });
        })
    );
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
    self.clients.claim();
});

// ══════════════════════════════════════════
// FETCH — Network-first with cache fallback
// ══════════════════════════════════════════
self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') return;
    if (request.url.includes('/api/')) return;
    if (request.url.includes('socket.io')) return;
    if (request.url.includes('gstatic.com')) return; // Don't cache Firebase CDN

    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.ok && response.type === 'basic') {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(request).then((cached) => {
                    return cached || caches.match('/index.html');
                });
            })
    );
});

// ══════════════════════════════════════════
// MESSAGE — Receive Firebase config from main app
// ══════════════════════════════════════════
self.addEventListener('message', (event) => {
    if (event.data?.type === 'FIREBASE_CONFIG') {
        initFirebaseInSW(event.data.config);
    }
});

// ══════════════════════════════════════════
// NOTIFICATION CLICK — Route to relevant page
// ══════════════════════════════════════════
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/management/service-requests';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If a window is already open, focus it and navigate
            for (const client of clientList) {
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
