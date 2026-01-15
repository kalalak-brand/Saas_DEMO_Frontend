//components/common/FilterBar.tsx

import React, { useState, useEffect } from 'react';
import { FaChartBar, FaCalendarAlt } from "react-icons/fa"; // Added Calendar icon
import { GoGraph } from "react-icons/go";
import { PiChartPieSliceBold } from "react-icons/pi";
import { useChart, ChartType } from "../../context/ChartContext";
import { YearFilterBar } from "./YearFilterBar";
import { useFilterControlStore, PeriodType } from '../../stores/filterControlStore'; // ✅ Use renamed store/hook

type RightIconItem = {
  icon: React.ComponentType<{ className?: string }>;
  type: ChartType;
};

const rightIcons: RightIconItem[] = [
  { icon: FaChartBar, type: 'bar' },
  { icon: PiChartPieSliceBold, type: 'pie' },
  { icon: GoGraph, type: 'line' },
];

// ✅ Add 'Custom' to periods array
const periods: PeriodType[] = ["Weekly", "Monthly", "Yearly", "Custom"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date): string => date.toISOString().split('T')[0];

export const FilterBar: React.FC = () => {
  const { activeChart, setActiveChart } = useChart();
  const {
      selectedPeriod,
      setPeriod,
      selectedMonth,
      setMonth,
      startDate, // ✅ Get custom dates
      endDate,   // ✅ Get custom dates
      setCustomDateRange // ✅ Get action
   } = useFilterControlStore();

  // Local state for date pickers when 'Custom' is selected
  const [localStartDate, setLocalStartDate] = useState(startDate || formatDate(new Date(new Date().setDate(new Date().getDate() - 30))));
  const [localEndDate, setLocalEndDate] = useState(endDate || formatDate(new Date()));

  // Update local dates if global dates change (e.g., initial load)
  useEffect(() => {
    if(startDate) setLocalStartDate(startDate);
    if(endDate) setLocalEndDate(endDate);
  }, [startDate, endDate]);


  const handleCustomDateChange = () => {
    // Basic validation: ensure end date is not before start date
    if (new Date(localEndDate) < new Date(localStartDate)) {
        console.error("End date cannot be before start date.");
        // Add user feedback here (e.g., toast notification)
        return;
    }
    setCustomDateRange(localStartDate, localEndDate);
  };

  // Handle setting period, trigger custom date apply if needed
  const handleSetPeriod = (p: PeriodType) => {
      setPeriod(p);
      if (p === 'Custom') {
          // Apply current local dates when switching TO custom
          handleCustomDateChange();
      }
  }

  return (
    <>
      <YearFilterBar />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-2 mt-2"> {/* Added margin top */}
        {/* --- Left: Period and Month/Date Filters --- */}
        <div className="flex flex-wrap items-center gap-2"> {/* Added flex-wrap */}
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => handleSetPeriod(p)} // Use handler
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedPeriod === p
                  ? "bg-primary text-white shadow"
                  : "bg-secondary/30 text-primary hover:bg-primary/80 hover:text-white"
              }`}
            >
              {p === 'Yearly' ? '1 Year' : p}
            </button>
          ))}

          {/* Conditionally render month dropdown for Weekly view */}
          {selectedPeriod === 'Weekly' && (
            <select
              value={selectedMonth}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="ml-2 px-3 py-2 rounded-full text-sm font-medium bg-secondary/30 text-primary border-none focus:ring-2 focus:ring-primary focus:outline-none"
            >
              {months.map((m, index) => (
                <option key={m} value={index}>{m}</option>
              ))}
            </select>
          )}

          {/* ✅ Conditionally render date pickers for Custom view */}
          {selectedPeriod === 'Custom' && (
            <div className="flex items-center gap-2 ml-2 p-2 bg-secondary/20 rounded-lg">
              <FaCalendarAlt className="text-primary"/>
              <input
                type="date"
                value={localStartDate}
                onChange={(e) => setLocalStartDate(e.target.value)}
                onBlur={handleCustomDateChange} // Apply changes when focus leaves input
                className="p-1 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={localEndDate}
                onChange={(e) => setLocalEndDate(e.target.value)}
                onBlur={handleCustomDateChange} // Apply changes when focus leaves input
                className="p-1 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
              />
            </div>
          )}
        </div>

        {/* --- Right: Chart Type Icons --- */}
        {/* Only show chart type icons if period is NOT Custom, as main chart breaks */}
        { selectedPeriod !== 'Custom' && (
             <div className="flex items-center gap-3 lg:gap-6 rounded-full bg-primary px-6 py-2">
            {rightIcons.map((item, idx) => {
                const IconComponent = item.icon;
                const isActive = item.type === activeChart;
                return (
                <span
                    key={idx}
                    onClick={() => setActiveChart(item.type)}
                    className={`flex items-center justify-center text-2xl rounded-full w-8 h-8 cursor-pointer transition-colors ${
                    isActive
                        ? "bg-secondary p-1 text-pink-100" // Adjusted padding
                        : "text-pink-100 hover:bg-secondary/80 "
                    }`}
                    title={`View as ${item.type} chart`}
                >
                    <IconComponent className={ `${isActive? 'p-1' : 'p-0'}`} />
                </span>
                );
            })}
            </div>
        )}
      </div>
    </>
  );
};