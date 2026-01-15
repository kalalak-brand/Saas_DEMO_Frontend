import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';
import { AnalyticsItemType, ChartDataPoint } from './analyticsStore'; // Reuse types

const BASE_URL = import.meta.env.VITE_API_URL;

// Helper to get default dates
const getISODate = (offsetDays: number = 0): string => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().split('T')[0];
};

interface ComparisonItem {
    id: string;
    name: string;
    type: AnalyticsItemType;
}

interface DateRange {
    start: string;
    end: string;
}

interface AverageResponseItem {
    name: string;
    value: number;
}

// Category is now dynamic string type

interface ComparisonState {
    selectedItem: ComparisonItem | null;
    dateRangeA: DateRange;
    dateRangeB: DateRange;
    comparisonData: ChartDataPoint[] | null;
    isLoading: boolean;
    error: string | null;
    setSelectedItem: (item: ComparisonItem | null) => void;
    setDateRangeA: (range: DateRange) => void;
    setDateRangeB: (range: DateRange) => void;
    fetchComparisonData: (category: string) => Promise<void>;
    resetComparison: () => void;
}

const defaultDateRangeA = { start: getISODate(-7), end: getISODate(0) };
const defaultDateRangeB = { start: getISODate(-14), end: getISODate(-8) };

export const useComparisonStore = create<ComparisonState>((set, get) => ({
    selectedItem: null,
    dateRangeA: defaultDateRangeA,
    dateRangeB: defaultDateRangeB,
    comparisonData: null,
    isLoading: false,
    error: null,

    setSelectedItem: (item) => set({ selectedItem: item, comparisonData: null, error: null }),
    setDateRangeA: (range) => set({ dateRangeA: range, comparisonData: null }),
    setDateRangeB: (range) => set({ dateRangeB: range, comparisonData: null }),

    resetComparison: () => set({
        selectedItem: null,
        comparisonData: null,
        error: null,
        isLoading: false,
        dateRangeA: defaultDateRangeA,
        dateRangeB: defaultDateRangeB,
    }),

    fetchComparisonData: async (category) => {
        const { selectedItem, dateRangeA, dateRangeB, isLoading } = get();
        // This token is sent with the request. The backend will use it
        // to identify the user and filter by their hotelId.
        const token = useAuthStore.getState().token;


        if (isLoading) {
            console.log("Comparison fetch already in progress. Aborting.");
            return;
        }

        if (!selectedItem) {
            set({ error: "No item selected." });
            return;
        }
        if (!token) {
            set({ error: "Not authenticated." });
            return;
        }

        set({ isLoading: true, error: null, comparisonData: null });

        const config = { headers: { Authorization: `Bearer ${token}` } };

        const endpoint = selectedItem.type === 'composite'
            ? `${BASE_URL}/analytics/composite-averages`
            : `${BASE_URL}/analytics/question-average`;

        const fetchDataForRange = async (range: DateRange): Promise<AverageResponseItem | null> => {
            const params: any = {
                startDate: range.start,
                endDate: range.end,
                category: category,
            };
            if (selectedItem.type === 'question') {
                params.questionId = selectedItem.id;
            }

            const response = await axios.get<{ data: any }>(endpoint, { ...config, params });
            const responseData = response.data.data;

            if (!responseData) return null;

            if (selectedItem.type === 'composite') {
                return (responseData as AverageResponseItem[]).find(c => c.name === selectedItem.name) || null;
            } else {
                return responseData as AverageResponseItem;
            }
        };

        try {
            const [resultA, resultB] = await Promise.all([
                fetchDataForRange(dateRangeA),
                fetchDataForRange(dateRangeB)
            ]);

            const dataA = resultA?.value ?? 0;
            const dataB = resultB?.value ?? 0;

            set({
                comparisonData: [
                    { name: `Period A (${rangeToLabel(dateRangeA)})`, value: dataA },
                    { name: `Period B (${rangeToLabel(dateRangeB)})`, value: dataB },
                ],
                isLoading: false,
            });

        } catch (err) {
            console.error("Failed to fetch comparison data:", err);
            let errorMsg = 'Failed to load comparison data.';
            if (axios.isAxiosError(err) && err.response?.data?.message) { errorMsg = err.response.data.message; }
            else if (err instanceof Error) { errorMsg = err.message; }
            set({ error: errorMsg, isLoading: false });
        }
    },
}));

// Helper to format date labels
const rangeToLabel = (range: DateRange) => {
    const start = new Date(range.start + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const end = new Date(range.end + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    return `${start} to ${end}`;
};