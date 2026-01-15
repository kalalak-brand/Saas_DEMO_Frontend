// src/stores/reportStore.ts

import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';
import { generateYearlyReportPDF, FullReportData } from '../utils/pdfReportGenerator';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL;

// --- Interfaces for the API response ---
// (No changes needed in interfaces)
interface ApiDailyBreakdown {
  date: string;
  overallAverage: number;
  totalReviews: number;
}
interface ApiMonthlyQuestionAvg {
  questionId: string;
  questionText: string;
  averages: number[];
}
interface ApiYearlyQuestionAvg {
  questionId: string;
  questionText: string;
  yearlyAverage: number;
  totalReviews: number;
}
interface ApiMonthlyCompositeAvg {
  compositeId: string;
  compositeName: string;
  averages: number[];
}
interface ApiYearlyCompositeAvg {
  compositeId: string;
  compositeName: string;
  yearlyAverage: number;
}
interface ApiDashboardResponse {
  dailyBreakdown: ApiDailyBreakdown[];
  monthlyQuestionAverages: ApiMonthlyQuestionAvg[];
  yearlyQuestionAverages: ApiYearlyQuestionAvg[];
  monthlyCompositeAverages: ApiMonthlyCompositeAvg[];
  yearlyCompositeAverages: ApiYearlyCompositeAvg[];
}

// --- Zustand Store ---

interface ReportState {
  isModalOpen: boolean;
  isLoadingYears: boolean;
  isLoadingReport: boolean;
  availableYears: number[];
  error: string | null;
  openModal: () => void;
  closeModal: () => void;
  // ✅ UPDATED: Added 'cfc' to the category type
  fetchAvailableYears: (category: 'room' | 'f&b' | 'cfc') => Promise<void>;
  downloadReport: (year: number, category: 'room' | 'f&b' | 'cfc') => Promise<void>;
  clearYears: () => void;
}

export const useReportStore = create<ReportState>((set) => ({
  isModalOpen: false,
  isLoadingYears: false,
  isLoadingReport: false,
  availableYears: [],
  error: null,

  openModal: () => set({ isModalOpen: true, error: null, availableYears: [] }),
  closeModal: () => set({ isModalOpen: false }),
  clearYears: () => set({ availableYears: [] }),

  // ✅ UPDATED: Function signature now includes 'cfc'
  fetchAvailableYears: async (category) => {
    set({ isLoadingYears: true, error: null });
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ isLoadingYears: false, error: 'Not authenticated' });
      return;
    }
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
        params: { category },
      };
      const response = await axios.get<number[]>(
        `${BASE_URL}/analytics/years`,
        config
      );
      set({ availableYears: response.data || [], isLoadingYears: false });
    } catch (err) {
      console.error('Failed to fetch available years:', err);
      set({ error: 'Could not load years.', isLoadingYears: false });
    }
  },

  // ✅ UPDATED: Function signature now includes 'cfc'
  downloadReport: async (year, category) => {
    set({ isLoadingReport: true, error: null });
    const token = useAuthStore.getState().token;
    const toastId = toast.loading('Generating report... This may take a moment.');

    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
        params: { year, category },
      };

      const response = await axios.get<ApiDashboardResponse>(
        `${BASE_URL}/analytics/full-yearly-report`,
        config
      );
      const apiData = response.data;
      if (!apiData) {
        throw new Error('No data received from server.');
      }
      
      // Data transformation logic remains the same
      const transformedData: FullReportData = {
        questionHeaders: apiData.yearlyQuestionAverages.map((q) => ({
          id: q.questionId,
          text: q.questionText,
        })),
        dailyBreakdown: apiData.dailyBreakdown,
        dailyData: [], 
        monthlyData: {
          questions: apiData.monthlyQuestionAverages.map((q) => ({
            name: q.questionText,
            averages: q.averages.map(avg => avg === 0 ? "N/A" : avg.toFixed(2)),
          })),
          composites: apiData.monthlyCompositeAverages.map((c) => ({
            name: c.compositeName,
            averages: c.averages.map(avg => avg === 0 ? "N/A" : avg.toFixed(2)),
          })),
        },
        yearlyData: {
          questions: apiData.yearlyQuestionAverages.map((q) => ({
            name: q.questionText,
            value: q.yearlyAverage,
          })),
          composites: apiData.yearlyCompositeAverages.map((c) => ({
            name: c.compositeName,
            value: c.yearlyAverage,
          })),
        },
      };

      generateYearlyReportPDF(transformedData, year, category);

      toast.success('Report downloaded successfully!', { id: toastId });
      set({ isLoadingReport: false, isModalOpen: false });
    } catch (err) {
      let errorMsg = 'Failed to generate report.';
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      console.error('Failed to download report:', err);
      toast.error(errorMsg, { id: toastId });
      set({ error: errorMsg, isLoadingReport: false });
    }
  },
}));