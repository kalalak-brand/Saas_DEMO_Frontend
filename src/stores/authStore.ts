// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface IUser {
  _id: string;
  fullName: string;
  username: string;
  role: 'saas_superAdmin' | 'hotel_owner' | 'hotel_gm' | 'hotel_supervisor' | 'hotel_dept_supervisor' | 'hotel_dept_staff';
  organizationId?: {
    _id: string;
    name: string;
    slug: string;
  };
  hotelId?: {
    _id: string;
    name: string;
    code: string;
    logo?: { url: string; publicId: string };
  };
  departmentId?: {
    _id: string;
    name: string;
  };
  allowedHotels?: Array<{ _id: string; name: string; code: string } | string>;
  allowedCategories?: Array<{ _id: string; name: string; slug: string }> | string[];
}

/**
 * Helper: check if a role has dashboard/analytics access (hotel-level view)
 * Time: O(1) via Set lookup
 */
const DASHBOARD_ROLES = new Set(['hotel_owner', 'hotel_gm', 'hotel_supervisor', 'hotel_dept_supervisor', 'hotel_dept_staff']);
export const isAdminRole = (role: string): boolean => {
  return DASHBOARD_ROLES.has(role);
};

/**
 * Helper: check if a role can modify configuration (SaaS-level or owner)
 * Time: O(1)
 */
export const isConfigRole = (role: string): boolean => {
  return role === 'saas_superAdmin' || role === 'hotel_owner';
};

/**
 * Helper: check if a role is analytics-only (read-only dashboard)
 * Time: O(1)
 */
export const isAnalyticsOnlyRole = (role: string): boolean => {
  return role === 'hotel_owner' || role === 'hotel_gm';
};

/**
 * Helper: check if a role is department-scoped
 * Time: O(1)
 */
export const isDepartmentScopedRole = (role: string): boolean => {
  return role === 'hotel_dept_supervisor' || role === 'hotel_dept_staff';
};

interface AuthState {
  token: string | null;
  user: IUser | null;
  isLoading: boolean;
  error: string | null;
  isValidating: boolean; // True while verifying persisted token on startup
  setAuth: (token: string, user: IUser) => void;
  /** Persist selected working hotel for owner/gm contexts */
  setSelectedHotel: (hotel: { _id: string; name: string; code: string; logo?: { url: string; publicId?: string } } | null) => void;
  logout: () => void;
  login: (username: string, password: string) => Promise<IUser | null>;
  updateHotelLogo: (logo: { url: string; publicId: string } | undefined) => void;
  validateToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: false,
      error: null,
      isValidating: false,

      setAuth: (token, user) => {
        set({ token, user, isLoading: false, error: null });
      },

      setSelectedHotel: (hotel) => {
        const user = get().user;
        if (!user) return;
        // Owner/GM can switch "working hotel" in the UI
        set({ user: { ...user, hotelId: hotel ? (hotel as any) : undefined } });
        if (hotel?._id) {
          localStorage.setItem('lastSelectedHotelId', hotel._id);
        }
      },

      logout: () => {
        set({ token: null, user: null });
        // Clear all hotel-scoped persisted stores to prevent stale data
        localStorage.removeItem('review-system-categories');
        localStorage.removeItem('review-system-settings');
      },

      updateHotelLogo: (logo) => {
        const user = get().user;
        if (user?.hotelId) {
          set({ user: { ...user, hotelId: { ...user.hotelId, logo } } });
        }
      },

      login: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${BASE_URL}/auth/login`, {
            username,
            password,
          });

          // 🛑 FIX: Correctly structure the response parsing
          // The backend sends: { status: 'success', data: { user, accessToken, ... } }
          const { data } = response.data;

          // Check if data exists to avoid crashes
          if (!data || !data.accessToken) {
            throw new Error('Invalid response from server');
          }

          const accessToken = data.accessToken;
          const user = data.user;

          set({ token: accessToken, user: user, isLoading: false });
          return user;

        } catch (err) {
          const errorMessage = axios.isAxiosError(err) && err.response
            ? err.response.data.message
            : 'Login failed. Please try again.';
          set({ error: errorMessage, isLoading: false });
          return null;
        }
      },

      /**
       * Validate persisted token against /api/auth/me.
       * Called on app startup after Zustand rehydrates from localStorage.
       * If the token is expired/invalid, clears auth state to prevent redirect loops.
       * Time: O(1) network call, Space: O(1)
       */
      validateToken: async () => {
        const { token } = get();
        if (!token) {
          set({ isValidating: false });
          return;
        }

        set({ isValidating: true });
        try {
          const res = await axios.get(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          });
          // Update user data from server (in case role/permissions changed)
          const userData = res.data?.data?.user || res.data?.user;
          if (userData) {
            set({ user: userData, isValidating: false });
          } else {
            set({ isValidating: false });
          }
        } catch {
          // Token is invalid/expired — clear everything
          console.warn('[Auth] Persisted token invalid, clearing auth state');
          set({ token: null, user: null, isValidating: false });
          localStorage.removeItem('review-system-categories');
          localStorage.removeItem('review-system-settings');
        }
      },
    }),
    {
      name: 'auth-storage',
      // Auto-validate token when store rehydrates from localStorage
      onRehydrateStorage: () => {
        return (_state, error) => {
          if (!error) {
            // Defer validation to next tick to ensure store is fully initialized
            setTimeout(() => {
              useAuthStore.getState().validateToken();
            }, 0);
          }
        };
      },
    }
  )
);
