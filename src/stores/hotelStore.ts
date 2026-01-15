import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';

const BASE_URL = import.meta.env.VITE_API_URL;

export interface IHotel {
  _id: string;
  name: string;
}

interface HotelState {
  hotels: IHotel[];
  isLoading: boolean;
  error: string | null;
  fetchHotels: (force?: boolean) => Promise<void>;
  getHotelNameById: (hotelId: string) => string;
  createHotel: (name: string) => Promise<boolean>;
  updateHotel: (id: string, name: string) => Promise<boolean>;
  deleteHotel: (id: string) => Promise<boolean>;
}

const getAuthHeader = () => {
  const token = useAuthStore.getState().token;
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const useHotelStore = create<HotelState>((set, get) => ({
  hotels: [],
  isLoading: false,
  error: null,

  fetchHotels: async (force = false) => {
    if (get().hotels.length > 0 && !force) return;
    set({ isLoading: true, error: null });
    
    try {
      const token = useAuthStore.getState().token;
      if (!token) throw new Error('Not authenticated');

      // <-- MODIFIED: Use the /api/admin route
      const response = await axios.get(`${BASE_URL}/admin/hotels`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      set({ hotels: response.data.data.hotels, isLoading: false });
    } catch (err) {
      console.error("Failed to fetch hotels:", err);
      set({ error: 'Failed to load hotels.', isLoading: false });
    }
  },

  getHotelNameById: (hotelId: string) => {
    const hotel = get().hotels.find(h => h._id === hotelId);
    return hotel ? hotel.name : 'N/A';
  },

  createHotel: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(
        `${BASE_URL}/admin/hotels`, // <-- MODIFIED: Use admin route
        { name },
        getAuthHeader()
      );
      await get().fetchHotels(true); // Force refresh the list
      return true;
    } catch (err) {
      console.error("Failed to create hotel:", err);
      const errorMsg = (axios.isAxiosError(err) && err.response?.data?.message)
        ? err.response.data.message
        : 'Failed to create hotel.';
      set({ error: errorMsg, isLoading: false });
      return false;
    }
  },

  updateHotel: async (id: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      await axios.put(
        `${BASE_URL}/admin/hotels/${id}`, // <-- MODFIED: Use admin route
        { name },
        getAuthHeader()
      );
      await get().fetchHotels(true); // Force refresh the list
      return true;
    } catch (err) {
      console.error("Failed to update hotel:", err);
      set({ error: 'Failed to update hotel.', isLoading: false });
      return false;
    }
  },

  deleteHotel: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(
        `${BASE_URL}/admin/hotels/${id}`, // <-- MODIFIED: Use admin route
        getAuthHeader()
      );
      await get().fetchHotels(true); // Force refresh the list
      return true;
    } catch (err) {
      console.error("Failed to delete hotel:", err);
      set({ error: 'Failed to delete hotel.', isLoading: false });
      return false;
    }
  },
}));