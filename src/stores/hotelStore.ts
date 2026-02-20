/**
 * Hotel Store
 * Manages hotel data with Zustand — provides CRUD operations and caching.
 * 
 * DSA: Array-based hotel list with O(n) find for getHotelNameById.
 * For larger datasets, a HashMap (Map<string, IHotel>) would give O(1) lookup,
 * but hotel counts are typically small (< 100), so O(n) is acceptable.
 * 
 * Time: O(1) per API call, O(n) for getHotelNameById
 * Space: O(n) where n = number of hotels
 */
import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';

const BASE_URL = import.meta.env.VITE_API_URL;

export interface IHotel {
  _id: string;
  name: string;
  code?: string;
  logo?: { url: string; publicId: string };
  address?: string;
  city?: string;
  country?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface HotelState {
  hotels: IHotel[];
  isLoading: boolean;
  error: string | null;
  fetchHotels: (force?: boolean) => Promise<void>;
  getHotelNameById: (hotelId: string) => string;
  createHotel: (data: Partial<IHotel>) => Promise<boolean>;
  updateHotel: (id: string, data: Partial<IHotel>) => Promise<boolean>;
  deleteHotel: (id: string) => Promise<boolean>;
  uploadLogo: (hotelId: string, file: File) => Promise<IHotel | null>;
  deleteLogo: (hotelId: string) => Promise<IHotel | null>;
  clearError: () => void;
}

/**
 * Get authorization headers from auth store
 * Time: O(1), Space: O(1)
 */
const getAuthHeader = () => {
  const token = useAuthStore.getState().token;
  if (!token) {
    throw new Error('Not authenticated');
  }
  return { headers: { Authorization: `Bearer ${token}` } };
};

/**
 * Extract user-friendly error message from Axios errors
 * Time: O(1), Space: O(1)
 */
const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err) && err.response?.data?.message) {
    return err.response.data.message;
  }
  return fallback;
};

export const useHotelStore = create<HotelState>((set, get) => ({
  hotels: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  // Time: O(1) API call, Space: O(n) hotels
  fetchHotels: async (force = false) => {
    if (get().hotels.length > 0 && !force) return;
    set({ isLoading: true, error: null });

    try {
      const response = await axios.get(
        `${BASE_URL}/admin/hotels`,
        getAuthHeader()
      );

      const hotels = response.data.data?.hotels || response.data.data || [];
      set({ hotels, isLoading: false });
    } catch (err) {
      set({
        error: extractErrorMessage(err, 'Failed to load hotels.'),
        isLoading: false,
      });
    }
  },

  // Time: O(n) linear scan, Space: O(1)
  getHotelNameById: (hotelId: string) => {
    const hotel = get().hotels.find((h) => h._id === hotelId);
    return hotel ? hotel.name : 'N/A';
  },

  // Time: O(1) API call, Space: O(1)
  createHotel: async (data: Partial<IHotel>) => {
    if (!data.name || !data.name.trim()) {
      set({ error: 'Hotel name is required.' });
      return false;
    }

    set({ isLoading: true, error: null });
    try {
      await axios.post(`${BASE_URL}/admin/hotels`, data, getAuthHeader());
      await get().fetchHotels(true);
      return true;
    } catch (err) {
      set({
        error: extractErrorMessage(err, 'Failed to create hotel.'),
        isLoading: false,
      });
      return false;
    }
  },

  // Time: O(1) API call, Space: O(1)
  updateHotel: async (id: string, data: Partial<IHotel>) => {
    if (!id) {
      set({ error: 'Hotel ID is required for update.' });
      return false;
    }

    set({ isLoading: true, error: null });
    try {
      await axios.put(`${BASE_URL}/admin/hotels/${id}`, data, getAuthHeader());
      await get().fetchHotels(true);
      return true;
    } catch (err) {
      set({
        error: extractErrorMessage(err, 'Failed to update hotel.'),
        isLoading: false,
      });
      return false;
    }
  },

  // Time: O(1) API call, Space: O(1)
  deleteHotel: async (id: string) => {
    if (!id) {
      set({ error: 'Hotel ID is required for deletion.' });
      return false;
    }

    set({ isLoading: true, error: null });
    try {
      await axios.delete(`${BASE_URL}/admin/hotels/${id}`, getAuthHeader());
      await get().fetchHotels(true);
      return true;
    } catch (err) {
      set({
        error: extractErrorMessage(err, 'Failed to delete hotel.'),
        isLoading: false,
      });
      return false;
    }
  },

  /**
   * Upload a logo for a hotel
   * Time: O(file_size) — multipart upload
   * Space: O(1)
   */
  uploadLogo: async (hotelId: string, file: File) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const response = await axios.post(
        `${BASE_URL}/admin/hotels/${hotelId}/logo`,
        formData,
        {
          ...getAuthHeader(),
          headers: {
            ...getAuthHeader().headers,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      const hotel = response.data.data?.hotel || null;
      await get().fetchHotels(true);
      set({ isLoading: false });
      return hotel;
    } catch (err) {
      set({
        error: extractErrorMessage(err, 'Failed to upload logo.'),
        isLoading: false,
      });
      return null;
    }
  },

  /**
   * Delete a hotel's logo
   * Time: O(1)
   * Space: O(1)
   */
  deleteLogo: async (hotelId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.delete(
        `${BASE_URL}/admin/hotels/${hotelId}/logo`,
        getAuthHeader()
      );
      const hotel = response.data.data?.hotel || null;
      await get().fetchHotels(true);
      set({ isLoading: false });
      return hotel;
    } catch (err) {
      set({
        error: extractErrorMessage(err, 'Failed to delete logo.'),
        isLoading: false,
      });
      return null;
    }
  },
}));