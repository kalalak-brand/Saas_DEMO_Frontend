import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Define the period type, adding 'Custom'
export type PeriodType = 'Yearly' | 'Monthly' | 'Weekly' | 'Custom';

interface FilterControlState {
  isLoadingYears: boolean;
  selectedYear: number;
  selectedPeriod: PeriodType;
  selectedMonth: number; // 0-11 for Jan-Dec
  // Add state for custom date range
  startDate: string | null;
  endDate: string | null;
  availableYears: number[];
  setYear: (year: number) => void;
  setPeriod: (period: PeriodType) => void;
  setMonth: (month: number) => void;
  // Add action to set custom date range
  setCustomDateRange: (start: string, end: string) => void;
  fetchAvailableYears: () => Promise<void>;
}

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();
// Helper to format date as YYYY-MM-DD
// const formatDate = (date: Date): string => date.toISOString().split('T')[0];


export const useFilterControlStore = create<FilterControlState>((set, get) => ({
  isLoadingYears: true,
  selectedYear: currentYear,
  selectedPeriod: 'Monthly', // Default period
  selectedMonth: currentMonth,
  startDate: null, // Initialize custom dates
  endDate: null,   // Initialize custom dates
  availableYears: [currentYear], // Default until fetched

  setYear: (year) => {
    // When year changes, ensure period isn't Custom
    if (get().selectedPeriod === 'Custom') {
        set({ selectedYear: year, selectedPeriod: 'Monthly', startDate: null, endDate: null });
    } else {
        set({ selectedYear: year });
    }
  },
  setPeriod: (period) => {
    // If setting to custom, don't clear dates. If setting *away* from custom, clear dates.
    if (period !== 'Custom') {
        set({ selectedPeriod: period, startDate: null, endDate: null });
    } else {
        // We expect setCustomDateRange to be called to set dates for 'Custom'
        set({ selectedPeriod: period });
    }
  },
  setMonth: (month) => set({ selectedMonth: month }),

  setCustomDateRange: (start, end) => {
      set({
          startDate: start,
          endDate: end,
          selectedPeriod: 'Custom', // Set period to Custom
          // Optionally reset year/month if needed, or keep them as context
          // selectedYear: new Date(start).getFullYear(),
          // selectedMonth: new Date(start).getMonth(),
      });
  },

  fetchAvailableYears: async () => {
    set({ isLoadingYears: true });
    const token = useAuthStore.getState().token;
    try {
        if (!token) throw new Error('Not authenticated');
        // This config sends the token, which the backend uses to filter by hotelId
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get<{ data: { years: number[] } }>(
            `${BASE_URL}/analytics/available-years`, 
            config
        );
        const fetchedYears = response.data.data.years;

        if (fetchedYears && fetchedYears.length > 0) {
            const currentSelectedYear = get().selectedYear;
            const newSelectedYear = fetchedYears.includes(currentSelectedYear) ? currentSelectedYear : fetchedYears[0];
            set({
                availableYears: fetchedYears,
                selectedYear: newSelectedYear,
                isLoadingYears: false,
            });
        } else {
            set({ availableYears: [currentYear], selectedYear: currentYear, isLoadingYears: false });
        }
    } catch (err) {
        console.error("Failed to fetch available years", err);
        set({ availableYears: [currentYear], selectedYear: currentYear, isLoadingYears: false });
    }
  },
}));

// Export the hook with the new name
export const useFilters = useFilterControlStore; // Optional alias for easier use