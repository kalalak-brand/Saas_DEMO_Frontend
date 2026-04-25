/**
 * Firebase Client SDK Initialization — Frontend
 *
 * All config values are injected via Vite VITE_FIREBASE_* environment variables.
 * If any key is missing the app will still load — FCM will be disabled and the
 * useFcmToken hook guards against missing config gracefully.
 *
 * Exports:
 *   firebaseApp  — initialized Firebase App instance
 *   messaging    — Firebase Messaging instance (null if unsupported)
 *
 * Time: O(1), Space: O(1)
 */
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';

// Firebase project configuration — sourced from environment variables
// All values come from Firebase Console → Project Settings → General → Your apps
const firebaseConfig = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Initialize Firebase App (idempotent — safe with Vite HMR).
 * Uses getApps() to avoid re-initialization on hot reload.
 *
 * Time: O(1), Space: O(1)
 */
function initFirebaseApp(): FirebaseApp {
    const existingApps = getApps();
    if (existingApps.length > 0) return existingApps[0];
    return initializeApp(firebaseConfig);
}

export const firebaseApp = initFirebaseApp();

/**
 * Get Firebase Messaging instance.
 * Returns null if:
 *   - Browser doesn't support FCM (e.g., Firefox Private, iOS Safari)
 *   - VITE_FIREBASE_* env vars are not configured
 *
 * Callers must guard against null.
 * Time: O(1), Space: O(1)
 */
export async function getMessagingInstance(): Promise<Messaging | null> {
    const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId;
    if (!hasConfig) {
        console.warn('[FCM] Firebase config env vars not set — push notifications disabled.');
        return null;
    }

    const supported = await isSupported();
    if (!supported) {
        console.warn('[FCM] Firebase Messaging not supported in this browser.');
        return null;
    }

    return getMessaging(firebaseApp);
}
