/**
 * Guest Push Subscription Utility (FCM)
 *
 * Handles guest notification opt-in for service request tracking.
 * When a guest submits a request, they can opt to receive a push notification
 * when it is completed or updated by staff.
 *
 * Flow:
 *   1. Check browser support (FCM requires serviceWorker + Notification API)
 *   2. Request notification permission
 *   3. Register firebase-messaging-sw.js service worker
 *   4. Get FCM token via Firebase getToken()
 *   5. Send token to backend POST /api/public/service-requests/:id/subscribe
 *
 * The backend stores the token on the ServiceRequest.guestFcmToken field.
 * When staff completes the request, the backend calls sendToToken() to push
 * a completion notification to the guest's device.
 *
 * Time: O(1), Space: O(1)
 */
import axios from 'axios';
import { getToken } from 'firebase/messaging';
import { getMessagingInstance } from '../config/firebase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/** FCM VAPID key for guest subscriptions (same as staff — same Firebase project) */
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Check if the browser supports push notifications.
 * Time: O(1), Space: O(1)
 */
export function isPushSupported(): boolean {
    return (
        'serviceWorker' in navigator &&
        'Notification' in window
    );
}

/**
 * Get current notification permission status.
 * Time: O(1), Space: O(1)
 */
export function getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
}

/**
 * Subscribe guest to FCM push notifications for a service request.
 * After subscribing, the FCM token is sent to the backend and stored
 * on the ServiceRequest document for targeted completion push.
 *
 * @param requestId - The service request MongoDB _id to link the token to
 * @returns true if successfully subscribed, false otherwise
 *
 * Time: O(1), Space: O(1)
 */
export async function subscribeToPush(requestId: string): Promise<boolean> {
    try {
        // ── Guard: browser support ──
        if (!isPushSupported()) {
            console.warn('[FCM Guest] Browser does not support push notifications');
            return false;
        }

        // ── Guard: VAPID key ──
        if (!VAPID_KEY) {
            console.warn('[FCM Guest] VITE_FIREBASE_VAPID_KEY not configured');
            return false;
        }

        // ── Step 1: Request permission ──
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('[FCM Guest] Notification permission denied by user');
            return false;
        }

        // ── Step 2: Get Firebase Messaging instance ──
        const messaging = await getMessagingInstance();
        if (!messaging) {
            console.warn('[FCM Guest] Firebase Messaging not available');
            return false;
        }

        // ── Step 3: Register service worker ──
        const registration = await navigator.serviceWorker.register(
            '/firebase-messaging-sw.js',
            { scope: '/' }
        );
        await navigator.serviceWorker.ready;

        // Send Firebase config to SW for background message handling
        const swTarget = registration.installing || registration.waiting || registration.active;
        if (swTarget) {
            swTarget.postMessage({
                type: 'FIREBASE_CONFIG',
                config: {
                    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
                    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
                    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
                    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
                    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
                    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
                },
            });
        }

        // ── Step 4: Get FCM token ──
        const fcmToken = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        if (!fcmToken) {
            console.warn('[FCM Guest] Could not obtain FCM token');
            return false;
        }

        // ── Step 5: Send token to backend ──
        await axios.post(
            `${API_BASE}/public/service-requests/${requestId}/subscribe`,
            { fcmToken }
        );

        console.log('[FCM Guest] Successfully subscribed to push notifications');
        return true;
    } catch (error) {
        console.error('[FCM Guest] Failed to subscribe:', error);
        return false;
    }
}

/**
 * Unregister all service workers (cleanup utility).
 * Time: O(n) where n = registered service workers, Space: O(1)
 */
export async function unregisterServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
            await registration.unregister();
        }
    }
}
