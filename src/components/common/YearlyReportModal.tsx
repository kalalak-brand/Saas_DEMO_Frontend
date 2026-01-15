// Components/common/yearlyReportModal.tsx
import React, { useState, useEffect } from 'react';
import { useReportStore } from '../../stores/reportStore';
import { Loader2, AlertCircle } from 'lucide-react';

// This is a basic modal structure. You can replace it with your
// existing modal/dialog component (e.g., from Shadcn/ui, Material-UI).
const Modal = ({ children, onClose }: { children: React.ReactNode, onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
      >
        &times;
      </button>
      {children}
    </div>
  </div>
);

const YearlyReportModal = () => {
  const {
    isModalOpen,
    closeModal,
    fetchAvailableYears,
    downloadReport,
    availableYears,
    isLoadingYears,
    isLoadingReport,
    error,
    clearYears,
  } = useReportStore();

  // ✅ UPDATED: Added 'cfc' to the category state type
  const [category, setCategory] = useState<'room' | 'f&b' | 'cfc' | ''>('');
  const [year, setYear] = useState<number | ''>('');

  // When the category changes, fetch new years
  useEffect(() => {
    if (category) {
      setYear(''); // Reset year selection
      fetchAvailableYears(category);
    } else {
      clearYears(); // Clear years if no category
    }
  }, [category, fetchAvailableYears, clearYears]);

  // Reset local state when modal is closed
  useEffect(() => {
    if (!isModalOpen) {
      setCategory('');
      setYear('');
    }
  }, [isModalOpen]);

  const handleDownload = () => {
    if (year && category) {
      downloadReport(year, category);
    }
  };

  if (!isModalOpen) {
    return null;
  }

  return (
    <Modal onClose={() => !isLoadingReport && closeModal()}>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Download Yearly Report</h2>
      
      <div className="space-y-4">
        {/* Step 1: Category Selection */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            value={category}
            // ✅ UPDATED: Included 'cfc' in the onChange type assertion
            onChange={(e) => setCategory(e.target.value as 'room' | 'f&b' | 'cfc' | '')}
            disabled={isLoadingReport}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          >
            <option value="">-- Select a category --</option>
            <option value="room">Room</option>
            <option value="f&b">Food & Beverage (F&B)</option>
            {/* ✅ ADDED: New option for CFC */}
            <option value="cfc">Coffee Klatch (CK)</option>
          </select>
        </div>

        {/* Step 2: Year Selection */}
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
            Year
          </label>
          <div className="relative">
            <select
              id="year"
              value={year}
              onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : '')}
              disabled={!category || isLoadingYears || isLoadingReport || availableYears.length === 0}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            >
              <option value="">-- Select a year --</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {isLoadingYears && (
              <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-gray-400" />
            )}
          </div>
          {availableYears.length === 0 && category && !isLoadingYears && (
             <p className="text-xs text-gray-500 mt-1">No data available for this category.</p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={closeModal}
            disabled={isLoadingReport}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={!year || !category || isLoadingReport}
            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingReport ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Download Report'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default YearlyReportModal;