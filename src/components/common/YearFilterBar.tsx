// src/components/common/YearFilterBar.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import {useFilterControlStore  } from '../../stores/filterControlStore'; // ✅ Use the new store

export const YearFilterBar: React.FC = () => {
  // ✅ Get state and actions from the Zustand store
const { selectedYear, setYear, availableYears, isLoadingYears } = useFilterControlStore(); // ✅ Use new state

  const currentIndex = availableYears.indexOf(selectedYear);
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < availableYears.length - 1;

  const handlePrevious = () => {
    if (canGoBack) setYear(availableYears[currentIndex - 1]);
  };

  const handleNext = () => {
    if (canGoForward) setYear(availableYears[currentIndex + 1]);
  };

  // The JSX remains mostly the same, just a few logic tweaks
  return (
   <div className='bg-secondary/30 mx-4 py-1 rounded-md min-w-[200px] md:min-w-[400px]'> {/* Adjusted min-width */}
      <div className='flex items-center justify-between px-4'>
        <button onClick={handlePrevious} disabled={!canGoBack || isLoadingYears}> {/* Disable if loading */}
          <ChevronLeft
            className={`w-8 h-8 ${canGoBack && !isLoadingYears ? 'text-primary hover:bg-primary hover:text-white rounded-full cursor-pointer' : 'text-gray-400'}`}
          />
        </button>
        {/* Show loading or the selected year */}
        <span className='text-lg font-semibold text-primary'>
            {isLoadingYears ? 'Loading...' : selectedYear}
        </span>
        <button onClick={handleNext} disabled={!canGoForward || isLoadingYears}> {/* Disable if loading */}
          <ChevronRight
            className={`w-8 h-8 ${canGoForward && !isLoadingYears ? 'text-primary hover:bg-primary hover:text-white rounded-full cursor-pointer' : 'text-gray-400'}`}
          />
        </button>
      </div>
    </div>
  );
};