// src/pages/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { requestNotificationPermission } from '../utils/notificationPermission';
import logo from '../assets/logo/Kalalak.png';
import { Eye, EyeOff, Loader2, Bell, X } from 'lucide-react';

// Redirect based on user role after login.
// Owner and GM must select a working hotel before any API calls fire.
// Time: O(1), Space: O(1)
const getRedirectPath = (role?: string): string => {
  if (role === 'hotel_owner' || role === 'hotel_gm') return '/select-hotel';
  return '/';
};

/**
 * Notification Permission Banner
 * Shows a top bar when browser notification permission has not yet been decided.
 * Disappears automatically once the user grants or denies, or manually closes it.
 */
const NotificationBanner: React.FC<{
  onDismiss: () => void;
  onAllow: () => void;
}> = ({ onDismiss, onAllow }) => (
  <div
    role="alert"
    className="fixed top-0 left-0 right-0 z-[99999] flex items-center justify-between gap-3 px-5 py-3 text-sm font-medium text-white shadow-lg"
    style={{ background: 'linear-gradient(90deg, #1B4D3E, #2D6A55)' }}
  >
    <div className="flex items-center gap-3">
      <Bell size={18} className="shrink-0 animate-bounce" />
      <span>
        Enable browser notifications to receive <strong>instant low-rating alerts</strong> with sound.
      </span>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={onAllow}
        className="px-4 py-1.5 rounded-lg bg-white text-[#1B4D3E] font-semibold text-xs hover:bg-gray-100 transition-colors"
      >
        Allow Notifications
      </button>
      <button
        onClick={onDismiss}
        title="Dismiss"
        className="p-1 rounded-full hover:bg-white/20 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  </div>
);

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const { login, isLoading, error, user, isValidating } = useAuthStore();
  const { theme } = useSettingsStore();
  const navigate = useNavigate();

  // Redirect to dashboard on login — but ONLY after token validation completes
  // This prevents redirect loops caused by stale tokens in localStorage
  useEffect(() => {
    if (isValidating) return; // Wait for startup token validation to finish
    if (user && !isLoading) {
      // Check if permission has NOT been decided yet — show the banner
      if ('Notification' in window && Notification.permission === 'default') {
        setShowNotifBanner(true);
        // Auto-redirect after a short delay so user sees the banner
        const timer = setTimeout(() => {
          navigate(getRedirectPath(user.role), { replace: true });
        }, 3000);
        return () => clearTimeout(timer);
      } else {
        // Permission already decided (granted or denied) — redirect immediately
        navigate(getRedirectPath(user.role), { replace: true });
      }
    }
  }, [user, isLoading, isValidating, navigate]);

  const handleAllowNotifications = async () => {
    try {
      await requestNotificationPermission();
    } catch {
      // Silently ignore
    }
    setShowNotifBanner(false);
    if (user) {
      navigate(getRedirectPath(user.role), { replace: true });
    }
  };

  const handleDismissBanner = () => {
    setShowNotifBanner(false);
    if (user) {
      navigate(getRedirectPath(user.role), { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <>
      {/* Notification Permission Banner */}
      {showNotifBanner && (
        <NotificationBanner
          onAllow={handleAllowNotifications}
          onDismiss={handleDismissBanner}
        />
      )}

      <div
        className="flex justify-center items-center min-h-screen"
        style={{
          background: `linear-gradient(135deg, ${theme.primaryColor}12, ${theme.accentColor}12, ${theme.primaryColor}08)`,
          paddingTop: showNotifBanner ? '56px' : '0',
        }}
      >
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 w-[22rem] bg-white p-9 rounded-2xl shadow-xl border border-gray-100"
        >
          {/* Logo */}
          <img src={logo} alt="Kalalak Insight" className="w-28 mx-auto" />

          {/* Brand Title */}
          <div className="text-center mb-1">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: theme.primaryColor }}
            >
              Kalalak Controll
            </h1>
            <p className="text-[0.7rem] tracking-[0.15em] uppercase font-medium mt-1"
              style={{ color: theme.accentColor }}
            >
              Hospitality Performance Intelligence Platform
            </p>
          </div>

          {/* Username */}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
            style={{ '--tw-ring-color': theme.accentColor } as React.CSSProperties}
          />

          {/* Password */}
          <div className="relative w-full">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent pr-10 transition-all"
              style={{ '--tw-ring-color': theme.accentColor } as React.CSSProperties}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-3 text-white rounded-xl font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
            style={{
              backgroundColor: isLoading ? undefined : theme.primaryColor,
              ...(isLoading ? { backgroundColor: '#9ca3af' } : {}),
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <p className="text-center text-xs mt-1" style={{ color: `${theme.primaryColor}80` }}>
            Powered by <span className="font-semibold" style={{ color: theme.primaryColor }}>Kalalak</span>
          </p>
        </form>
      </div>
    </>
  );
};

export default LoginPage;

