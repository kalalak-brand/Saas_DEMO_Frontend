import React from 'react';
import { useAuthStore, isStaffRole } from '../../stores/authStore';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  // Dynamic role support - accepts any role string
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { token, user } = useAuthStore();

  // Not logged in - redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has access to this route
  const hasAccess = allowedRoles.includes(user.role) ||
    // Also allow if any staff role is allowed and user is a staff type
    (allowedRoles.some(r => r === 'staff' || r.startsWith('staff_')) && isStaffRole(user.role));

  if (!hasAccess) {
    // User is logged in but doesn't have access - redirect to their default page
    // This prevents the circular redirect loop
    if (isStaffRole(user.role)) {
      return <Navigate to="/review/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;