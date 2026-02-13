// src/stores/settingsStore.ts
import { create } from 'zustand';
import apiClient from '../utils/apiClient';

/**
 * Theme configuration that can be customized per hotel
 */
export interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
  fontFamily: 'inter' | 'playfair' | 'system';
  logoUrl: string | null;
  welcomeMessage: string;
  thankYouMessage: string;
}

/**
 * Review page design options
 */
export type ReviewDesign = 'classic' | 'star-rating' | 'modern';

/**
 * Application settings state
 * Rating scale is fixed at 5 (displayed as 0-10 on dashboard)
 */
interface SettingsState {
  // Review page design
  reviewDesign: ReviewDesign;

  // Theme configuration
  theme: ThemeConfig;

  // Loading state
  isLoading: boolean;
  error: string | null;
  isSynced: boolean;
  lastFetched: number | null;

  // Actions
  fetchSettings: (force?: boolean) => Promise<void>;
  saveSettings: () => Promise<boolean>;
  setReviewDesign: (design: ReviewDesign) => void;
  setTheme: (theme: Partial<ThemeConfig>) => void;
  resetTheme: () => Promise<void>;
}

/**
 * Default theme configuration
 */
const defaultTheme: ThemeConfig = {
  primaryColor: '#1d4d4f',
  accentColor: '#d4a574',
  fontFamily: 'inter',
  logoUrl: null,
  welcomeMessage:
    'Thank you for choosing our hotel. We would greatly appreciate you taking the time to complete this survey.',
  thankYouMessage:
    'Thank you for your valuable feedback! We look forward to welcoming you again.',
};

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Settings store with backend sync and local persistence
 */
export const useSettingsStore = create<SettingsState>()(
  (set, get) => ({
    reviewDesign: 'classic' as ReviewDesign,
    theme: { ...defaultTheme },
    isLoading: false,
    error: null,
    isSynced: false,
    lastFetched: null,

    /**
     * Fetch settings from backend with caching
     */
    fetchSettings: async (force = false) => {
      const { lastFetched, isLoading } = get();

      // Skip if already loading
      if (isLoading) return;

      // Use cache if not forcing and cache is fresh
      if (!force && lastFetched && Date.now() - lastFetched < CACHE_DURATION) {
        return;
      }

      set({ isLoading: true, error: null });

      try {
        const response = await apiClient.get('/settings');
        const settings = response.data.data?.settings || response.data.data;

        if (settings) {
          set({
            reviewDesign: settings.reviewDesign || 'classic',
            theme: settings.theme ? { ...defaultTheme, ...settings.theme } : defaultTheme,
            isLoading: false,
            isSynced: true,
            lastFetched: Date.now(),
          });
        } else {
          set({ isLoading: false, lastFetched: Date.now() });
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch settings';
        set({ error: message, isLoading: false });
        console.error('Failed to fetch settings:', error);
      }
    },

    /**
     * Save current settings to backend
     */
    saveSettings: async () => {
      set({ isLoading: true, error: null });

      try {
        const { reviewDesign, theme } = get();

        await apiClient.put('/settings', { reviewDesign, theme });

        set({ isLoading: false, isSynced: true, lastFetched: Date.now() });
        return true;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to save settings';
        set({ error: message, isLoading: false });
        return false;
      }
    },



    setReviewDesign: (design) => {
      set({ reviewDesign: design, isSynced: false });
    },

    setTheme: (themeUpdates) => {
      set((state) => ({
        theme: { ...state.theme, ...themeUpdates },
        isSynced: false,
      }));
    },

    resetTheme: async () => {
      set({ isLoading: true });

      try {
        await apiClient.post('/settings/reset');

        set({
          theme: { ...defaultTheme },
          reviewDesign: 'classic',
          isLoading: false,
          isSynced: true,
          lastFetched: Date.now(),
        });
      } catch (error) {
        // Fallback to local reset
        set({
          theme: { ...defaultTheme },
          reviewDesign: 'classic',
          isLoading: false,
          isSynced: false,
        });
        console.error('Failed to reset settings on server:', error);
      }
    },
  })
);

/**
 * Helper hook to get rating scale labels (fixed at 1-5)
 */
export const useRatingLabels = () => {
  return {
    max: 5,
    maxLabel: 'Excellent',
    minLabel: 'Poor',
    labels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'],
  };
};

/**
 * Fetch public settings for guest review forms (no auth required)
 */
export const fetchPublicSettings = async (
  hotelId: string
): Promise<{
  reviewDesign: ReviewDesign;
  theme: ThemeConfig;
} | null> => {
  try {
    const response = await apiClient.get('/settings/public', { params: { hotelId } });
    const settings = response.data.data?.settings;

    if (settings) {
      return {
        reviewDesign: settings.reviewDesign || 'classic',
        theme: settings.theme ? { ...defaultTheme, ...settings.theme } : defaultTheme,
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch public settings:', error);
    return null;
  }
};

export default useSettingsStore;
