/**
 * Super Admin Layout
 * Dedicated layout for super admin with sidebar navigation
 * Completely separate from the hotel admin/viewer dashboard
 */
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Building2, Users, LogOut, Menu, Shield } from 'lucide-react';

const NAV_ITEMS = [
    { to: '/super-admin/hotels', label: 'Hotels', icon: Building2 },
    { to: '/super-admin/users', label: 'Users', icon: Users },
];

const SuperAdminLayout: React.FC = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-64 bg-slate-900 text-white flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                {/* Brand */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">Super Admin</h1>
                        <p className="text-xs text-slate-400">Management Panel</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`
                            }
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* User section */}
                <div className="px-4 py-4 border-t border-slate-700">
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold">
                            {user?.fullName?.charAt(0) || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.fullName || 'Super Admin'}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.username}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar (mobile) */}
                <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <Menu className="w-5 h-5 text-gray-700" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-indigo-600" />
                        <span className="font-semibold text-gray-800">Super Admin</span>
                    </div>
                    <div className="w-9" /> {/* Spacer */}
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default SuperAdminLayout;
