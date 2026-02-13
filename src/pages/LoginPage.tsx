// src/pages/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo/Kalalak.png';
import { Eye, EyeOff } from 'lucide-react';

const BRAND = {
  primary: '#1E3A5F',
  primaryHover: '#2A4A73',
  accent: '#3B82F6',
  background: '#F0F4F8',
};

// Redirect based on user role
const getRedirectPath = (role?: string): string => {
  if (role === 'super_admin') return '/super-admin';
  return '/';
};

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, user } = useAuthStore();
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
    // We only call login here.
    // If successful, the 'user' state updates, triggering the useEffect above.
    await login(username, password);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  // ❌ REMOVED: The problematic 'if (user) return <Navigate ... />' block
  // If the user exists, the useEffect above will handle the move.
  // We can render the form (or a loader) briefly while that happens.

  return (
    <div
      className="flex justify-center items-center min-h-screen"
      style={{ backgroundColor: BRAND.background }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-80 bg-white p-8 rounded-xl shadow-xl border border-gray-100"
      >
        <img src={logo} alt="Kalalak Logo" className="w-32 mx-auto mb-2" />
        <h2
          className="text-2xl font-bold text-center mb-2"
          style={{ color: BRAND.primary }}
        >
          Review System
        </h2>

        {/* ... Rest of your inputs ... */}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all"
          style={{ '--tw-ring-color': BRAND.accent } as React.CSSProperties}
        />

        <div className="relative w-full">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent pr-10 transition-all"
            style={{ '--tw-ring-color': BRAND.accent } as React.CSSProperties}
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

        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-3 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md"
          style={{ backgroundColor: BRAND.primary }}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        <p className="text-center text-xs text-gray-400 mt-2">
          Powered by Kalalak
        </p>
      </form>
    </div>
  );
};

export default LoginPage