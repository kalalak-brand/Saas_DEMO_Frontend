//components/layout/header.tsx
import { useState, useRef, useEffect } from "react";
import { Menu, Settings, User, Building2, Shield, LogOut, ChevronDown, Bell, CheckCheck, AlertTriangle, Phone, DoorOpen, UserIcon, ChevronRight, BarChart3 } from "lucide-react";
import { FaDownload, FaSearch } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useReportStore } from '../../stores/reportStore';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore, NotificationItem, LowRatedQuestionItem } from '../../stores/notificationStore';
import YearlyReportModal from '../common/YearlyReportModal';
import { PWAInstallButton } from '../../hooks/usePWA';
import { subscribeCurrentUserToPush } from '../../utils/userPushSubscription';
import toast from 'react-hot-toast';

interface HeaderProps {
  toggleSidebar: () => void;
  isMobile: boolean;
}

/**
 * Get color class for rating badge based on score.
 * Time: O(1), Space: O(1)
 */
const getRatingColor = (rating: number): string => {
  if (rating <= 1) return 'bg-red-500 text-white';
  if (rating <= 2) return 'bg-orange-500 text-white';
  return 'bg-amber-400 text-gray-800';
};

/**
 * Expandable notification card with per-question bundled view.
 * Shows category, timestamp, guest info at glance. Expands to show
 * individual low-rated questions with color-coded rating badges.
 *
 * Time: O(m) where m = lowRatedQuestions count, Space: O(1)
 */
const NotificationCard = ({ notification: n, onMarkRead, timeAgo }: {
  notification: NotificationItem;
  onMarkRead: () => void;
  timeAgo: (d: string) => string;
}) => {
  const [expanded, setExpanded] = useState(false);
  const lowRated = n.metadata.lowRatedQuestions ?? [];

  const handleClick = () => {
    onMarkRead();
    setExpanded(!expanded);
  };

  // Format full timestamp for expanded view
  const fullTimestamp = new Date(n.createdAt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  return (
    <div
      className={`border-b border-gray-50 transition-colors ${!n.isRead ? 'bg-red-50/50' : ''}`}
    >
      {/* Main row — always visible */}
      <div
        onClick={handleClick}
        className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start gap-3">
          {/* Rating circle */}
          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white ${(n.metadata.avgRating ?? 0) <= 1 ? 'bg-red-500' : (n.metadata.avgRating ?? 0) <= 2 ? 'bg-orange-500' : 'bg-amber-500'
            }`}>
            {n.metadata.avgRating?.toFixed(1) ?? '—'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {n.metadata.categoryName || 'Low Rating'}
                {lowRated.length > 0 && (
                  <span className="ml-1.5 text-[10px] font-medium bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                    {lowRated.length} question{lowRated.length > 1 ? 's' : ''}
                  </span>
                )}
              </p>
              <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                {timeAgo(n.createdAt)}
              </span>
            </div>
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
            <div className="flex items-center gap-2 mt-1">
              {!n.isRead && (
                <span className="inline-block w-2 h-2 bg-red-500 rounded-full" />
              )}
              {lowRated.length > 0 && (
                <span className="text-[10px] text-indigo-500 flex items-center gap-0.5">
                  <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
                  {expanded ? 'Hide' : 'Show'} questions
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded: per-question breakdown */}
      {expanded && lowRated.length > 0 && (
        <div className="px-4 pb-3 pt-0">
          <div className="ml-12 space-y-1.5 border-l-2 border-red-200 pl-3">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">
              Low-Rated Questions • {fullTimestamp}
            </p>
            {lowRated.map((q: LowRatedQuestionItem, idx: number) => (
              <div key={idx} className="flex items-center gap-2 py-1">
                <span className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${getRatingColor(q.rating)}`}>
                  {q.rating}
                </span>
                <span className="text-xs text-gray-700 leading-tight">{q.questionText}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const Header = ({ toggleSidebar, isMobile }: HeaderProps) => {
  const openModal = useReportStore((state) => state.openModal);
  const { user, logout, token } = useAuthStore();
  const { unreadCount, notifications, loading, fetchNotifications, markAsRead, markAllAsRead, startPolling, stopPolling } = useNotificationStore();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [pushEnabling, setPushEnabling] = useState(false);

  // Show management link only for config-capable roles (saas admin + owner)
  // Time: O(1) via Set lookup
  const canAccessManagement = user?.role === 'saas_superAdmin' || user?.role === 'hotel_owner';

  // GM gets direct access to service analytics from the dashboard header
  // Time: O(1)
  const canAccessServiceAnalysis = user?.role === 'hotel_gm';

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

  const handleEnablePushForUser = async () => {
    if (!token) return;
    setPushEnabling(true);
    const ok = await subscribeCurrentUserToPush(token);
    setPushEnabling(false);
    if (ok) toast.success('Notifications enabled on this device.');
    else toast.error('Could not enable notifications. Check permission and VAPID key.');
  };

  const roleLabels: Record<string, string> = {
    saas_superAdmin: 'SaaS Admin',
    hotel_owner: 'Owner',
    hotel_gm: 'General Manager',
    hotel_supervisor: 'Supervisor',
    hotel_dept_supervisor: 'Dept. Head',
    hotel_dept_staff: 'Staff',
  };
  const roleColors: Record<string, string> = {
    saas_superAdmin: 'bg-red-100 text-red-700',
    hotel_owner: 'bg-purple-100 text-purple-700',
    hotel_gm: 'bg-blue-100 text-blue-700',
    hotel_supervisor: 'bg-teal-100 text-teal-700',
    hotel_dept_supervisor: 'bg-amber-100 text-amber-700',
    hotel_dept_staff: 'bg-gray-100 text-gray-600',
  };
  const roleLabel = roleLabels[user?.role || 'hotel_dept_staff'] || 'Staff';
  const roleColor = roleColors[user?.role || 'hotel_dept_staff'] || 'bg-gray-100 text-gray-600';

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
            
            <PWAInstallButton />

            {/* Enable Push Notifications for staff/owner/gm */}
            <button
              onClick={handleEnablePushForUser}
              disabled={pushEnabling}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors text-sm font-semibold disabled:opacity-60"
              title="Enable notifications on this device"
            >
              <Bell className="h-4 w-4" />
              {pushEnabling ? 'Enabling…' : 'Enable Alerts'}
            </button>

            {/* Management Link for Admin / Owner */}
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

            {/* Service Analysis Link for General Manager */}
            {canAccessServiceAnalysis && (
              <Link
                to="/management/service-analytics"
                className="flex items-center gap-2 font-semibold text-primary hover:text-primary/75 transition-colors"
                title="Service Request Analysis"
              >
                <BarChart3 className="h-5 w-5" />
                <span className="hidden md:inline">Service Analysis</span>
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

              {/* Notification Dropdown — Bundled View */}
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

                  {/* Notification List with bundled per-question view */}
                  <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="text-center py-8 px-4">
                        <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No alerts yet</p>
                        <p className="text-xs text-gray-300 mt-1">Low-rating alerts (≤ 3) will appear here</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <NotificationCard
                          key={n._id}
                          notification={n}
                          onMarkRead={() => { if (!n.isRead) markAsRead(n._id); }}
                          timeAgo={timeAgo}
                        />
                      ))
                    )}
                  </div>

                  {/* Footer — View All link */}
                  {notifications.length > 0 && canAccessManagement && (
                    <div className="border-t border-gray-100 px-4 py-2">
                      <button
                        onClick={() => { setNotifOpen(false); navigate('/management/report/low-rated-questions'); }}
                        className="w-full text-center text-xs text-indigo-600 hover:text-indigo-800 font-medium py-1"
                      >
                        View All Low-Rated Reports →
                      </button>
                    </div>
                  )}
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