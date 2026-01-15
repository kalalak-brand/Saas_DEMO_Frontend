import { create } from 'zustand';
import axios, { AxiosResponse } from 'axios';
import { useAuthStore } from './authStore';
import { useFilterControlStore } from './filterControlStore';
import { useFilterStore } from './filterStore';

// Ensure VITE_API_URL is correctly set in your .env file
const BASE_URL = import.meta.env.VITE_API_URL;

export type AnalyticsItemType = 'composite' | 'question';
export type ChartDataPoint = { name: string; value: number };

// Interface for backend response from average endpoints
interface AverageResponseItem {
    name: string;
    value: number;
    compositeId?: string; // ID for composites
    questionId?: string; // ID for questions (if backend provides)
}

interface AnalyticsState {
    currentItemId: string | null;
    currentItemName: string | null;
    currentItemType: AnalyticsItemType | null;
    mainChartData: ChartDataPoint[];
    breakdownData: ChartDataPoint[]; // Only for composites
    isLoadingMain: boolean;
    isLoadingBreakdown: boolean;
    error: string | null;
    fetchAnalyticsData: (
        itemId: string,
        itemName: string,
        itemType: AnalyticsItemType
    ) => Promise<void>;
    resetSelection: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set, _) => ({
    currentItemId: null,
    currentItemName: null,
    currentItemType: null,
    mainChartData: [],
    breakdownData: [],
    isLoadingMain: false,
    isLoadingBreakdown: false,
    error: null,

    resetSelection: () => {
        set({
            currentItemId: null, currentItemName: null, currentItemType: null,
            mainChartData: [], breakdownData: [],
            isLoadingMain: false, isLoadingBreakdown: false, error: null,
        });
    },

    fetchAnalyticsData: async (itemId, itemName, itemType) => {
        set({
            currentItemId: itemId, currentItemName: itemName, currentItemType: itemType,
            isLoadingMain: true, isLoadingBreakdown: itemType === 'composite',
            error: null, mainChartData: [], breakdownData: []
        });

        const { selectedYear, selectedPeriod, selectedMonth, startDate, endDate } = useFilterControlStore.getState();
        // ✅ This token now contains the hotelId, which the backend will use
        const token = useAuthStore.getState().token;
        const { category } = useFilterStore.getState();

        if (!token) {
            set({ error: 'Auth token missing.', isLoadingMain: false, isLoadingBreakdown: false });
            console.error("Auth token missing in fetchAnalyticsData");
            return;
        }

        // ✅ This config correctly sends the token in the header
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log(`Fetching Analytics: Type=${itemType}, Name=${itemName}, Period=${selectedPeriod}, Category=${category}`);

        try {
            let mainChartPromise: Promise<AxiosResponse | null>;
            let breakdownPromise: Promise<AxiosResponse | null> = Promise.resolve(null);

            let mainChartStartDate: string | null = null;
            let mainChartEndDate: string | null = null;
            let breakdownStartDate: string | null = null;
            let breakdownEndDate: string | null = null;

            let mainChartEndpoint = '';
            let mainChartParams: any = {};
            let needsAverageEndpoint = false;

            // Determine date ranges and API endpoints based on the selected period
            if (selectedPeriod === 'Yearly' || selectedPeriod === 'Custom') {
                needsAverageEndpoint = true;
                mainChartStartDate = selectedPeriod === 'Yearly' ? `${selectedYear}-01-01` : startDate;
                mainChartEndDate = selectedPeriod === 'Yearly' ? `${selectedYear}-12-31` : endDate;
                breakdownStartDate = mainChartStartDate;
                breakdownEndDate = mainChartEndDate;

                if (!mainChartStartDate || !mainChartEndDate) {
                    throw new Error("Start or End date is missing for Yearly/Custom period.");
                }

                // Select endpoint based on item type
                if (itemType === 'composite') {
                    mainChartEndpoint = `${BASE_URL}/analytics/composite-averages`;
                    mainChartParams = { startDate: mainChartStartDate, endDate: mainChartEndDate, category };
                    console.log(`Yearly/Custom: Calling ${mainChartEndpoint} for Composite`);
                } else { // Question
                    mainChartEndpoint = `${BASE_URL}/analytics/question-average`;
                    mainChartParams = { startDate: mainChartStartDate, endDate: mainChartEndDate, category, questionId: itemId };
                    console.log(`Yearly/Custom: Calling ${mainChartEndpoint} for Question`);
                }

            } else { // Monthly or Weekly
                mainChartStartDate = `${selectedYear}-01-01`;
                mainChartEndDate = `${selectedYear}-12-31`;
                breakdownStartDate = mainChartStartDate;
                breakdownEndDate = mainChartEndDate;

                if (itemType === 'composite') {
                    mainChartEndpoint = `${BASE_URL}/analytics/composite-over-time`;
                    mainChartParams = { year: selectedYear, period: selectedPeriod, month: selectedPeriod === 'Weekly' ? selectedMonth : undefined, compositeId: itemId, category };
                    console.log(`Monthly/Weekly: Calling ${mainChartEndpoint} for Composite`);
                } else { // Question
                    mainChartEndpoint = `${BASE_URL}/analytics/question-over-time`;
                    mainChartParams = { year: selectedYear, period: selectedPeriod, month: selectedPeriod === 'Weekly' ? selectedMonth : undefined, questionId: itemId, category };
                    console.log(`Monthly/Weekly: Calling ${mainChartEndpoint} for Question`);
                }
            }

            // Set up the main chart API call promise
            mainChartPromise = axios.get(mainChartEndpoint, { ...config, params: mainChartParams });

            // Set up the breakdown API call promise ONLY if the item is a composite
            if (itemType === 'composite') {
                console.log(`Fetching Breakdown for composite ${itemId} using dates: ${breakdownStartDate} to ${breakdownEndDate}`);
                const breakdownConfig = {
                    ...config,
                    params: { startDate: breakdownStartDate, endDate: breakdownEndDate, category, compositeId: itemId }
                };
                breakdownPromise = axios.get(`${BASE_URL}/analytics/question-averages`, breakdownConfig);
            } else {
                set({ isLoadingBreakdown: false });
            }


            // --- Fetch data concurrently ---
            const [mainChartRes, breakdownRes] = await Promise.all([mainChartPromise, breakdownPromise]);

            // --- Process main chart data ---
            let formattedMainData: ChartDataPoint[] = [];
            if (mainChartRes?.data?.data) {
                const responseData = mainChartRes.data.data;

                if (needsAverageEndpoint) { // Yearly or Custom
                    const periodLabel = selectedPeriod === 'Yearly' ? `${selectedYear} Avg` : 'Custom Avg';
                    let foundData: AverageResponseItem | undefined;

                    if (itemType === 'composite') {
                        foundData = (responseData as AverageResponseItem[]).find(c => c && c.name === itemName);
                    } else {
                        foundData = Array.isArray(responseData) ? responseData[0] : responseData;
                    }

                    console.log(`Searching for "${itemName}" in ${selectedPeriod} data. Found:`, foundData);
                    if (foundData && typeof foundData.value === 'number') {
                        formattedMainData = [{ name: periodLabel, value: foundData.value }];
                    } else {
                        console.warn(`${selectedPeriod} data object NOT FOUND or invalid for ${itemType} NAME ${itemName}. Response Data:`, responseData);
                        formattedMainData = [];
                    }

                } else { // Monthly or Weekly
                    console.log("Monthly/Weekly response data received:", responseData);
                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    formattedMainData = (responseData as any[]).reduce((acc: ChartDataPoint[], item: any) => {
                        if (item && typeof item.name === 'string' && typeof item.value === 'number') {
                            let name = item.name;
                            if (selectedPeriod === 'Monthly') {
                                const monthIndex = parseInt(item.name) - 1;
                                name = (monthIndex >= 0 && monthIndex < 12) ? months[monthIndex] : `M${item.name}`;
                            } else if (selectedPeriod === 'Weekly') {
                                const weekNum = parseInt(item.name);
                                name = !isNaN(weekNum) ? `W${weekNum + 1}` : `W${item.name}`;
                            }
                            acc.push({ name: name, value: item.value });
                        } else {
                            console.warn("Invalid item structure in Monthly/Weekly response:", item);
                        }
                        return acc;
                    }, []);
                }
            } else if (mainChartRes) {
                console.log(`Main chart response received, but data property missing/null for ${itemType} ${itemName}:`, mainChartRes.data);
                formattedMainData = [];
            } else {
                console.log(`Main chart promise resolved to null for ${itemType} ${itemName}.`);
                formattedMainData = [];
            }

            console.log(">>> FINAL formattedMainData before setting state:", formattedMainData);
            set({ mainChartData: formattedMainData, isLoadingMain: false });

            // --- Process and set breakdown data ---
            const rawBreakdownData = breakdownRes?.data?.data ?? [];

            // ✅ SANITIZATION: Map through items and ensure 'value' is a number (default to 0 if null)
            const breakdownResultData = rawBreakdownData.map((item: AverageResponseItem) => ({
                ...item,
                value: (item.value !== null && item.value !== undefined) ? Number(item.value) : 0
            }));

            console.log("Setting breakdownData:", breakdownResultData);
            set({ breakdownData: breakdownResultData, isLoadingBreakdown: false });


        } catch (err) {
            console.error(`Fetch analytics error for ${itemType} ${itemName}:`, err);
            let errorMsg = `Failed to fetch data for ${itemName}.`;
            if (axios.isAxiosError(err)) {
                errorMsg = err.response?.data?.message || err.message || errorMsg;
                console.error("Axios Error Details:", err.response?.status, err.response?.data);
            } else if (err instanceof Error) {
                errorMsg = err.message;
            }
            set({ error: errorMsg, isLoadingMain: false, isLoadingBreakdown: false, mainChartData: [], breakdownData: [] });
        }
    },
}));