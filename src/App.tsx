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
const HotelSelectionPage = lazy(
  () => import("./pages/HotelSelectionPage")
);
const AnalyticsHubPage = lazy(
  () => import("./pages/management/AnalyticsHubPage")
);

const GuestIssuesPage = lazy(
  () => import("./pages/management/YesNoResponsesPage")
);
const ReviewRouter = lazy(() => import("./pages/review/ReviewRouter"));
const GuestLandingPage = lazy(() => import("./pages/review/GuestLandingPage"));
const ServiceRequestForm = lazy(() => import("./pages/review/ServiceRequestForm"));
const ServiceRequestStatusPage = lazy(() => import("./pages/review/ServiceRequestStatusPage"));
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
const ServiceRequestsPage = lazy(
  () => import("./pages/management/ServiceRequestsPage")
);
const ServiceAnalyticsPage = lazy(
  () => import("./pages/management/ServiceAnalyticsPage")
);
const PostServiceFeedback = lazy(
  () => import("./pages/review/PostServiceFeedback")
);
const RoomQRGenerator = lazy(
  () => import("./pages/management/RoomQRGenerator")
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

/**
 * Smart redirect for /management index based on role (Spec §3).
 * staff              → service-requests (queue only)
 * supervisor         → service-requests (all dept view)
 * hotel_dept_supervisor → service-requests (own dept view)
 * owner / gm         → analytics hub (feedback + service)
 * Time: O(1), Space: O(1)
 */
const ManagementIndexRedirect: React.FC = () => {
  const { user } = useAuthStore();
  const role = user?.role;

  // Platform roles (owner/gm) that haven't selected a working hotel yet
  if ((role === 'hotel_owner' || role === 'hotel_gm') && !user?.hotelId) {
    return <Navigate to="/select-hotel" replace />;
  }

  // Owners & GMs land on the analytics hub (service + feedback)
  if (role === 'hotel_owner' || role === 'hotel_gm') {
    return <Navigate to="/management/analytics" replace />;
  }
  return <Navigate to="/management/service-requests" replace />;
};

/**
 * Index Redirect Logic (Spec §6)
 * staff/supervisor/dept_head → service-requests (no feedback dashboard)
 * owner/gm                  → composite analytics dashboard (feedback view)
 * Time: O(1) for service roles, O(n) for analytics roles where n = composites
 */
const IndexRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role;

  // Intercept platform roles if they haven't selected a working hotel in state yet
  if ((role === 'hotel_owner' || role === 'hotel_gm') && !user?.hotelId) {
    return <Navigate to="/select-hotel" replace />;
  }

  // All hooks must be called unconditionally (React Rules of Hooks)
  const {
    composites,
    fetchComposites,
    isLoading: isLoadingComposites,
  } = useCompositeStore();
  const initialCategory = useFilterStore.getState().category;
  const resetAnalytics = useAnalyticsStore((state) => state.resetSelection);
  const fetchAttempted = React.useRef(false);

  useEffect(() => {
    // Service-only roles don't need composites
    if (role === 'hotel_dept_staff' || role === 'hotel_supervisor' || role === 'hotel_dept_supervisor') return;
    resetAnalytics();
    if (composites.length === 0 && !isLoadingComposites && !fetchAttempted.current) {
      fetchAttempted.current = true;
      fetchComposites();
    }
  }, [composites, fetchComposites, isLoadingComposites, resetAnalytics, role]);

  useEffect(() => {
    // Service-only roles don't need composites
    if (role === 'hotel_dept_staff' || role === 'hotel_supervisor' || role === 'hotel_dept_supervisor') return;
    if (!isLoadingComposites && composites.length > 0) {
      let firstComposite = composites.find(
        (c) => c.category === initialCategory
      );
      if (!firstComposite) firstComposite = composites[0];

      if (firstComposite) {
        navigate(`/view/${firstComposite._id}`, { replace: true });
      }
    }
  }, [isLoadingComposites, composites, initialCategory, navigate, role]);

  // Service-only roles skip analytics dashboard entirely (Spec §3.5-§3.7)
  if (role === 'hotel_dept_staff' || role === 'hotel_supervisor' || role === 'hotel_dept_supervisor') {
    return <Navigate to="/management/service-requests" replace />;
  }

  if (isLoadingComposites) {
    return <LoadingFallback />;
  }

  if (composites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-gray-500">
        <p className="text-xl font-semibold mb-2">No Data Dashboard Configured</p>
        <p className="mb-6">There are no analytics composites set up yet.</p>
      </div>
    );
  }

  return <LoadingFallback />;
};

/** All valid hotel-frontend roles */
const ALL_HOTEL_ROLES = [
  "hotel_owner",
  "hotel_gm",
  "hotel_supervisor",
  "hotel_dept_supervisor",
  "hotel_dept_staff",
] as const;

/** Roles that can access analytics (feedback + service) */
const ANALYTICS_ROLES = ["hotel_owner", "hotel_gm"] as const;

function App() {
  return (
    <ThemeProvider>
      <ChartProvider>
        <Toaster position="top-right" reverseOrder={false} containerStyle={{ zIndex: 99999 }} />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/select-hotel" element={<HotelSelectionPage />} />

            {/* Hotel Frontend Routes — all authenticated hotel roles */}
            <Route
              element={<ProtectedRoute allowedRoles={[...ALL_HOTEL_ROLES]} />}
            >
              <Route path="/" element={<Layout />}>
                <Route index element={<IndexRedirect />} />
                <Route path="/view/:itemId" element={<AnalyticsDisplayPage />} />
              </Route>
              <Route path="/compare/:category" element={<ComparePage />} />

              {/* Management Routes */}
              <Route element={<ProtectedRoute allowedRoles={[...ALL_HOTEL_ROLES]} />}>
                <Route path="/management" element={<ManagementLayout />}>
                  {/* Smart index redirect based on role */}
                  <Route index element={<ManagementIndexRedirect />} />

                  {/* Service operations — all authenticated roles (Spec §6) */}
                  <Route path="service-requests" element={<ServiceRequestsPage />} />
                  <Route path="service-analytics" element={<ServiceAnalyticsPage />} />

                  {/* Analytics hub — owner & gm only */}
                  <Route element={<ProtectedRoute allowedRoles={[...ANALYTICS_ROLES]} />}>
                    <Route path="analytics" element={<AnalyticsHubPage />} />
                  </Route>

                  {/* Feedback analytics — owner, gm only (Spec §7.3) */}
                  <Route element={<ProtectedRoute allowedRoles={[...ANALYTICS_ROLES]} />}>
                    <Route path="responses" element={<GuestIssuesPage />} />
                    <Route
                      path="report/low-rated-questions"
                      element={<LowRatedQuestionsPage />}
                    />
                    <Route
                      path="report/question-detail/:questionId"
                      element={<QuestionDetailReportPage />}
                    />
                  </Route>

                  {/* Configuration — owner only in hotel frontend */}
                  <Route element={<ProtectedRoute allowedRoles={["hotel_owner"]} />}>
                    <Route path="composites" element={<CompositesPageMngt />} />
                    <Route path="questions" element={<QuestionsPage />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="hotels" element={<HotelsManagementPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="categories" element={<CategoriesPage />} />
                    <Route path="qr-codes" element={<QRCodesPage />} />
                    <Route path="room-qr-codes" element={<RoomQRGenerator />} />
                  </Route>
                </Route>
              </Route>
            </Route>

            {/* Public Review Routes - No Auth Required */}

            {/* Room-specific QR routes (/:hotelCode/room/:roomNumber/...) */}
            <Route path="/:hotelCode/room/:roomNumber" element={<GuestLandingPage />} />
            <Route path="/:hotelCode/room/:roomNumber/service-request" element={<ServiceRequestForm />} />
            <Route path="/:hotelCode/room/:roomNumber/feedback" element={<ReviewRouter />} />
            <Route path="/:hotelCode/room/:roomNumber/service-request/service-request" element={<Navigate to="../service-request" replace />} />
            <Route path="/:hotelCode/room/:roomNumber/feedback/feedback" element={<Navigate to="../feedback" replace />} />

            {/* Category QR routes — facility-level QR codes without room number (Spec §10.1) */}
            <Route path="/:hotelCode/category/:categorySlug" element={<GuestLandingPage />} />
            <Route path="/:hotelCode/category/:categorySlug/service-request" element={<ServiceRequestForm />} />
            <Route path="/:hotelCode/category/:categorySlug/feedback" element={<ReviewRouter />} />

            {/* Generic QR Landing Page (no room, no category) */}
            <Route path="/:hotelCode" element={<GuestLandingPage />} />
            {/* Service Request Form (no room) */}
            <Route path="/:hotelCode/service-request" element={<ServiceRequestForm />} />
            {/* Live status tracking */}
            <Route path="/:hotelCode/service-request/:requestId" element={<ServiceRequestStatusPage />} />
            {/* Feedback / Review Routes */}
            <Route path="/:orgSlug/:hotelCode/feedback" element={<ReviewRouter />} />
            <Route path="/:hotelCode/feedback" element={<ReviewRouter />} />
            {/* Post-service feedback (after request completion) */}
            <Route path="/:orgSlug/:hotelCode/service-feedback/:requestId" element={<PostServiceFeedback />} />
            <Route path="/:hotelCode/service-feedback/:requestId" element={<PostServiceFeedback />} />
            {/* Org-aware review route (existing QR codes) */}
            <Route path="/:orgSlug/:hotelCode/:category" element={<ReviewRouter />} />
            {/* Legacy route (backward compatible) */}
            <Route path="/:hotelCode/:category" element={<ReviewRouter />} />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </ChartProvider>
    </ThemeProvider>
  );
}

export default App;
