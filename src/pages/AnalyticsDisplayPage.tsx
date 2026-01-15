// pages/AnalyticsDisplayPage.tsx
import React, { useMemo } from "react";
import { useFilterControlStore } from "../stores/filterControlStore";
import { useAnalyticsStore } from "../stores/analyticsStore";
import { BarDiagram } from "../components/Charts/BarDiagram";
import { PieChartt } from "../components/Charts/PieChartt";
import { LineChartt } from "../components/Charts/LineChartt";
import { FilterBar } from "../components/common/FilterBar";
import StatsBar from "../components/common/StatsBar";
import { useChart } from "../context/ChartContext";


// 1. Smooth Loading Animation Component
const LoadingState: React.FC<{ message?: string; height?: string }> = ({
    message = "Loading analytics...",
    height = "h-72"
}) => (
    <div className={`w-full ${height} flex flex-col items-center justify-center bg-white/50 rounded-lg`}>
        <div className="relative flex items-center justify-center">
            {/* Outer ring */}
            <div className="absolute animate-ping inline-flex h-12 w-12 rounded-full bg-primary/20 opacity-75"></div>
            {/* Spinner */}
            <svg className="animate-spin h-8 w-8 text-primary relative z-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
        <p className="mt-4 text-sm font-medium text-gray-400 animate-pulse">{message}</p>
    </div>
);

// 2. Empty / Error State Component
const EmptyState: React.FC<{ title: string; subtitle?: string; isError?: boolean }> = ({
    title,
    subtitle,
    isError = false
}) => (
    <div className={`w-full h-72 flex flex-col items-center justify-center rounded-lg border-2 border-dashed ${isError ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50/50'}`}>
        <div className={`p-3 rounded-full mb-3 ${isError ? 'bg-red-100' : 'bg-gray-100'}`}>
            <svg className={`w-6 h-6 ${isError ? 'text-red-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isError ? "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" : "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"} />
            </svg>
        </div>
        <h3 className={`font-semibold ${isError ? 'text-red-600' : 'text-gray-600'}`}>{title}</h3>
        {subtitle && <p className="text-sm text-gray-400 mt-1 max-w-xs text-center">{subtitle}</p>}
    </div>
);

// --- Sub-Components ---

const BreakdownChart: React.FC<{ data: { name: string; value: number | null } }> = ({ data }) => {
    const safeValue = typeof data.value === 'number' ? data.value : 0;

    const chartData = useMemo(() => [
        { name: data.name, value: safeValue },
        { name: "", value: Math.max(0, 10 - safeValue) },
    ], [data.name, safeValue]);

    return (
        <div className="w-full text-center py-4 bg-[#FAFBFF] rounded-lg shadow-md flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
            <h3 className="font-semibold text-sm text-[#949CA1] px-6 h-12 flex items-center justify-center line-clamp-2" title={data.name}>
                {data.name}
            </h3>
            <div className="flex-1">
                <PieChartt data={chartData} title={null} size="small" />
            </div>
            <p className="font-bold text-xl text-primary mt-2">{safeValue.toFixed(2)}</p>
        </div>
    );
};

// --- Main Page Component ---

const AnalyticsDisplayPage: React.FC = () => {
    const { activeChart } = useChart();
    const { selectedPeriod } = useFilterControlStore();
    const {
        currentItemName,
        currentItemType,
        mainChartData,
        breakdownData,
        isLoadingMain,
        isLoadingBreakdown,
        error,
    } = useAnalyticsStore();

    // Function to render the main chart content
    const renderActiveChart = () => {
        // 1. Loading State
        if (isLoadingMain) {
            return <LoadingState message="Fetching chart data..." />;
        }

        // 2. Error State
        if (error && mainChartData.length === 0) {
            return <EmptyState title="Error Loading Data" subtitle={error} isError={true} />;
        }

        // 3. No Selection State
        if (!currentItemName) {
            return <EmptyState title="No Item Selected" subtitle="Please select an item from the sidebar to view analytics." />;
        }

        // 4. Empty Data State
        if (!mainChartData || mainChartData.length === 0) {
            return <EmptyState title="No Data Yet" subtitle="There is no analytics data for this time period. Reviews will appear here once submitted." />;
        }

        const chartTitle = currentItemName || "Analytics Data";

        switch (activeChart) {
            case "bar":
                return <BarDiagram data={mainChartData} title={chartTitle} />;
            case "line":
                if ((selectedPeriod === 'Yearly' || selectedPeriod === 'Custom') && mainChartData.length <= 1) {
                    return <BarDiagram data={mainChartData} title={chartTitle} />;
                }
                return <LineChartt data={mainChartData} title={chartTitle} />;
            case "pie":
                if (mainChartData.length === 1) {
                    const singlePointData = [
                        { name: mainChartData[0].name, value: mainChartData[0].value },
                        { name: "", value: Math.max(0, 10 - mainChartData[0].value) }
                    ];
                    return <PieChartt data={singlePointData} title={chartTitle} size="medium" showLabels={true} />;
                } else {
                    return <PieChartt data={mainChartData} title={chartTitle} size="medium" showLabels={true} />;
                }
            default:
                return <BarDiagram data={mainChartData} title={chartTitle} />;
        }
    };

    const cardStyle = "bg-white p-3 sm:p-4 lg:p-5 2xl:p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg";

    return (
        <>
            {/* StatsBar is now ALWAYS rendered at the top */}
            <StatsBar />

            <FilterBar />

            {/* Main content grid - responsive for phone/tablet/laptop/desktop/4K/TV */}
            <div className={`w-full gap-4 sm:gap-5 md:gap-6 lg:gap-8 2xl:gap-10 px-2 sm:px-4 pb-4 sm:pb-6 grid grid-cols-1 ${currentItemType === 'composite' ? 'lg:grid-cols-4' : ''} items-start`}>

                {/* --- Main Chart Area --- */}
                <div className={`mt-4 w-full ${currentItemType === 'composite' ? 'lg:col-span-3' : 'lg:col-span-4'} ${cardStyle} min-h-[350px]`}>
                    {renderActiveChart()}
                </div>

                {/* --- Conditionally render Breakdown Chart Area (First Item) --- */}
                {currentItemType === 'composite' && (
                    <div className="mt-4 lg:col-span-1">
                        {isLoadingBreakdown ? (
                            <div className={`${cardStyle} h-[420px]`}>
                                <LoadingState message="Loading details..." height="h-full" />
                            </div>
                        ) : error && breakdownData.length === 0 && !isLoadingMain && mainChartData.length > 0 ? (
                            <div className={`${cardStyle} h-[420px] flex items-center justify-center text-red-500`}>
                                {error}
                            </div>
                        ) : breakdownData.length > 0 ? (
                            <div className={`${cardStyle} h-full`}>
                                <BreakdownChart data={breakdownData[0]} />
                            </div>
                        ) : (
                            !error && (
                                <div className={`${cardStyle} h-[420px] flex items-center justify-center`}>
                                    <span className="text-gray-400 text-sm">No breakdown data.</span>
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* --- Conditionally render Rest of Breakdown Charts (ROW 2) --- */}
                {currentItemType === 'composite' && (
                    <div className="lg:col-span-4 mt-6">
                        {!isLoadingBreakdown && !error && breakdownData.length > 1 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
                                {breakdownData.slice(1).map(item => (
                                    <div key={item.name} className={`${cardStyle} h-full`}>
                                        <BreakdownChart data={item} />
                                    </div>
                                ))}
                            </div>
                        )}
                        {!isLoadingBreakdown && !error && breakdownData.length === 1 && (
                            <div className="text-center text-gray-500 italic mt-4 bg-gray-50 p-2 rounded">
                                Only one question in this composite.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default AnalyticsDisplayPage;