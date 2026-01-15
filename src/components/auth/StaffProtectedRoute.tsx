// src/components/auth/StaffProtectedRoute.tsx
/**
 * Dynamic Staff Protected Route
 * Generates allowed roles from active categories + base staff role
 */
import React from 'react';
import { useAuthStore, IUser } from '../../stores/authStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { Navigate, Outlet } from 'react-router-dom';

const StaffProtectedRoute: React.FC = () => {
    const { token, user } = useAuthStore();
    const categories = useCategoryStore((state) => state.categories);

    // Build dynamic staff roles from categories
    // Includes base 'staff' role plus 'staff_[category-slug]' for each category
    const staffRoles = React.useMemo(() => {
        const dynamicRoles = categories.map((cat) => `staff_${cat.slug}` as IUser['role']);
        return ['staff' as IUser['role'], ...dynamicRoles];
    }, [categories]);

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // Check if user's role matches any staff role pattern
    const isStaff = staffRoles.includes(user.role) || user.role.startsWith('staff_');

    if (!isStaff) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default StaffProtectedRoute;
