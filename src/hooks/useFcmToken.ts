/**
 * useFcmToken — React Hook for FCM Token Lifecycle Management
 *
 * Handles the complete FCM push notification setup for authenticated staff:
 *   1. Checks browser support and notification permission
 *   2. Requests notification permission if not yet granted
 *   3. Gets the FCM registration token via Firebase SDK
 *   4. Sends token to backend (POST /api/auth/fcm-token) → backend subscribes to topics
 *   5. Listens for foreground messages → shows toast notification
 *   6. On unmount/logout: removes token from backend (DELETE /api/auth/fcm-token)
 *
 * Guards:
 *   - Only runs when user is authenticated (token + user present in auth store)
 *   - Gracefully no-ops if Firebase env vars are missing
 *   - Gracefully no-ops if browser doesn't support FCM (Firefox Private, iOS Safari)
 *   - Never throws — all errors are caught and logged
 *
 * Time: O(1) per render, Space: O(1)
 */
import { useEffect, useRef } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { getMessagingInstance } from '../config/firebase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/** FCM VAPID key — from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates */
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * useFcmToken
 * Call this hook once at the authenticated layout level (e.g. ManagementLayout).
 * It self-manages the full token lifecycle — no props needed.
 *
 * Time: O(1), Space: O(1)
 */
export function useFcmToken(): void {
    const { token: authToken, user } = useAuthStore();
    // Ref to store the current FCM token so the cleanup function can unregister it
    const fcmTokenRef = useRef<string | null>(null);

    useEffect(() => {
        // Only run when the user is fully authenticated
        if (!authToken || !user) return;

        // Track if this effect is still current (prevents state updates after unmount)
        let cancelled = false;

        async function initFcm(): Promise<void> {
            try {
                const messaging = await getMessagingInstance();
                if (!messaging || cancelled) return;

                // ── Step 1: Request notification permission ──
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    console.log('[FCM] Notification permission denied — push disabled for this session.');
                    return;
                }

                // ── Step 2: Get FCM registration token ──
                if (!VAPID_KEY) {
                    console.warn('[FCM] VITE_FIREBASE_VAPID_KEY not set — cannot get FCM token.');
                    return;
                }

                // Register the Firebase messaging service worker
                const registration = await navigator.serviceWorker.register(
                    '/firebase-messaging-sw.js',
                    { scope: '/' }
                );
                await navigator.serviceWorker.ready;

                // Send Firebase config to the service worker so it can init Firebase compat SDK
                // (SW cannot import ES modules — receives config via postMessage instead)
                const swTarget = registration.installing || registration.waiting || registration.active;
                if (swTarget) {
                    const firebaseConfig = {
                        apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
                        authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
                        projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
                        storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
                        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
                        appId:             import.meta.env.VITE_FIREBASE_APP_ID,
                    };
                    swTarget.postMessage({ type: 'FIREBASE_CONFIG', config: firebaseConfig });
                }

                const fcmToken = await getToken(messaging, {
                    vapidKey: VAPID_KEY,
                    serviceWorkerRegistration: registration,
                });

                if (!fcmToken || cancelled) return;

                // Store for cleanup
                fcmTokenRef.current = fcmToken;

                // ── Step 3: Register token with backend ──
                // Backend subscribes the user to their role-based FCM topics
                await axios.post(
                    `${API_BASE}/auth/fcm-token`,
                    { fcmToken },
                    { headers: { Authorization: `Bearer ${authToken}` } }
                );
                console.log('[FCM] Token registered — push notifications active.');

                // ── Step 4: Handle foreground messages (app is open) ──
                // Background messages are handled by the service worker
                const unsubscribeOnMessage = onMessage(messaging, (payload) => {
                    const title = payload.notification?.title || 'Kalalak Notification';
                    const body  = payload.notification?.body  || 'You have a new update.';
                    // Show an in-app toast for foreground messages
                    // (Background messages are shown as OS notifications by the SW)
                    toast(
                        `🔔 ${title}\n${body}`,
                        {
                            duration: 6000,
                            style: {
                                background: '#1a1a2e',
                                color: '#e2b96f',
                                border: '1px solid #e2b96f',
                                maxWidth: '360px',
                            },
                        }
                    );
                });

                // Return cleanup that unsubscribes the onMessage listener
                return () => {
                    unsubscribeOnMessage();
                };
            } catch (err) {
                if (!cancelled) {
                    console.error('[FCM] Failed to initialize push notifications:', err);
                }
            }
        }

        // Start FCM initialization — store any returned cleanup fn
        let onMessageCleanup: (() => void) | void;
        initFcm().then((cleanup) => {
            onMessageCleanup = cleanup;
        });

        // Cleanup on unmount or when auth state changes
        return () => {
            cancelled = true;
            onMessageCleanup?.();

            // Remove FCM token from backend (unsubscribes from all FCM topics)
            const tokenToRemove = fcmTokenRef.current;
            if (tokenToRemove && authToken) {
                axios.delete(`${API_BASE}/auth/fcm-token`, {
                    data: { fcmToken: tokenToRemove },
                    headers: { Authorization: `Bearer ${authToken}` },
                }).catch((err) => {
                    console.warn('[FCM] Token removal failed (non-blocking):', err.message);
                });
                fcmTokenRef.current = null;
            }
        };
    }, [authToken, user?._id]); // Re-run if user changes (login/logout)
}
