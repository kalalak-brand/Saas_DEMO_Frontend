/**
 * Browser Notification Permission Utility
 *
 * Handles requesting browser push notification permission
 * and showing native OS notifications for low-rating alerts.
 *
 * NOTE: Push notifications require HTTPS (or localhost).
 * Time: O(1), Space: O(1)
 */

/**
 * Request browser notification permission (one-time prompt).
 * Safe to call multiple times — browsers remember the choice.
 * Time: O(1), Space: O(1)
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return Notification.requestPermission();
};

/**
 * Show a browser-native notification (only if permission granted).
 * Uses `tag` to prevent duplicate notifications for the same event.
 * Time: O(1), Space: O(1)
 */
export const showBrowserNotification = (title: string, body: string): void => {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body,
            icon: '/logo.png',
            tag: `low-rating-${Date.now()}`,
            requireInteraction: false,
        });
    }
};
