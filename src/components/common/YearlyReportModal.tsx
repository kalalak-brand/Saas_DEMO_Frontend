// Components/common/YearlyReportModal.tsx
import React, { useState, useEffect } from 'react';
import { useReportStore } from '../../stores/reportStore';
import { useActiveCategories } from '../../stores/categoryStore';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * Simple modal wrapper — fullscreen overlay with centered card.
 * Time: O(1), Space: O(1)
 */
const Modal = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
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

/**
 * YearlyReportModal — category+year selector to download PDF report.
 * Categories are fetched dynamically from the category store.
 * Time: O(c) where c = categories, Space: O(y) where y = available years
 */
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

  const activeCategories = useActiveCategories();

  const [categorySlug, setCategorySlug] = useState<string>('');
  const [year, setYear] = useState<number | ''>('');

  // When category changes, fetch available years for that category
  useEffect(() => {
    if (categorySlug) {
      setYear('');
      fetchAvailableYears(categorySlug);
    } else {
      clearYears();
    }
  }, [categorySlug, fetchAvailableYears, clearYears]);

  // Reset local state when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setCategorySlug('');
      setYear('');
    }
  }, [isModalOpen]);

  const handleDownload = () => {
    if (year && categorySlug) {
      downloadReport(year, categorySlug);
    }
  };

  if (!isModalOpen) return null;

  return (
    <Modal onClose={() => !isLoadingReport && closeModal()}>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Download Yearly Report</h2>

      <div className="space-y-4">
        {/* Step 1: Dynamic Category Selection */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            disabled={isLoadingReport}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          >
            <option value="">-- Select a category --</option>
            {activeCategories.map((cat) => (
              <option key={cat._id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
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
              disabled={!categorySlug || isLoadingYears || isLoadingReport || availableYears.length === 0}
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
          {availableYears.length === 0 && categorySlug && !isLoadingYears && (
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
            disabled={!year || !categorySlug || isLoadingReport}
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