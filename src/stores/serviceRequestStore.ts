/**
 * Service Request Store (Zustand)
 * State management for guest service requests (Kalalak X)
 *
 * Public API calls (no auth) for guest-facing forms
 * Authenticated API calls for staff dashboard
 *
 * Time: O(1) state updates, Space: O(n) where n = requests
 */
import { create } from 'zustand';
import axios from 'axios';
import { apiClient } from '../utils/apiClient';

const PUBLIC_API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Types ──

export interface ServiceRequestType {
    value: string;
    label: string;
    department: string;
    icon: string;
}

export interface ServiceRequest {
    _id: string;
    hotelId: string;
    guestInfo: {
        name?: string;
        phone?: string;
        roomNumber: string;
    };
    requestType: string;
    department: string;
    customMessage?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'escalated';
    assignedTo?: { _id: string; fullName: string };
    completedAt?: string;
    responseTimeMinutes?: number;
    feedbackRating?: number;
    feedbackComment?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ServiceRequestStats {
    overview: {
        total: number;
        pending: number;
        inProgress: number;
        completed: number;
        avgResponseTime: number | null;
        avgFeedbackRating: number | null;
    };
    byDepartment: Array<{
        _id: string;
        total: number;
        pending: number;
        completed: number;
        avgResponseTime: number | null;
    }>;
    byRequestType: Array<{
        _id: string;
        count: number;
        label: string;
    }>;
}

export interface HotelPublicInfo {
    _id: string;
    name: string;
    code: string;
    googleReviewLink?: string;
    postReviewMessage?: string;
}

interface ServiceRequestState {
    // Guest-facing state
    requestTypes: ServiceRequestType[];
    requestTypesHotelId: string | null;
    hotelInfo: HotelPublicInfo | null;
    isLoadingTypes: boolean;
    isSubmitting: boolean;
    submitSuccess: boolean;
    submitResult: {
        requestId?: string;
        referenceId?: string;
        department?: string;
        requestLabel?: string;
    } | null;

    // Staff dashboard state
    requests: ServiceRequest[];
    stats: ServiceRequestStats | null;
    isLoadingRequests: boolean;
    isLoadingStats: boolean;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };

    // Actions — Public (no auth)
    fetchRequestTypes: (hotelId?: string) => Promise<void>;
    fetchHotelInfo: (hotelCode: string, orgSlug?: string) => Promise<void>;
    submitServiceRequest: (data: {
        hotelCode: string;
        orgSlug?: string;
        requestType: string;
        roomNumber: string;
        guestName?: string;
        guestPhone?: string;
        customMessage?: string;
    }) => Promise<boolean>;
    submitFeedback: (requestId: string, rating: number, comment?: string) => Promise<{
        googleReviewLink?: string;
        message: string;
    } | null>;
    resetSubmitState: () => void;

    // Actions — Authenticated (staff dashboard)
    fetchRequests: (filters?: {
        status?: string;
        department?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }) => Promise<void>;
    updateRequestStatus: (id: string, status: string) => Promise<boolean>;
    fetchStats: (filters?: {
        startDate?: string;
        endDate?: string;
        department?: string;
    }) => Promise<void>;
}

export const useServiceRequestStore = create<ServiceRequestState>((set, get) => ({
    // Initial state
    requestTypes: [],
    requestTypesHotelId: null,
    hotelInfo: null,
    isLoadingTypes: false,
    isSubmitting: false,
    submitSuccess: false,
    submitResult: null,
    requests: [],
    stats: null,
    isLoadingRequests: false,
    isLoadingStats: false,
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },

    // ── Public Actions ──

    /** Fetch available service request types. Time: O(1), Space: O(t) */
    fetchRequestTypes: async (hotelId) => {
        if (!hotelId) {
            set({ requestTypes: [], requestTypesHotelId: null, isLoadingTypes: false });
            return;
        }

        if (get().requestTypesHotelId === hotelId && get().requestTypes.length > 0) return;

        set({ isLoadingTypes: true });
        try {
            const { data } = await axios.get(`${PUBLIC_API}/public/service-request-types`, {
                params: { hotelId },
            });
            set({
                requestTypes: data.data?.types || [],
                requestTypesHotelId: hotelId,
                isLoadingTypes: false,
            });
        } catch (err) {
            console.error('[ServiceRequestStore] fetchRequestTypes failed:', err);
            set({ isLoadingTypes: false, requestTypes: [], requestTypesHotelId: hotelId });
        }
    },

    /** Fetch hotel info for landing page. Time: O(1), Space: O(1) */
    fetchHotelInfo: async (hotelCode: string, orgSlug?: string) => {
        try {
            const url = orgSlug
                ? `${PUBLIC_API}/public/org/${orgSlug}/hotel-info/${hotelCode}`
                : `${PUBLIC_API}/public/hotel-info/${hotelCode}`;
            const { data } = await axios.get(url);
            set({ hotelInfo: data.data?.hotel || null });
        } catch (err) {
            console.error('[ServiceRequestStore] fetchHotelInfo failed:', err);
        }
    },

    /** Submit a service request (public, no auth). Time: O(1), Space: O(1) */
    submitServiceRequest: async (requestData) => {
        set({ isSubmitting: true, submitSuccess: false, submitResult: null });
        try {
            const { data } = await axios.post(`${PUBLIC_API}/public/service-requests`, requestData);
            set({
                isSubmitting: false,
                submitSuccess: true,
                submitResult: {
                    requestId: data.data?.requestId,
                    referenceId: data.data?.referenceId,
                    department: data.data?.department,
                    requestLabel: data.data?.requestLabel,
                },
            });
            return true;
        } catch (err) {
            console.error('[ServiceRequestStore] submitServiceRequest failed:', err);
            set({ isSubmitting: false, submitSuccess: false });
            return false;
        }
    },

    /** Submit post-service feedback (public). Time: O(1) */
    submitFeedback: async (requestId, rating, comment) => {
        try {
            const { data } = await axios.post(
                `${PUBLIC_API}/public/service-requests/${requestId}/feedback`,
                { rating, comment }
            );
            return {
                googleReviewLink: data.data?.googleReviewLink,
                message: data.data?.message || 'Thank you!',
            };
        } catch (err) {
            console.error('[ServiceRequestStore] submitFeedback failed:', err);
            return null;
        }
    },

    resetSubmitState: () => {
        set({ submitSuccess: false, submitResult: null, isSubmitting: false });
    },

    // ── Authenticated Actions ──

    /** Fetch service requests for staff dashboard. Time: O(n), Space: O(page_size) */
    fetchRequests: async (filters) => {
        console.log('[DEBUG fetchRequests] CALLED with filters:', filters);
        set({ isLoadingRequests: true });
        try {
            const params: Record<string, string | number> = {};
            if (filters?.status) params.status = filters.status;
            if (filters?.department) params.department = filters.department;
            if (filters?.startDate) params.startDate = filters.startDate;
            if (filters?.endDate) params.endDate = filters.endDate;
            params.page = filters?.page || 1;
            params.limit = filters?.limit || 20;

            console.log('[DEBUG fetchRequests] Making API call with params:', params);
            const { data } = await apiClient.get('/service-requests', { params });
            console.log('[DEBUG fetchRequests] API response:', data);
            set({
                requests: data.data?.requests || [],
                pagination: data.data?.meta || { page: 1, limit: 20, total: 0, totalPages: 0 },
                isLoadingRequests: false,
            });
        } catch (err) {
            console.error('[ServiceRequestStore] fetchRequests FAILED:', err);
            console.error('[DEBUG fetchRequests] Error details:', (err as any)?.response?.status, (err as any)?.response?.data);
            set({ isLoadingRequests: false });
        }
    },

    /** Update service request status. Time: O(1) */
    updateRequestStatus: async (id, status) => {
        try {
            await apiClient.patch(`/service-requests/${id}/status`, { status });
            // Update local state optimistically
            set((state) => ({
                requests: state.requests.map((r) =>
                    r._id === id ? { ...r, status: status as ServiceRequest['status'] } : r
                ),
            }));
            return true;
        } catch (err) {
            console.error('[ServiceRequestStore] updateRequestStatus failed:', err);
            return false;
        }
    },

    /** Fetch service request stats. Time: O(n) aggregation */
    fetchStats: async (filters) => {
        console.log('[DEBUG fetchStats] CALLED with filters:', filters);
        set({ isLoadingStats: true });
        try {
            const params: Record<string, string> = {};
            if (filters?.startDate) params.startDate = filters.startDate;
            if (filters?.endDate) params.endDate = filters.endDate;
            if (filters?.department) params.department = filters.department;

            console.log('[DEBUG fetchStats] Making API call with params:', params);
            const { data } = await apiClient.get('/service-requests/stats', { params });
            console.log('[DEBUG fetchStats] API response:', data);
            set({ stats: data.data || null, isLoadingStats: false });
        } catch (err) {
            console.error('[ServiceRequestStore] fetchStats failed:', err);
            set({ isLoadingStats: false });
        }
    },
}));
