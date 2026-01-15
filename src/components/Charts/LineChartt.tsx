// src/components/Charts/LineChartt.tsx
import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

// Define a generic data item type
export interface ChartDataItem {
  name: string;  // e.g., "Jan", "Feb", "Week 1"
  value: number; // e.g., the score
}

// Define the props the component will accept
interface DynamicLineChartProps {
  data: ChartDataItem[];
  title?: string;
  ytdValue?: string; // Year-to-date or any summary value
  timeLabel?: string; // e.g., "Year 2023"
}

// Define your color scheme
const COLOR_PRIMARY = "#650933";
const COLOR_BACKGROUND = "#FAFBFF";

// Custom Tooltip (no changes needed, it's already dynamic)
const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div 
        className="custom-tooltip p-2 rounded-md shadow-md" 
        style={{ backgroundColor: COLOR_PRIMARY, color: 'white', fontSize: '0.875rem' }}
      >
        <span>{`${payload[0].value.toFixed(2)}`}</span>
      </div>
    );
  }
  return null;
};

// The component now accepts props
export const LineChartt: React.FC<DynamicLineChartProps> = ({ data, title, ytdValue, timeLabel }) => {
  return (
    <div 
      className="p-6 rounded-lg shadow-md" 
      style={{ backgroundColor: COLOR_BACKGROUND, color: COLOR_PRIMARY, margin: '20px' }}
    >
      {/* Chart Header - now uses props */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold">{title || 'Metric Over Time'}</h2>
          {ytdValue && <p className="text-3xl font-bold mt-1">{ytdValue}</p>}
        </div>
        {timeLabel && <p className="text-lg font-semibold text-gray-600">{timeLabel}</p>}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
          <XAxis 
            // Use the generic 'name' key from our data
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            padding={{ left: 10, right: 10 }}
            tick={{ fill: 'gray', fontSize: 12 }}
          />
          <YAxis hide={true} domain={['dataMin - 1', 'dataMax + 1']} />
          <Tooltip 
            cursor={{ stroke: 'transparent' }}
            content={<CustomTooltip />}
            wrapperStyle={{ outline: 'none' }}
          />
          <Line 
            type="monotone" 
            // Use the generic 'value' key from our data
            dataKey="value"
            stroke={COLOR_PRIMARY}
            strokeWidth={3}
            dot={{ r: 4, fill: COLOR_PRIMARY }}
            activeDot={{ r: 6, stroke: COLOR_PRIMARY, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};