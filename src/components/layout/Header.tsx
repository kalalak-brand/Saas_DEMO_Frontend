//components/layout/header.tsx
import { useState, useRef, useEffect } from "react";
import { Menu, Settings, User, Building2, Shield, LogOut, ChevronDown, Bell, CheckCheck, AlertTriangle, Phone, DoorOpen, UserIcon } from "lucide-react";
import { FaDownload, FaSearch } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useReportStore } from '../../stores/reportStore';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import YearlyReportModal from '../common/YearlyReportModal';

interface HeaderProps {
  toggleSidebar: () => void;
  isMobile: boolean;
}

export const Header = ({ toggleSidebar, isMobile }: HeaderProps) => {
  const openModal = useReportStore((state) => state.openModal);
  const { user, logout } = useAuthStore();
  const { unreadCount, notifications, loading, fetchNotifications, markAsRead, markAllAsRead, startPolling, stopPolling } = useNotificationStore();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Show management link for hotel-level admin roles (saas/org admins use separate dashboard)
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

  // Close notification dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  // Start/stop notification polling on mount/unmount
  useEffect(() => {
    startPolling();
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch full notifications when dropdown opens
  useEffect(() => {
    if (notifOpen) {
      fetchNotifications();
    }
  }, [notifOpen, fetchNotifications]);

  /** Format relative time. Time: O(1), Space: O(1) */
  const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const roleLabels: Record<string, string> = {
    saas_admin: 'SaaS Admin',
    org_admin: 'Org Admin',
    super_admin: 'Super Admin',
    admin: 'Admin',
    viewer: 'Viewer',
  };
  const roleColors: Record<string, string> = {
    saas_admin: 'bg-red-100 text-red-700',
    org_admin: 'bg-orange-100 text-orange-700',
    super_admin: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    viewer: 'bg-gray-100 text-gray-600',
  };
  const roleLabel = roleLabels[user?.role || 'viewer'] || 'Viewer';
  const roleColor = roleColors[user?.role || 'viewer'] || 'bg-gray-100 text-gray-600';

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
            {/* Hotel name or Dashboard label */}
            <span className="hidden md:inline text-lg text-gray-700 font-semibold">
              {user?.hotelId && typeof user.hotelId === 'object' ? user.hotelId.name : 'Dashboard'}
            </span>
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

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Notifications"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="font-semibold text-sm text-gray-800">Low Rating Alerts</span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark All Read
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto">
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="text-center py-8 px-4">
                        <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No alerts yet</p>
                        <p className="text-xs text-gray-300 mt-1">Low-rating alerts will appear here</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => { if (!n.isRead) markAsRead(n._id); }}
                          className={`px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${!n.isRead ? 'bg-red-50/50' : ''
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Rating circle */}
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white ${(n.metadata.avgRating ?? 0) <= 1 ? 'bg-red-500' : 'bg-orange-500'
                              }`}>
                              {n.metadata.avgRating?.toFixed(1)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-800 truncate">
                                  {n.metadata.categoryName || 'Low Rating'}
                                </p>
                                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                  {timeAgo(n.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                              {/* Guest info chips */}
                              {(n.metadata.guestName || n.metadata.guestPhone || n.metadata.guestRoomNumber) && (
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {n.metadata.guestName && (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                      <UserIcon className="w-2.5 h-2.5" />{n.metadata.guestName}
                                    </span>
                                  )}
                                  {n.metadata.guestRoomNumber && (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                                      <DoorOpen className="w-2.5 h-2.5" />Room {n.metadata.guestRoomNumber}
                                    </span>
                                  )}
                                  {n.metadata.guestPhone && (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">
                                      <Phone className="w-2.5 h-2.5" />{n.metadata.guestPhone}
                                    </span>
                                  )}
                                </div>
                              )}
                              {!n.isRead && (
                                <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-1.5" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
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