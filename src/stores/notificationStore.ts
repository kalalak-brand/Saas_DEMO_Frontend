/**
 * Notification Store (Zustand)
 * Manages in-app notification state with polling for real-time updates.
 *
 * Polls /api/notifications/unread-count every 10 seconds for near-instant alerts.
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
 * Play a loud triple-beep alarm using the Web Audio API.
 * No audio file needed — synthesized in real-time.
 * Pattern: 880Hz → 1047Hz → 880Hz, 150ms each, louder volume (0.35).
 * Time: O(1), Space: O(1)
 */
const playAlertSound = () => {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const now = ctx.currentTime;

        const beep = (freq: number, start: number, duration: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.35, now + start);
            gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
            osc.connect(gain).connect(ctx.destination);
            osc.start(now + start);
            osc.stop(now + start + duration);
        };

        // Triple beep — urgent, attention-grabbing
        beep(880, 0, 0.15);      // A5
        beep(1046.5, 0.2, 0.15); // C6
        beep(880, 0.4, 0.2);     // A5 (longer)

        // Cleanup AudioContext after sound finishes
        setTimeout(() => ctx.close(), 800);
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

    /** Start polling for unread count every 10s */
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

                // Loud beep alarm
                playAlertSound();

                // Browser push notification
                showBrowserNotification(
                    '⚠️ Low Rating Alert',
                    `${newAlerts} new low-rated review(s) received`
                );

                // Prominent in-app toast — top-right, long duration
                toast(
                    `🔔 ${newAlerts} new low-rated review${newAlerts > 1 ? 's' : ''} received! Click the bell to view.`,
                    {
                        duration: 8000,
                        position: 'top-right',
                        id: `low-rating-alert-${Date.now()}`,
                        style: {
                            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                            color: '#fff',
                            fontWeight: '600',
                            fontSize: '15px',
                            padding: '16px 20px',
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(220, 38, 38, 0.4)',
                            maxWidth: '420px',
                            border: '2px solid rgba(255,255,255,0.2)',
                        },
                        icon: '⚠️',
                    }
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

        // Poll every 10 seconds for near-instant updates
        const id = setInterval(() => {
            get().fetchUnreadCount();
        }, 10_000);

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

