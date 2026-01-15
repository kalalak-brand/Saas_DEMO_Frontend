import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';
import { ReviewPayload } from './reviewStore'; // This should now work
import { useReviewStore } from './reviewStore'; // NEW: Import to set questions publicly

import { GuestInfoFields } from './categoryStore';

const BASE_URL = import.meta.env.VITE_API_URL;

// Full category info returned from token validation
interface PublicCategoryInfo {
  _id: string;
  name: string;
  slug: string;
  guestInfoFields?: GuestInfoFields;
}

interface TokenState {
  generatedToken: string | null;
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;

  publicCategory: string | null;
  publicCategoryInfo: PublicCategoryInfo | null; // NEW: Full category object
  publicHotelId: { _id: string; name: string } | null;
  isPublicLoading: boolean;
  publicError: string | null;

  generateToken: (categoryId: string) => Promise<string | null>;
  validateToken: (token: string) => Promise<string | null>;
  publicFetchQuestions: (category: string) => Promise<void>;
  submitPublicReview: (token: string, payload: ReviewPayload) => Promise<boolean>;
  clearToken: () => void;
}

const getAuthHeader = () => {
  const token = useAuthStore.getState().token;
  // This helper correctly gets the token. The backend will use it
  // to get the staff's hotelId and attach it to the generated token.
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const useTokenStore = create<TokenState>((set, _) => ({
  generatedToken: null,
  isLoading: false,
  error: null,
  isSubmitting: false,
  publicCategory: null,
  publicCategoryInfo: null, // NEW: Full category object
  publicHotelId: null,
  isPublicLoading: true,
  publicError: null,

  clearToken: () => set({ generatedToken: null, error: null }),

  generateToken: async (categoryId: string) => {
    set({ isLoading: true, error: null, generatedToken: null });
    try {
      const response = await axios.post(
        `${BASE_URL}/tokens`,
        { category: categoryId },
        getAuthHeader() // Sends token
      );
      // Backend returns: { status: 'success', data: { token: { token: 'xxx', ... } } }
      const tokenData = response.data.data?.token || response.data.token;
      const tokenString = tokenData?.token || tokenData; // Get the actual token string
      set({ generatedToken: tokenString, isLoading: false });
      return tokenString;
    } catch (err) {
      console.error("Failed to generate token:", err);
      const errorMsg = (axios.isAxiosError(err) && err.response?.data?.message)
        ? err.response.data.message
        : "Failed to generate link.";
      set({ error: errorMsg, isLoading: false });
      return null;
    }
  },

  validateToken: async (token) => {
    set({ isPublicLoading: true, publicError: null, publicCategory: null, publicCategoryInfo: null, publicHotelId: null });
    try {
      const response = await axios.get(
        `${BASE_URL}/tokens/public/${token}`
      );
      // Backend returns: { token: { category: { _id, name, slug, guestInfoFields }, hotel: {...} } }
      const tokenData = response.data.data?.token || response.data.token;
      const categoryObj = tokenData?.category;
      const hotelObj = tokenData?.hotel || tokenData?.hotelId;

      if (categoryObj && hotelObj) {
        set({
          publicCategory: categoryObj.slug || categoryObj._id,
          publicCategoryInfo: categoryObj, // Store full category object
          publicHotelId: hotelObj,
          isPublicLoading: false
        });
        return categoryObj.slug || categoryObj._id;
      }
      throw new Error("Invalid response received.");
    } catch (err) {
      console.error("Failed to validate token:", err);
      set({ publicError: "This link is invalid or has expired.", isPublicLoading: false });
      return null;
    }
  },

  // NEW: Fetch questions publicly (no auth header)
  publicFetchQuestions: async (category) => {
    // const reviewStore = useReviewStore.getState(); // Get review store ref
    try {
      const response = await axios.get(`${BASE_URL}/questions/public/${category}`); // Public endpoint
      // Directly update review store (add setQuestions to reviewStore if needed)
      useReviewStore.setState({
        questions: response.data.data.questions || [],
        isLoading: false,
        error: null
      });
    } catch (err) {
      console.error('Failed to fetch public questions:', err);
      useReviewStore.setState({ error: 'Could not load questions.', isLoading: false });
    }
  },

  submitPublicReview: async (token, payload) => {
    set({ isSubmitting: true, publicError: null });
    try {
      // The backend uses token route for submission
      await axios.post(`${BASE_URL}/tokens/public/${token}/submit`, payload);
      set({ isSubmitting: false });
      return true;
    } catch (err) {
      console.error("Failed to submit public review:", err);
      const errorMsg = (axios.isAxiosError(err) && err.response?.data?.message)
        ? err.response.data.message
        : "Submission failed. This link may have been used or expired.";
      set({ publicError: errorMsg, isSubmitting: false });
      return false;
    }
  },
}));