//components/layout/header.tsx
import { useState, useRef, useEffect } from "react";
import { Menu, Settings, User, Building2, Shield, LogOut, ChevronDown } from "lucide-react";
import { FaDownload, FaSearch } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useReportStore } from '../../stores/reportStore';
import { useAuthStore } from '../../stores/authStore';
import YearlyReportModal from '../common/YearlyReportModal';

interface HeaderProps {
  toggleSidebar: () => void;
  isMobile: boolean;
}

export const Header = ({ toggleSidebar, isMobile }: HeaderProps) => {
  const openModal = useReportStore((state) => state.openModal);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Show management link for admin and super_admin roles
  const canAccessManagement = user?.role === 'admin' || user?.role === 'super_admin';

  // Close profile dropdown on outside click
  // Time: O(1), Space: O(1)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const roleLabel = user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : 'Viewer';
  const roleColor = user?.role === 'super_admin'
    ? 'bg-purple-100 text-purple-700'
    : user?.role === 'admin'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-gray-100 text-gray-600';

  return (
    <>
      <header className="bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-1">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="text-gray-500 hover:text-gray-600 focus:outline-none"
              >
                <Menu className="h-6 w-6" />
              </button>
            )}
            <span className="hidden md:inline text-xl text-gray-500 font-semibold">Dashboards <span className="mx-1 text-gray-400">/</span> Menu</span>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="relative w-44 md:w-72">
              <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
              <input
                className="w-full pl-10 pr-3 py-2 rounded-full border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200 text-sm"
                placeholder="Search"
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            {/* Management Link for Admin/Super Admin */}
            {canAccessManagement && (
              <Link
                to="/management/questions"
                className="flex items-center gap-2 font-semibold text-primary hover:text-primary/75 transition-colors"
                title="Form Builder & Settings"
              >
                <Settings className="h-5 w-5" />
                <span className="hidden md:inline">Management</span>
              </Link>
            )}
            <button onClick={openModal} title="Download Yearly Report" className="flex gap-4 font-semibold">
              Download
              <FaDownload className="text-xl text-primary hover:text-primary/75 cursor-pointer" />
            </button>

            {/* Profile Icon with Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                title="Profile"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  {/* User info header */}
                  <div className="px-5 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
                        {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{user?.fullName || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">@{user?.username || 'unknown'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="px-5 py-3 space-y-3">
                    {/* Role */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Shield className="w-4 h-4" />
                        <span>Role</span>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleColor}`}>
                        {roleLabel}
                      </span>
                    </div>

                    {/* Assigned Hotel */}
                    {user?.hotelId && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Building2 className="w-4 h-4" />
                          <span>Hotel</span>
                        </div>
                        <span className="text-sm font-medium text-gray-800 truncate max-w-[140px]">
                          {typeof user.hotelId === 'object' ? user.hotelId.name : user.hotelId}
                        </span>
                      </div>
                    )}

                    {/* Username */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <User className="w-4 h-4" />
                        <span>Username</span>
                      </div>
                      <span className="text-sm font-medium text-gray-800">
                        {user?.username}
                      </span>
                    </div>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-100 px-3 py-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <YearlyReportModal />
    </>
  );
};