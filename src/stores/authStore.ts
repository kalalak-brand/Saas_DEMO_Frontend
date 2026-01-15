// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface IUser {
  _id: string;
  fullName: string;
  username: string;
  role: string; // Dynamic: 'super_admin' | 'admin' | 'viewer' | 'staff' | 'staff_[category-slug]'
  staffCategory?: string;
  // <-- MODIFIED: This now matches the populated object from the backend -->
  hotelId?: {
    _id: string;
    name: string;
  };
}

/**
 * Helper to check if a role is any type of staff role
 */
export const isStaffRole = (role: string): boolean => {
  return role === 'staff' || role.startsWith('staff_');
};

/**
 * Helper to get the category slug from a staff role
 * @returns category slug (e.g., 'room', 'f&b', 'cfc') or null if not a staff role
 */
export const getCategoryFromRole = (role: string): string | null => {
  if (role.startsWith('staff_')) {
    return role.replace('staff_', '');
  }
  return null;
};

/**
 * Helper to check if a role is an admin-type role
 */
export const isAdminRole = (role: string): boolean => {
  return ['super_admin', 'admin', 'viewer'].includes(role);
};

interface AuthState {
  token: string | null;
  user: IUser | null;
  isLoading: boolean;
  error: string | null;
  setAuth: (token: string, user: IUser) => void;
  logout: () => void;
  login: (username: string, password: string) => Promise<IUser | null>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoading: false,
      error: null,

      setAuth: (token, user) => {
        set({ token, user, isLoading: false, error: null });
      },

      logout: () => {
        set({ token: null, user: null });
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
    }),
    {
      name: 'auth-storage',
    }
  )
);