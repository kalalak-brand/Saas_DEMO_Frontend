import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  // Allowed roles: saas_admin, owner, gm, supervisor, dept_head, staff
  allowedRoles: string[];
}

/**
 * Auth guard for protected routes.
 * Shows loading during token validation, redirects unauthenticated users.
 * Time: O(r) where r = allowedRoles.length (bounded, typically <7)
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { token, user, isValidating } = useAuthStore();

  // While startup token validation is in progress, show loading
  // This prevents the redirect loop: /login → / → /login
  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-background">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-100 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-lg font-medium text-primary animate-pulse-subtle">Verifying session...</p>
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has access to this route
  const hasAccess = allowedRoles.includes(user.role);

  if (!hasAccess) {
    // User is logged in but doesn't have access - redirect to home
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
