// src/pages/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import logo from '../assets/logo/Kalalak.png';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

// Redirect based on user role
// Time: O(1), Space: O(1)
const getRedirectPath = (role?: string): string => {
  if (role === 'super_admin') return '/super-admin';
  return '/';
};

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, user } = useAuthStore();
  const { theme } = useSettingsStore();
  const navigate = useNavigate();

  // Redirect to dashboard on login
  useEffect(() => {
    if (user && !isLoading) {
      const path = getRedirectPath(user.role);
      navigate(path, { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <div
      className="flex justify-center items-center min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${theme.primaryColor}12, ${theme.accentColor}12, ${theme.primaryColor}08)`,
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
            Kalalak Insight
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
  );
};

export default LoginPage