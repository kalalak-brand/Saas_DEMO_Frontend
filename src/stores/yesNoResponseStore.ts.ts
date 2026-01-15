import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore'; // Ensure path is correct

const BASE_URL = import.meta.env.VITE_API_URL;

interface YesNoAnswerPair {
    questionText: string;
    answer: boolean;
    answerText?: string;
}

export interface GuestInfo {
    name?: string;
    phone?: string;
    roomNumber?: string;
    email?: string;
}

export interface YesNoReviewResponse {
    _id: string;
    createdAt: string;
    description?: string;
    guestInfo?: GuestInfo;
    yesNoAnswers: YesNoAnswerPair[];
}

interface YesNoResponseState {
    responses: YesNoReviewResponse[];
    isLoading: boolean;
    error: string | null;
    // Changed to string to support dynamic categories
    fetchResponses: (category: string, startDate?: string, endDate?: string) => Promise<void>;
}


export const useYesNoResponseStore = create<YesNoResponseState>((set) => ({
    responses: [],
    isLoading: false,
    error: null,

    fetchResponses: async (category, startDate, endDate) => {
        set({ isLoading: true, error: null, responses: [] });
        const token = useAuthStore.getState().token;
        const params: any = { category };
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        const config = {
            headers: { Authorization: `Bearer ${token}` }, // Token is sent here
            params: params
        };

        try {
            const response = await axios.get<{ data: YesNoReviewResponse[] }>(
                `${BASE_URL}/analytics/yes-no-responses`, // Backend filters this by token
                config
            );
            set({ responses: response.data.data, isLoading: false });
            console.log({ "yesNoReviewResponses": response.data.data });
        } catch (err) {
            console.error("Failed to fetch yes/no responses:", err);
            const errorMsg = axios.isAxiosError(err) && err.response?.data?.message
                ? err.response.data.message
                : 'Failed to load responses.';
            set({ error: errorMsg, isLoading: false });
        }
    },
}));