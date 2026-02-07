//App.tsx
import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ChartProvider } from "./context/ChartContext";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./components/theme/ThemeProvider";

// --- Lazy Imports ---
import { Layout } from "./components/layout/Layout";
const AnalyticsDisplayPage = lazy(() => import("./pages/AnalyticsDisplayPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ManagementLayout = lazy(
  () => import("./pages/management/ManagementLayout")
);
const CompositesPageMngt = lazy(
  () => import("./pages/management/CompositesPageMngt")
);
const QuestionsPage = lazy(() => import("./pages/management/QuestionsPage"));
const UsersPage = lazy(() => import("./pages/management/UsersPage"));
const HotelsManagementPage = lazy(
  () => import("./pages/management/HotelManagementPage")
);

const GuestIssuesPage = lazy(
  () => import("./pages/management/YesNoResponsesPage")
);
const ReviewRouter = lazy(() => import("./pages/review/ReviewRouter"));
const ComparePage = lazy(() => import("./pages/ComparePage"));
const ProtectedRoute = lazy(() => import("./components/auth/ProtectedRoute"));
import { useCompositeStore } from "./stores/compositeStore";
import { useFilterStore } from "./stores/filterStore";
import { useAnalyticsStore } from "./stores/analyticsStore";
import { useAuthStore } from "./stores/authStore";
const LowRatedQuestionsPage = lazy(
  () => import("./pages/management/LowRatedQuestionsPage")
);
const QuestionDetailReportPage = lazy(
  () => import("./pages/management/QuestionDetailReportPage")
);
const SettingsPage = lazy(
  () => import("./pages/management/SettingsPage")
);
const CategoriesPage = lazy(
  () => import("./pages/management/CategoriesPage")
);
const QRCodesPage = lazy(
  () => import("./pages/management/QRCodesPage")
);




// Loading Fallback - Premium design
const LoadingFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-screen w-screen bg-background">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-primary-100 rounded-full"></div>
      <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
    <p className="mt-4 text-lg font-medium text-primary animate-pulse-subtle">Loading...</p>
  </div>
);

// Index Redirect Logic
const IndexRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    composites,
    fetchComposites,
    isLoading: isLoadingComposites,
  } = useCompositeStore();
  const initialCategory = useFilterStore.getState().category;
  const resetAnalytics = useAnalyticsStore((state) => state.resetSelection);
  const fetchAttempted = React.useRef(false);

  useEffect(() => {
    resetAnalytics();
    if (composites.length === 0 && !isLoadingComposites && !fetchAttempted.current) {
      fetchAttempted.current = true;
      fetchComposites();
    }
  }, [composites, fetchComposites, isLoadingComposites, resetAnalytics]);

  useEffect(() => {
    if (!isLoadingComposites && composites.length > 0) {
      let firstComposite = composites.find(
        (c) => c.category === initialCategory
      );
      if (!firstComposite) firstComposite = composites[0];

      if (firstComposite) {
        navigate(`/view/${firstComposite._id}`, { replace: true });
      }
    }
  }, [isLoadingComposites, composites, initialCategory, navigate]);

  if (isLoadingComposites) {
    return <LoadingFallback />;
  }

  if (composites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-gray-500">
        <p className="text-xl font-semibold mb-2">No Data Dashboard Configured</p>
        <p className="mb-6">There are no analytics composites set up yet.</p>
        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <button
            onClick={() => navigate('/management/composites')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Go to Management
          </button>
        )}
      </div>
    );
  }

  return <LoadingFallback />;
};

function App() {
  return (
    <ThemeProvider>
      <ChartProvider>
        <Toaster position="top-center" reverseOrder={false} />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            {/* Admin & Viewer Routes */}
            <Route
              element={<ProtectedRoute allowedRoles={["super_admin", "admin", "viewer"]} />}
            >
              <Route path="/" element={<Layout />}>
                <Route index element={<IndexRedirect />} />
                {/* Updated Route Path */}
                <Route path="/view/:itemId" element={<AnalyticsDisplayPage />} />
              </Route>
              <Route path="/compare/:category" element={<ComparePage />} />
              {/* Management Routes */}
              <Route element={<ProtectedRoute allowedRoles={["super_admin", "admin"]} />}>
                <Route path="/management" element={<ManagementLayout />}>
                  <Route path="composites" element={<CompositesPageMngt />} />
                  <Route path="questions" element={<QuestionsPage />} />
                  <Route path="users" element={<UsersPage />} />
                  <Route path="responses" element={<GuestIssuesPage />} />{" "}
                  <Route path="hotels" element={<HotelsManagementPage />} />{" "}
                  {/* Renamed route */}
                  <Route
                    path="report/low-rated-questions"
                    element={<LowRatedQuestionsPage />}
                  />
                  <Route
                    path="report/question-detail/:questionId"
                    element={<QuestionDetailReportPage />}
                  />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="qr-codes" element={<QRCodesPage />} />
                </Route>
              </Route>
            </Route>

            {/* Public Review Routes - No Auth Required */}
            <Route path="/:category" element={<ReviewRouter />} />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </ChartProvider>
    </ThemeProvider>
  );
}

export default App;
