/**
 * Notification Store (Zustand)
 * Manages in-app notification state with polling for real-time updates.
 *
 * Polls /api/notifications/unread-count every 30 seconds.
 * Fetches full notification list on demand when dropdown opens.
 *
 * Time: O(1) state access, O(n) for notification list
 * Space: O(n) where n = cached notifications
 */
import { create } from 'zustand';
import { apiClient } from '../utils/apiClient';
import { showBrowserNotification } from '../utils/notificationPermission';
import toast from 'react-hot-toast';

/**
 * Play a two-tone notification chime using the Web Audio API.
 * No audio file needed — synthesized in real-time.
 * Tone: E5 (659Hz) → G5 (784Hz), 120ms each, soft volume.
 * Time: O(1), Space: O(1)
 */
const playAlertSound = () => {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const now = ctx.currentTime;

        // First tone — E5
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.value = 659.25; // E5
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc1.connect(gain1).connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.15);

        // Second tone — G5 (starts after first)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.value = 783.99; // G5
        gain2.gain.setValueAtTime(0.15, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc2.connect(gain2).connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.35);

        // Cleanup AudioContext after sound finishes
        setTimeout(() => ctx.close(), 500);
    } catch {
        // Web Audio API not available — silently skip
    }
};

export interface LowRatedQuestionItem {
    questionId: string;
    questionText: string;
    rating: number;
}

export interface NotificationItem {
    _id: string;
    hotelId: string;
    type: 'low_rating';
    title: string;
    message: string;
    metadata: {
        reviewId?: string;
        categoryName?: string;
        categorySlug?: string;
        avgRating?: number;
        guestName?: string;
        guestPhone?: string;
        guestRoomNumber?: string;
        lowRatedQuestions?: LowRatedQuestionItem[];
    };
    isRead: boolean;
    createdAt: string;
}

interface NotificationState {
    notifications: NotificationItem[];
    unreadCount: number;
    loading: boolean;
    _pollingId: ReturnType<typeof setInterval> | null;

    /** Fetch unread count only (lightweight — for badge) */
    fetchUnreadCount: () => Promise<void>;

    /** Fetch full notification list (when dropdown opens) */
    fetchNotifications: () => Promise<void>;

    /** Mark a single notification as read */
    markAsRead: (id: string) => Promise<void>;

    /** Mark all notifications as read */
    markAllAsRead: () => Promise<void>;

    /** Start polling for unread count every 30s */
    startPolling: () => void;

    /** Stop polling */
    stopPolling: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    _pollingId: null,

    fetchUnreadCount: async () => {
        try {
            const prevCount = get().unreadCount;
            const res = await apiClient.get('/notifications/unread-count');
            const count = res.data?.data?.unreadCount ?? 0;

            // Play sound + show browser notification + toast when new alerts arrive
            if (count > prevCount && prevCount >= 0) {
                const newAlerts = count - prevCount;
                playAlertSound();
                showBrowserNotification(
                    '⚠️ Low Rating Alert',
                    `${newAlerts} new low-rated review(s) received`
                );
                toast.error(
                    `⚠️ ${newAlerts} new low-rated review${newAlerts > 1 ? 's' : ''} received!`,
                    { duration: 5000, id: 'low-rating-alert' }
                );
            }

            set({ unreadCount: count });
        } catch {
            // Silently fail — badge will show stale count
        }
    },

    fetchNotifications: async () => {
        set({ loading: true });
        try {
            const res = await apiClient.get('/notifications', {
                params: { limit: 20 },
            });
            const notifications = res.data?.data?.notifications ?? [];
            set({ notifications, loading: false });
        } catch {
            set({ loading: false });
        }
    },

    markAsRead: async (id: string) => {
        try {
            await apiClient.patch(`/notifications/${id}/read`);
            set((state) => ({
                notifications: state.notifications.map((n) =>
                    n._id === id ? { ...n, isRead: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1),
            }));
        } catch {
            // Silently fail
        }
    },

    markAllAsRead: async () => {
        try {
            await apiClient.patch('/notifications/read-all');
            set((state) => ({
                notifications: state.notifications.map((n) => ({
                    ...n,
                    isRead: true,
                })),
                unreadCount: 0,
            }));
        } catch {
            // Silently fail
        }
    },

    startPolling: () => {
        // Guard: don't create duplicate intervals
        if (get()._pollingId) return;

        // Fetch immediately on start
        get().fetchUnreadCount();

        // Poll every 30 seconds
        const id = setInterval(() => {
            get().fetchUnreadCount();
        }, 30_000);

        set({ _pollingId: id });
    },

    stopPolling: () => {
        const id = get()._pollingId;
        if (id) {
            clearInterval(id);
            set({ _pollingId: null });
        }
    },
}));
