//components/charts/pieChartt.tsx
import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { clsx } from 'clsx';

export interface ChartDataItem {
    name: string;
    value: number;
    [key: string]: string | number | boolean | undefined;
}

// Define the props, adding 'size' and 'showLabels'
interface DynamicPieChartProps {
    data: ChartDataItem[];
    title?: string | null;
    style?: string;
    size?: 'small' | 'medium' | 'large';
    showLabels?: boolean; // ✅ ADDED: New prop to control labels
}

// ✅ 1. REMOVED the static COLORS array.

// ✅ 2. ADDED a helper function to get color based on value.
/**
 * Returns a specific color based on the rating value.
 * - (value <= 5):  Danger Red
 * - (5 < value <= 9): Orange
 * - (value > 9):    Green
 */

const getColorByValue = (value: number) => {
    if (value <= 5) {
        return '#FF0000'; // Danger Red (e.g., Tailwind Red-600)
    }
    if (value <= 9) { // This automatically means value is > 5
        return '#F97316'; // Orange (e.g., Tailwind Amber-500)
    }
    // This means value is > 9 (e.g., 9.1 to 10)
    return '#22C55E'; // Green (e.g., Tailwind Emerald-500)
};


const getChartDimensions = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
        case 'small':
            return { height: 180, innerRadius: 40, outerRadius: 70, legend: false };
        case 'large':
            return { height: 400, innerRadius: 100, outerRadius: 150, legend: true };
        case 'medium':
        default:
            return { height: 350, innerRadius: 80, outerRadius: 130, legend: true };
    }
}

export const PieChartt: React.FC<DynamicPieChartProps> = ({
    data,
    title,
    style,
    size = 'medium',
    showLabels = false
}) => {

    const { height, innerRadius, outerRadius, legend } = getChartDimensions(size);

    return (
        <div className={clsx('rounded-lg', style)}>
            {title && (
                <h2
                    className="text-xl font-semibold  text-center"
                    style={{ color: '#650933' }}
                >
                    {title}
                </h2>
            )}
            <ResponsiveContainer width="100%" height={height}>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={innerRadius}
                        outerRadius={outerRadius}
                        paddingAngle={2}
                        fill="#8884d8"
                        label={showLabels}
                    >
                        {/* ✅ 3. UPDATED the map to use the new function and access the 'entry' */}
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={getColorByValue(entry.value)} // Use the dynamic color
                            />
                        ))}
                    </Pie>
                    <Tooltip />
                    {legend && <Legend />}
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};