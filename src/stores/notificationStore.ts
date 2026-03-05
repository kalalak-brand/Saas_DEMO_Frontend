/**
 * Notification Store (Zustand)
 * Real-time notifications via Socket.IO WebSocket connection.
 * Replaces polling with instant push — 360 requests/hr/user → 1 persistent connection.
 *
 * Backward-compatible API: startPolling() / stopPolling() still work
 * but now manage the WebSocket lifecycle instead of setInterval.
 *
 * Fallback: if WebSocket fails, falls back to 30s polling automatically.
 *
 * Time: O(1) state access, O(n) for notification list
 * Space: O(n) where n = cached notifications
 */
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
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

/**
 * Show alert toast + browser notification + sound for new incoming alerts.
 * Extracted for reuse across both socket and polling paths.
 * Time: O(1), Space: O(1)
 */
const triggerAlertEffects = (newAlerts: number) => {
    playAlertSound();

    showBrowserNotification(
        '⚠️ Low Rating Alert',
        `${newAlerts} new low-rated review(s) received`
    );

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
    /** Internal: active socket instance */
    _socket: Socket | null;
    /** Internal: fallback polling interval */
    _pollingId: ReturnType<typeof setInterval> | null;
    /** Whether WebSocket is connected */
    isConnected: boolean;

    /** Fetch unread count via REST (used as fallback) */
    fetchUnreadCount: () => Promise<void>;

    /** Fetch full notification list (when dropdown opens) */
    fetchNotifications: () => Promise<void>;

    /** Mark a single notification as read */
    markAsRead: (id: string) => Promise<void>;

    /** Mark all notifications as read */
    markAllAsRead: () => Promise<void>;

    /**
     * Connect to WebSocket for real-time notifications.
     * Backward-compatible name: was startPolling(), now starts socket.
     * Falls back to 30s polling if WebSocket connection fails.
     */
    startPolling: () => void;

    /**
     * Disconnect WebSocket.
     * Backward-compatible name: was stopPolling(), now disconnects socket.
     */
    stopPolling: () => void;
}

/**
 * Derive the WebSocket URL from the API base URL.
 * VITE_API_URL may be like "https://api.example.com/api"
 * Socket.IO needs the origin: "https://api.example.com"
 * Time: O(1), Space: O(1)
 */
const getSocketUrl = (): string => {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    try {
        const url = new URL(apiUrl);
        return url.origin;
    } catch {
        // Fallback: strip "/api" suffix
        return apiUrl.replace(/\/api\/?$/, '') || window.location.origin;
    }
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    _socket: null,
    _pollingId: null,
    isConnected: false,

    fetchUnreadCount: async () => {
        try {
            const prevCount = get().unreadCount;
            const res = await apiClient.get('/notifications/unread-count');
            const count = res.data?.data?.unreadCount ?? 0;

            // Trigger alerts if count increased (fallback polling path)
            if (count > prevCount && prevCount >= 0) {
                triggerAlertEffects(count - prevCount);
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
        // Guard: don't create duplicate connections
        if (get()._socket || get()._pollingId) return;

        // Get auth token for socket authentication
        const token = localStorage.getItem('token');
        if (!token) {
            // No token = not logged in, use polling as fallback
            _startFallbackPolling(get, set);
            return;
        }

        const socketUrl = getSocketUrl();

        const socket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'], // prefer websocket, fall back to polling
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 30000,
            timeout: 10000,
        });

        // ── Socket Event Handlers ──

        socket.on('connect', () => {
            console.log('🔌 Notification socket connected');
            set({ isConnected: true });

            // Stop fallback polling if it was running
            const pollingId = get()._pollingId;
            if (pollingId) {
                clearInterval(pollingId);
                set({ _pollingId: null });
            }

            // Fetch initial unread count
            get().fetchUnreadCount();
        });

        // Real-time notification push from server
        socket.on('new_notification', (data: {
            notification: NotificationItem;
            unreadCount: number;
        }) => {
            const { notification, unreadCount } = data;

            set((state) => ({
                // Prepend new notification to list (if list is loaded)
                notifications: state.notifications.length > 0
                    ? [notification, ...state.notifications].slice(0, 50)
                    : state.notifications,
                unreadCount,
            }));

            // Trigger sound + toast + browser notification
            triggerAlertEffects(1);
        });

        socket.on('disconnect', (reason) => {
            console.log(`🔌 Notification socket disconnected: ${reason}`);
            set({ isConnected: false });

            // Start fallback polling while disconnected
            if (reason !== 'io client disconnect') {
                _startFallbackPolling(get, set);
            }
        });

        socket.on('connect_error', (error) => {
            console.warn('🔌 Socket connection error:', error.message);
            set({ isConnected: false });

            // Fallback to polling if socket can't connect
            if (!get()._pollingId) {
                _startFallbackPolling(get, set);
            }
        });

        socket.on('reconnect', () => {
            console.log('🔌 Socket reconnected');
            set({ isConnected: true });

            // Stop fallback polling
            const pollingId = get()._pollingId;
            if (pollingId) {
                clearInterval(pollingId);
                set({ _pollingId: null });
            }

            // Refresh count after reconnection
            get().fetchUnreadCount();
        });

        set({ _socket: socket });
    },

    stopPolling: () => {
        // Disconnect socket
        const socket = get()._socket;
        if (socket) {
            socket.disconnect();
            set({ _socket: null, isConnected: false });
        }

        // Clear fallback polling if active
        const pollingId = get()._pollingId;
        if (pollingId) {
            clearInterval(pollingId);
            set({ _pollingId: null });
        }
    },
}));

/**
 * Start fallback polling (30s interval) when WebSocket is unavailable.
 * Used as graceful degradation — keeps the app functional without socket.
 * Time: O(1), Space: O(1)
 */
function _startFallbackPolling(
    get: () => NotificationState,
    set: (partial: Partial<NotificationState>) => void
): void {
    if (get()._pollingId) return; // already polling

    // Fetch immediately
    get().fetchUnreadCount();

    // Poll every 30s (3x less frequent than original 10s)
    const id = setInterval(() => {
        get().fetchUnreadCount();
    }, 30_000);

    set({ _pollingId: id });
}
