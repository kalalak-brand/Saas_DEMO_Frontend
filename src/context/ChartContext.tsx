// src/context/ChartContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the possible chart types for type safety
export type ChartType = 'bar' | 'pie' | 'line';

// Define the shape of the context's value
interface ChartContextType {
  activeChart: ChartType;
  setActiveChart: (chart: ChartType) => void;
}

// Create the context with a default value
const ChartContext = createContext<ChartContextType | undefined>(undefined);

// Create the Provider component
export const ChartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Set the default chart to 'bar'
  const [activeChart, setActiveChart] = useState<ChartType>('bar');

  return (
    <ChartContext.Provider value={{ activeChart, setActiveChart }}>
      {children}
    </ChartContext.Provider>
  );
};

// Create a custom hook for easy access to the context
export const useChart = (): ChartContextType => {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error('useChart must be used within a ChartProvider');
  }
  return context;
};