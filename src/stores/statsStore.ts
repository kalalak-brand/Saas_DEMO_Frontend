import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';

const BASE_URL = import.meta.env.VITE_API_URL;
interface Stats {
    totalReviews: number;
    totalStaff: number;
    activeStaff: number;
}

interface StatsState {
    stats: Stats;
    isLoading: boolean;
    // Dynamic: accepts any category slug
    fetchStats: (category: string) => Promise<void>;
}

export const useStatsStore = create<StatsState>((set) => ({
    stats: { totalReviews: 0, totalStaff: 0, activeStaff: 0 },
    isLoading: true,
    fetchStats: async (category) => {
        set({ isLoading: true });

        const token = useAuthStore.getState().token;

        // This config sends the token for all requests
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // This config adds the category param for the review stats request
        const reviewStatsConfig = {
            ...config,
            params: { category: category }
        };

        try {
            const [reviewStatsRes, userStatsRes] = await Promise.all([
                // Backend filters this by token (for hotelId) AND category
                axios.get(`${BASE_URL}/analytics/stats`, reviewStatsConfig),
                // Backend filters this by token (for hotelId)
                axios.get(`${BASE_URL}/users/stats`, config)
            ]);

            set({
                stats: {
                    totalReviews: reviewStatsRes.data.data.totalSubmissions || 0,
                    totalStaff: userStatsRes.data.data.totalStaff || 0,
                    activeStaff: userStatsRes.data.data.activeStaff || 0,
                },
                isLoading: false
            });
            console.log({
                "stats": {
                    totalReviews: reviewStatsRes.data.data.totalSubmissions || 0,
                    totalStaff: userStatsRes.data.data.totalStaff || 0,
                    activeStaff: userStatsRes.data.data.activeStaff || 0,
                }
            });
        } catch (error) {
            console.error("Failed to fetch stats", error);
            set({ isLoading: false });
        }
    },
}));