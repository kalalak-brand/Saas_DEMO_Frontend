// src/stores/reviewStore.ts
import { create } from 'zustand';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

export interface ApiQuestion {
  _id: string;
  text: string;
  questionType: 'rating' | 'yes_no';
  category: string; // Dynamic - can be any category slug
}

export interface AnswerPayload {
  question: string;
  rating?: number;
  answerBoolean?: boolean;
  answerText?: string;
}

export interface GuestInfoPayload {
  name?: string;
  phone?: string;
  roomNumber?: string;
}

export interface ReviewPayload {
  category: string; // Dynamic - can be any category slug
  answers: AnswerPayload[];
  description?: string;
  guestInfo?: GuestInfoPayload;
  hotelCode?: string; // Hotel code for multi-tenancy isolation
}

interface ReviewState {
  questions: ApiQuestion[];
  answers: Record<string, number | boolean | null>;
  yesNoAnswerText: Record<string, string>;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  categoryInfo: { name: string; guestInfoFields?: { roomNumber?: boolean } } | null;
  hotelInfo: { _id: string; name: string; code: string } | null;

  fetchQuestions: (category: string, hotelCode: string) => Promise<void>;
  setAnswer: (questionId: string, answer: number | boolean) => void;
  setYesNoAnswerText: (questionId: string, text: string) => void;
  submitReview: (payload: ReviewPayload) => Promise<boolean>;
  resetReview: () => void;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  questions: [],
  answers: {},
  yesNoAnswerText: {},
  isLoading: false,
  isSubmitting: false,
  error: null,
  categoryInfo: null,
  hotelInfo: null,

  /**
   * Fetch questions using public API (no auth required)
   * Now requires hotelCode for multi-tenancy isolation
   * Time: O(1) API call, Space: O(n) questions
   */
  fetchQuestions: async (category: string, hotelCode: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get(`${BASE_URL}/public/questions/${category}`, {
        params: { hotel: hotelCode }
      });
      set({
        questions: res.data.data.questions || [],
        categoryInfo: res.data.data.category || null,
        hotelInfo: res.data.data.hotel || null,
        isLoading: false,
        error: null
      });
    } catch (err) {
      set({ error: 'Could not load questions.', isLoading: false });
    }
  },

  setAnswer: (questionId, answer) => {
    set(state => ({ answers: { ...state.answers, [questionId]: answer } }));
    // Clear text for "No" or "N/A" answers
    if (answer === false || answer === 0) {
      const newTextAnswers = { ...get().yesNoAnswerText };
      delete newTextAnswers[questionId];
      set({ yesNoAnswerText: newTextAnswers });
    }
  },

  setYesNoAnswerText: (questionId, text) => {
    set(state => ({
      yesNoAnswerText: { ...state.yesNoAnswerText, [questionId]: text }
    }));
  },

  /**
   * Submit review using public API (no auth required)
   * Includes hotelCode for multi-tenancy isolation
   * Time: O(1) API call, Space: O(n) answers
   */
  submitReview: async (payload) => {
    set({ isSubmitting: true, error: null });
    try {
      await axios.post(`${BASE_URL}/public/reviews`, payload);
      set({ isSubmitting: false });
      return true;
    } catch (err) {
      set({ error: 'Submission failed. Please try again.', isSubmitting: false });
      return false;
    }
  },

  resetReview: () => set({ answers: {}, questions: [], yesNoAnswerText: {}, categoryInfo: null, hotelInfo: null }),
}));
