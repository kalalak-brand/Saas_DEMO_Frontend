// src/components/Charts/BarDiagram.tsx
import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LabelList,
} from "recharts";

export interface ChartDataItem {
    name: string;
    value: number;
}
interface DynamicBarChartProps {
    data: ChartDataItem[];
    title?: string;
    summaryValue?: string;
    timeLabel?: string;
    barColor?: string;
}
type TooltipProps = {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
};

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white shadow-lg rounded-lg px-3 py-2 border border-primary-200">
                <div className="text-xs text-gray-500">{label}</div>
                <div className="font-bold text-primary">{payload[0].value.toFixed(2)}</div>
            </div>
        );
    }
    return null;
};

/**
 * Returns color based on the score value.
 * Time: O(1), Space: O(1)
 */
const getColorForValue = (value: number) => {
    if (value < 5) {
        return "#FF0000"; // Red
    }
    if (value >= 5 && value < 9) {
        return "#F97316"; // Orange
    }
    if (value >= 9) {
        return "#22C55E"; // Green
    }
    return "#1d4d4f"; // Fallback - theme primary
};


export const BarDiagram: React.FC<DynamicBarChartProps> = ({
    data,
    title = "GUEST LOYALTY COMPOSITE",
    summaryValue,
    timeLabel,
}) => {

    // Define fixed sizes for bars and gaps
    const barWidth = 50;
    const barGap = 20;
    // Estimate for Y-axis + left/right margins
    const chartPadding = 70;

    // Calculate the total chart width
    const calculatedChartWidth =
        (data.length * barWidth) + (data.length * barGap) + chartPadding;

    return (
        <div className="bg-white rounded-lg shadow px-2 py-3 xs:px-4 xs:py-4 sm:px-6 mx-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <h2 className="text-base xs:text-lg md:text-xl font-semibold text-primary leading-tight">
                        {title}
                    </h2>
                    {summaryValue && (
                        <div
                            className="text-xs text-gray-400 mt-1"
                            dangerouslySetInnerHTML={{ __html: summaryValue }}
                        />
                    )}
                </div>
                {timeLabel && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Year</span>
                        <span className="font-semibold text-primary">{timeLabel}</span>
                    </div>
                )}
            </div>

            <div className="w-full h-48 xs:h-64 sm:h-72 md:h-80 overflow-x-auto">
                <ResponsiveContainer width={calculatedChartWidth} height="100%">
                    <BarChart
                        data={data}
                        barCategoryGap={barGap}
                        margin={{ top: 30, right: 10, left: 0, bottom: 0 }}
                    >
                        <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#bdbdbd" fontSize={10} />
                        <YAxis
                            domain={[0, 10]}
                            ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                            axisLine={true}
                            tickLine={false}
                            stroke="#bdbdbd"
                            fontSize={10}
                            tick={{ dy: 4 }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />

                        <Bar dataKey="value" radius={[6, 6, 3, 3]} barSize={barWidth}>
                            {data.map((entry, idx) => (
                                <Cell
                                    key={`cell-${idx}`}
                                    fill={getColorForValue(entry.value)}
                                    stroke="#e5e7eb"
                                    strokeWidth={1}
                                />
                            ))}
                            <LabelList
                                dataKey="value"
                                position="top"
                                fontSize={12}
                                fontWeight="bold"
                                fill="#333"
                                formatter={(value: any) => {
                                    if (typeof value === 'number') {
                                        return value.toFixed(2);
                                    }
                                    return value;
                                }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};