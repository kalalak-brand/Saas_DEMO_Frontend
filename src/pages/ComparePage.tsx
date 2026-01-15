import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useComparisonStore } from "../stores/comparisonStore";
import { AnalyticsItemType } from "../stores/analyticsStore"; // Reuse type
import Nav from "../components/layout/Nav"; // Re-use main Nav
import { Sidebar } from "../components/layout/Sidebar"; // Re-use Sidebar
import { BarDiagram } from "../components/Charts/BarDiagram"; // Import chart
import { useCompositeStore } from "../stores/compositeStore";
import { useManagementStore } from "../stores/managementStore";
import { useFilterStore } from "../stores/filterStore";
import { useAuthStore } from "../stores/authStore";
import { ArrowLeft } from "lucide-react"; // For back button

// --- Helper to format date as YYYY-MM-DD ---
// const getISODate = (offsetDays: number = 0): string => {
//   const date = new Date();
//   date.setDate(date.getDate() + offsetDays);
//   return date.toISOString().split("T")[0];
// };

// --- useResponsive Hook (copied from Layout.tsx) ---
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
};

const ComparePage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const isMobile = useResponsive();

  // --- Local State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [sidebarMode, setSidebarMode] =
    useState<AnalyticsItemType>("composite");

  // --- Global State ---
  const setGlobalCategory = useFilterStore((state) => state.setCategory);

  const { composites, fetchComposites, isLoading: isLoadingComposites } = useCompositeStore();
  const { questions, fetchQuestions, isLoading: isLoadingQuestions } = useManagementStore();

  const {
    selectedItem, dateRangeA, dateRangeB, comparisonData, isLoading, error,
    setSelectedItem, setDateRangeA, setDateRangeB, fetchComparisonData, resetComparison // ✅ Get reset action
  } = useComparisonStore();

  // --- Effects ---
  // Set global category and reset comparison store on load/category change
  useEffect(() => {
    if (category) {
      setGlobalCategory(category);
      resetComparison(); // ✅ Reset store on category change
    } else {
      navigate("/"); // Redirect home if no category
    }
  }, [category, setGlobalCategory, navigate, resetComparison]); // ✅ Add reset

  // Fetch lists for sidebar
  useEffect(() => {
    fetchComposites(true); // Force refetch
    fetchQuestions(true); // Force refetch
  }, [fetchComposites, fetchQuestions, category]); // ✅ Re-fetch when category changes

  // Sync sidebar open state with isMobile
  useEffect(() => {
    if (!isMobile) setIsSidebarOpen(true);
    else setIsSidebarOpen(false);
  }, [isMobile]);

  // --- Handlers ---
  const handleSelectItem = (
    id: string,
    name: string,
    type: AnalyticsItemType
  ) => {
    setSelectedItem({ id, name, type });
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleRunComparison = () => {
    if (!selectedItem || !category) return;
    fetchComparisonData(category);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ✅ Handler for switching sidebar tabs (Comp/Ques)
  const handleSetSidebarMode = useCallback((mode: AnalyticsItemType) => {
    if (mode === sidebarMode) return;
    setSidebarMode(mode);

    let firstItem: { _id: string, name?: string, text?: string } | undefined;
    let listToCheck: any[] = [];

    if (mode === 'composite') {
      listToCheck = composites;
    } else {
      listToCheck = questions;
    }

    if ((mode === 'composite' && !isLoadingComposites) || (mode === 'question' && !isLoadingQuestions)) {
      firstItem = listToCheck.find(item => item && item.category === category);

      if (firstItem) {
        const firstName = mode === 'question' ? firstItem.text : firstItem.name;
        setSelectedItem({ id: firstItem._id, name: firstName || '', type: mode });
      } else {
        setSelectedItem(null); // Clear selection
      }
    } else {
      setSelectedItem(null); // Clear selection
    }
  }, [sidebarMode, category, composites, questions, isLoadingComposites, isLoadingQuestions, setSelectedItem]);

  // --- Local Date State ---
  const [localDateA_start, setLocalDateA_start] = useState(dateRangeA.start);
  const [localDateA_end, setLocalDateA_end] = useState(dateRangeA.end);
  const [localDateB_start, setLocalDateB_start] = useState(dateRangeB.start);
  const [localDateB_end, setLocalDateB_end] = useState(dateRangeB.end);

  // Sync local dates when store changes
  useEffect(() => setLocalDateA_start(dateRangeA.start), [dateRangeA.start]);
  useEffect(() => setLocalDateA_end(dateRangeA.end), [dateRangeA.end]);
  useEffect(() => setLocalDateB_start(dateRangeB.start), [dateRangeB.start]);
  useEffect(() => setLocalDateB_end(dateRangeB.end), [dateRangeB.end]);

  const handleApplyDateA = () =>
    setDateRangeA({ start: localDateA_start, end: localDateA_end });
  const handleApplyDateB = () =>
    setDateRangeB({ start: localDateB_start, end: localDateB_end });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* ✅ Pass all required props to Nav */}
      <Nav
        category={category!}
        setCategory={setGlobalCategory}
      />
      <div className="h-10 w-full flex items-center px-10 bg-secondary/30 flex-shrink-0">
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center gap-2 text-sm text-primary font-medium hover:underline hover:bg-primary hover:text-white py-1.5 px-2 rounded-md"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden pt-2">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          isMobile={isMobile}
          toggleSidebar={toggleSidebar}
          sidebarMode={sidebarMode}
          setSidebarMode={handleSetSidebarMode} // ✅ Pass correct handler
          onSelectItem={handleSelectItem}
          currentItemId={selectedItem?.id}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Compare Analytics
          </h1>

          {!selectedItem ? (
            <div className="text-center p-6 text-gray-500 mt-10 bg-white rounded-lg shadow">
              Please select a composite or question from the sidebar to begin
              comparison.
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-semibold text-primary mb-6">
                Comparing:{" "}
                <span className="font-bold">{selectedItem.name}</span>
              </h2>

              {/* Date Selection Area */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Date Range A */}
                <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Period A
                  </h3>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 flex flex-col gap-1">
                      <span className="text-sm font-medium text-gray-700">From:</span>
                      <input
                        type="date"
                        value={localDateA_start}
                        max={localDateA_end}
                        onChange={(e) => setLocalDateA_start(e.target.value)}
                        onBlur={handleApplyDateA}
                        className="p-2 border border-gray-300 rounded-md"
                      />
                    </label>
                    <label className="flex-1 flex flex-col gap-1">
                      <span className="text-sm font-medium text-gray-700">To:</span>
                      <input
                        type="date"
                        value={localDateA_end}
                        onChange={(e) => setLocalDateA_end(e.target.value)}
                        onBlur={handleApplyDateA}
                        min={localDateA_start}
                        className="p-2 border border-gray-300 rounded-md"
                      />
                    </label>
                  </div>
                </div>
                {/* Date Range B */}
                <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Period B
                  </h3>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 flex flex-col gap-1">
                      <span className="text-sm font-medium text-gray-700">From:</span>
                      <input
                        type="date"
                        value={localDateB_start}
                        onChange={(e) => setLocalDateB_start(e.target.value)}
                        onBlur={handleApplyDateB}
                        max={localDateB_end}
                        className="p-2 border border-gray-300 rounded-md"
                      />
                    </label>
                    <label className="flex-1 flex flex-col gap-1">
                      <span className="text-sm font-medium text-gray-700">To:</span>
                      <input
                        type="date"
                        value={localDateB_end}
                        onChange={(e) => setLocalDateB_end(e.target.value)}
                        onBlur={handleApplyDateB}
                        min={localDateB_start}
                        className="p-2 border border-gray-300 rounded-md"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Compare Button */}
              <div className="flex justify-center mb-6">
                <button
                  onClick={handleRunComparison}
                  disabled={isLoading}
                  className="px-8 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 disabled:opacity-50"
                >
                  {isLoading ? "Loading Comparison..." : "Run Comparison"}
                </button>
              </div>

              {/* Chart Display Area */}
              <div className="bg-white p-4 rounded-lg shadow-md">
                {isLoading ? (
                  <div className="text-center p-4 h-72 flex items-center justify-center animate-pulse">
                    Loading Comparison Chart...
                  </div>
                ) : error ? (
                  <div className="text-center p-4 h-72 flex items-center justify-center text-red-500">
                    {error}
                  </div>
                ) : comparisonData ? (
                  <BarDiagram
                    data={comparisonData}
                    title={`Comparison for ${selectedItem.name}`}
                  />
                ) : (
                  <div className="text-center p-4 h-72 flex items-center justify-center text-gray-500">
                    Please select date ranges and click "Run Comparison".
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ComparePage;