import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';
import { ApiQuestion } from './reviewStore';

const BASE_URL = import.meta.env.VITE_API_URL;

export interface LowRatedReview {
  _id: string;
  date: string;
  category: 'room' | 'f&b' | 'cfc';
  questionId: string;
  questionText: string;
  point: number;
  guestName?: string | null;
  phone?: string | null;
  roomNumber?: string | null;
  email?: string | null;
}

interface ApiReportResponse {
  status: string;
  count: number;
  data: LowRatedReview[];
}

interface LowRatedReportState {
  questions: ApiQuestion[];
  reportData: LowRatedReview[];
  isLoadingQuestions: boolean;
  isLoadingReport: boolean;
  error: string | null;
  fetchRatingQuestions: () => Promise<void>;
  fetchLowRatedReport: (questionId: string, startDate: string, endDate: string) => Promise<void>;
  getQuestionById: (id: string) => ApiQuestion | undefined;
}

const getAuthHeader = () => {
  const token = useAuthStore.getState().token;
  // This helper correctly gets the token, which the backend uses
  // to filter by hotelId.
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const useLowRatedReportStore = create<LowRatedReportState>((set, get) => ({
  questions: [],
  reportData: [],
  isLoadingQuestions: false,
  isLoadingReport: false,
  error: null,

  /**
   * Fetches all questions and filters for rating questions.
   */
  fetchRatingQuestions: async () => {
    if (get().questions.length > 0) return;
    set({ isLoadingQuestions: true, error: null });
    try {
      // getAuthHeader() sends the token here
      const res = await axios.get(`${BASE_URL}/admin/management/questions`, getAuthHeader());
      const allQuestions = res.data.data.questions || [];
      const ratingQuestions = allQuestions.filter((q: ApiQuestion) => q.questionType === 'rating');
      set({ questions: ratingQuestions, isLoadingQuestions: false });
      console.log({ questions: ratingQuestions, isLoadingQuestions: false });
    } catch (err) {
      set({ error: 'Failed to load questions.', isLoadingQuestions: false });
    }
  },

  /**
   * Fetches the detailed report for a single question.
   */
  fetchLowRatedReport: async (questionId, startDate, endDate) => {
    set({ isLoadingReport: true, error: null, reportData: [] });
    try {
      const config = {
        ...getAuthHeader(), // getAuthHeader() sends the token here
        params: { startDate, endDate }
      };
      
      const res = await axios.get<ApiReportResponse>(
        `${BASE_URL}/analytics/low-rated-reviews/${questionId}`,
        config
      );
      
      set({ reportData: res.data.data, isLoadingReport: false });
      console.log({ reportData: res.data.data });
    } catch (err) {
      set({ error: 'Failed to load report data.', isLoadingReport: false });
    }
  },

  /**
   * Helper function to get a question's text from the store.
   */
  getQuestionById: (id: string) => {
    return get().questions.find(q => q._id === id);
 }
}));