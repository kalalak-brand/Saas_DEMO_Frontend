import { useState, useEffect, useCallback, useRef, useMemo } from "react"; // ✅ ADDED useMemo
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import Nav from "./Nav";
// ❌ REMOVED: No longer need useCompositeStore
// import { useCompositeStore } from "../../stores/compositeStore";
import { useFilterControlStore } from "../../stores/filterControlStore";
import { useFilterStore } from "../../stores/filterStore";
import { useManagementStore } from "../../stores/managementStore";
import { useActiveCategories, useCategoryStore } from "../../stores/categoryStore";
import {
  useAnalyticsStore,
  AnalyticsItemType,
} from "../../stores/analyticsStore";
import { useAuthStore } from "../../stores/authStore";

// --- Custom hook to get the previous value ---
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value; // Update after render
  });
  return ref.current; // Return value from *previous* render
}

// useResponsive hook
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
};

export const Layout = () => {
  const isMobile = useResponsive();
  const navigate = useNavigate();
  const params = useParams<{ itemId?: string }>();

  const [isSidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarMode, setSidebarMode] =
    useState<AnalyticsItemType>("composite"); // ✅ CHANGED: Data stores consolidated to useManagementStore

  const {
    composites,
    fetchComposites,
    isLoading: isLoadingComposites,
    questions,
    fetchQuestions,
    isLoading: isLoadingQuestions,
  } = useManagementStore();

  const fetchAvailableYears = useFilterControlStore(
    (state) => state.fetchAvailableYears
  );
  const { category, setCategory } = useFilterStore();
  const {
    fetchAnalyticsData,
    resetSelection,
    currentItemId: analyticsItemId,
  } = useAnalyticsStore();
  const logout = useAuthStore((state) => state.logout);
  const activeCategories = useActiveCategories();
  const fetchCategories = useCategoryStore((state) => state.fetchCategories);

  // Look up the category _id from the slug
  const categoryId = useMemo(() => {
    const cat = activeCategories.find(c => c.slug === category);
    return cat?._id;
  }, [activeCategories, category]);

  const handleLogout = () => {
    logout();
    navigate("/login"); // Redirect to login after logout
  };
  const prevCategory = usePrevious(category); // Fetch initial lists (no change)

  useEffect(() => {
    fetchComposites();
    fetchQuestions();
    fetchCategories();
    fetchAvailableYears();
  }, [fetchComposites, fetchQuestions, fetchCategories, fetchAvailableYears]); // Adjust sidebar open state (no change)

  useEffect(() => {
    if (!isMobile) setSidebarOpen(true);
    else setSidebarOpen(false);
  }, [isMobile]); // Handle selecting an item (no change)

  const handleSelectItem = useCallback(
    (id: string, name: string, type: AnalyticsItemType) => {
      console.log(`Sidebar selected: ${type} - ${name} (${id})`);
      if (sidebarMode !== type) {
        setSidebarMode(type);
      }
      if (params.itemId !== id) {
        navigate(`/view/${id}`);
      } else {
        // This else block is mostly redundant now due to the new useEffect,
        // but it can stay as a fallback for clicking the *same* item.
        fetchAnalyticsData(id, name, type);
      }
      if (isMobile) setSidebarOpen(false);
    },
    [navigate, isMobile, params.itemId, sidebarMode, fetchAnalyticsData]
  ); // Handle switching sidebar mode (no change)

  const handleSetSidebarMode = useCallback(
    (mode: AnalyticsItemType) => {
      console.log(`handleSetSidebarMode called with mode: ${mode}`);
      if (mode === sidebarMode) {
        console.log("Mode is already active, returning.");
        return;
      }
      setSidebarMode(mode);
      let firstItem: { _id: string; name?: string; text?: string } | undefined;
      if (mode === "composite") {
        firstItem = composites.find((c) => c.category === categoryId);
      } else {
        firstItem = questions.find((q) => q.category === categoryId);
      }
      if (firstItem) {
        const firstName = mode === "question" ? firstItem.text : firstItem.name;
        console.log(
          `Navigating to first ${mode}: ${firstName} (ID: ${firstItem._id})`
        );
        navigate(`/view/${firstItem._id}`);
      } else {
        console.log(
          `No items found for mode ${mode} in category ${category}. Resetting.`
        );
        resetSelection();
      }
    },
    [
      sidebarMode,
      category,
      composites,
      questions,
      navigate,
      resetSelection,
      isLoadingComposites,
      isLoadingQuestions,
    ]
  );

  // --- ⭐️ START: REFACTORED DATA FETCHING LOGIC ⭐️ ---

  const { selectedYear, selectedPeriod, selectedMonth, startDate, endDate } =
    useFilterControlStore();
  const currentUrlItemId = params.itemId;

  // 1. STABLE: Memoize the current item's details
  // This now only changes if the URL ID or the (stable) lists change.
  const currentItem = useMemo(() => {
    if (!currentUrlItemId) return null;

    const comp = composites.find((c) => c._id === currentUrlItemId);
    if (comp)
      return {
        id: comp._id,
        name: comp.name,
        type: "composite" as AnalyticsItemType,
      };

    const ques = questions.find((q) => q._id === currentUrlItemId);
    if (ques)
      return {
        id: ques._id,
        name: ques.text,
        type: "question" as AnalyticsItemType,
      };

    return null; // ID exists but not found in lists yet
  }, [currentUrlItemId, composites, questions]);

  // 2. STABLE: Sync sidebar mode based on the memoized item
  // This effect is small and only runs when `currentItem` changes.
  useEffect(() => {
    if (
      currentItem &&
      currentItem.type !== sidebarMode &&
      !isLoadingComposites &&
      !isLoadingQuestions
    ) {
      setSidebarMode(currentItem.type);
    }
  }, [currentItem, sidebarMode, isLoadingComposites, isLoadingQuestions]); // 3. STABLE: Your debounced data fetch

  useEffect(() => {
    const handler = setTimeout(() => {
      if (currentItem) {
        console.log(
          `DEBOUNCED Data Fetch: Fetching for ${currentItem.type}: ${currentItem.name}`
        );
        // fetchAnalyticsData will read filters from its own store
        fetchAnalyticsData(currentItem.id, currentItem.name, currentItem.type);
      } else if (!currentUrlItemId) {
        // Case 1: No ID in URL
        console.log("DEBOUNCED: No item ID in URL.");
        resetSelection();
      } else if (!isLoadingComposites && !isLoadingQuestions) {
        // Case 2: ID in URL, but not found
        console.warn(
          `DEBOUNCED: Item ID ${currentUrlItemId} from URL not found.`
        );
        resetSelection(); // Item ID is invalid
      }
      // Case 3: (Implicit) ID in URL, but lists are loading. Do nothing, wait for lists.
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [
    // ✅ CLEAN DEPENDENCIES:
    currentItem, // The stable object from useMemo
    category, // Re-fetch if category filter changes
    selectedYear,
    selectedPeriod,
    selectedMonth,
    startDate,
    endDate,
    // Stable functions/values below
    fetchAnalyticsData,
    resetSelection,
    currentUrlItemId,
    isLoadingComposites,
    isLoadingQuestions,
  ]); // Effect to handle category switch (no change)

  // --- ⭐️ END: REFACTORED DATA FETCHING LOGIC ⭐️ ---

  useEffect(() => {
    if (
      prevCategory !== category &&
      prevCategory !== undefined &&
      !isLoadingComposites &&
      composites.length > 0
    ) {
      const firstCompositeInNewCategory = composites.find(
        (c) => c.category === categoryId
      );
      if (firstCompositeInNewCategory) {
        console.log(
          `Category CHANGED to ${category}. Selecting first composite: ${firstCompositeInNewCategory.name}`
        );
        setSidebarMode("composite"); // Reset mode to composite
        navigate(`/view/${firstCompositeInNewCategory._id}`, { replace: true });
      } else {
        console.log(
          `No composites found for newly selected category ${category}. Resetting selection.`
        );
        resetSelection();
        setSidebarMode("composite");
      }
    }
  }, [
    category,
    prevCategory,
    composites,
    isLoadingComposites,
    navigate,
    resetSelection,
  ]);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">

      <Nav category={category} setCategory={setCategory} />

      <Header toggleSidebar={toggleSidebar} isMobile={isMobile} />

      <div className="flex flex-1 overflow-hidden pt-2">

        <Sidebar
          onLogout={handleLogout}
          isSidebarOpen={isSidebarOpen}
          isMobile={isMobile}
          toggleSidebar={toggleSidebar}
          sidebarMode={sidebarMode}
          setSidebarMode={handleSetSidebarMode}
          onSelectItem={handleSelectItem}
          currentItemId={analyticsItemId ?? undefined}
        />

        {/* Responsive main content: phone(p-2) tablet(p-4) laptop(p-6) desktop(p-8) 4K/TV(p-10) */}
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 lg:p-2 2xl:p bg-gray-100">
          <div className="max-w-[2400px] mx-auto">
            <Outlet />
          </div>
        </main>

      </div>

    </div>
  );
};
