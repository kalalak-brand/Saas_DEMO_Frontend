/**
 * Push Subscription Utility
 *
 * Handles the complete Web Push subscription lifecycle:
 *   1. Register the service worker
 *   2. Request notification permission from the user
 *   3. Subscribe to push via PushManager with VAPID key
 *   4. Send the subscription to the backend API
 *
 * Uses the public VAPID key from VITE_PUBLIC_WEB_PUSH_KEY env var.
 *
 * Time: O(1), Space: O(1)
 */
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const VAPID_PUBLIC_KEY = import.meta.env.VITE_PUBLIC_WEB_PUSH_KEY;

/**
 * Convert a URL-safe base64 string to a Uint8Array.
 * Required by PushManager.subscribe() for applicationServerKey.
 *
 * Time: O(n) where n = base64 string length, Space: O(n)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Check if the browser supports Web Push notifications.
 * Time: O(1), Space: O(1)
 */
export function isPushSupported(): boolean {
    return (
        'serviceWorker' in navigator &&
        'PushManager' in window &&
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
 * Register the service worker and subscribe to push notifications.
 * After subscribing, sends the subscription to the backend for the given service request.
 *
 * @param requestId - The service request ID to associate the push subscription with
 * @returns true if successfully subscribed, false otherwise
 *
 * Time: O(1), Space: O(1)
 */
export async function subscribeToPush(requestId: string): Promise<boolean> {
    try {
        // ── Guard: check browser support ──
        if (!isPushSupported()) {
            console.warn('[Push] Browser does not support push notifications');
            // #region agent log
            fetch('http://127.0.0.1:7895/ingest/c303a57e-df67-45b3-8585-27ed099f9c95',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'140225'},body:JSON.stringify({sessionId:'140225',runId:'pre-fix',hypothesisId:'H4',location:'pushSubscription.ts:79',message:'Push unsupported',data:{hasSW:'serviceWorker'in navigator,hasPush:'PushManager'in window,hasNotification:'Notification'in window},timestamp:Date.now()})}).catch(()=>{});
            // #endregion agent log
            return false;
        }

        // ── Guard: check VAPID key ──
        if (!VAPID_PUBLIC_KEY) {
            console.warn('[Push] VITE_PUBLIC_WEB_PUSH_KEY not configured');
            // #region agent log
            fetch('http://127.0.0.1:7895/ingest/c303a57e-df67-45b3-8585-27ed099f9c95',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'140225'},body:JSON.stringify({sessionId:'140225',runId:'pre-fix',hypothesisId:'H4',location:'pushSubscription.ts:87',message:'Push missing VAPID public key',data:{hasVapidPublicKey:false},timestamp:Date.now()})}).catch(()=>{});
            // #endregion agent log
            return false;
        }

        // ── Step 1: Request permission ──
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('[Push] Notification permission denied by user');
            // #region agent log
            fetch('http://127.0.0.1:7895/ingest/c303a57e-df67-45b3-8585-27ed099f9c95',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'140225'},body:JSON.stringify({sessionId:'140225',runId:'pre-fix',hypothesisId:'H4',location:'pushSubscription.ts:97',message:'Push permission not granted',data:{permission},timestamp:Date.now()})}).catch(()=>{});
            // #endregion agent log
            return false;
        }

        // ── Step 2: Register service worker ──
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
        });
        // #region agent log
        fetch('http://127.0.0.1:7895/ingest/c303a57e-df67-45b3-8585-27ed099f9c95',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'140225'},body:JSON.stringify({sessionId:'140225',runId:'pre-fix',hypothesisId:'H4',location:'pushSubscription.ts:108',message:'Service worker registered for push',data:{scope:registration.scope},timestamp:Date.now()})}).catch(()=>{});
        // #endregion agent log

        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;

        // ── Step 3: Subscribe to push ──
        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey as BufferSource,
        });
        // #region agent log
        fetch('http://127.0.0.1:7895/ingest/c303a57e-df67-45b3-8585-27ed099f9c95',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'140225'},body:JSON.stringify({sessionId:'140225',runId:'pre-fix',hypothesisId:'H4',location:'pushSubscription.ts:122',message:'PushManager subscribed',data:{hasEndpoint:Boolean(subscription?.endpoint)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion agent log

        // ── Step 4: Send subscription to backend ──
        await axios.post(
            `${API_BASE}/public/service-requests/${requestId}/subscribe`,
            { subscription: subscription.toJSON() }
        );

        console.log('[Push] Successfully subscribed to push notifications');
        // #region agent log
        fetch('http://127.0.0.1:7895/ingest/c303a57e-df67-45b3-8585-27ed099f9c95',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'140225'},body:JSON.stringify({sessionId:'140225',runId:'pre-fix',hypothesisId:'H4',location:'pushSubscription.ts:134',message:'Push subscription sent to backend',data:{requestIdPresent:Boolean(requestId)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion agent log
        return true;
    } catch (error) {
        console.error('[Push] Failed to subscribe:', error);
        // #region agent log
        fetch('http://127.0.0.1:7895/ingest/c303a57e-df67-45b3-8585-27ed099f9c95',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'140225'},body:JSON.stringify({sessionId:'140225',runId:'pre-fix',hypothesisId:'H4',location:'pushSubscription.ts:139',message:'Push subscribe failed (caught)',data:{name:(error as any)?.name||null,message:(error as any)?.message||null},timestamp:Date.now()})}).catch(()=>{});
        // #endregion agent log
        return false;
    }
}

/**
 * Unregister the service worker (cleanup).
 * Time: O(1), Space: O(1)
 */
export async function unregisterServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
            await registration.unregister();
        }
    }
}
