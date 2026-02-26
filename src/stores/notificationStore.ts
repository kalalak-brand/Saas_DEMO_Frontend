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
            const res = await apiClient.get('/notifications/unread-count');
            const count = res.data?.data?.unreadCount ?? 0;
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
