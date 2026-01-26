import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  // Allowed roles: super_admin, admin, viewer
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { token, user } = useAuthStore();

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
