// src/stores/managementStore.ts
import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// --- INTERFACES ---
export interface Question {
  _id: string;
  text: string;
  category: string; // Dynamic - any category slug
  questionType: 'rating' | 'yes_no';
  order: number;
  isActive: boolean;
}

export interface Composite {
  _id: string;
  name: string;
  questions: string[];
  category: string; // Dynamic - any category slug
  order: number;
  isActive: boolean;
}

export interface ManagementUser {
  _id: string;
  fullName: string;
  username: string;
  isActive: boolean;
  // Dynamic role - can be 'admin' | 'viewer' | 'staff' | 'staff_[category-slug]'
  role: string;
  hotelId?: string;
}

// Dynamic role type - supports all staff_[category] variants
type UserRole = string;

type CreateUserPayload = {
  fullName: string;
  username: string;
  password?: string;
  role: UserRole;
  hotelId?: string; // <-- ADD THIS
};

type UpdateUserPayload = {
  fullName: string;
  username: string;
  role: UserRole;
  hotelId?: string; // <-- ADD THIS
};

// Category is now a dynamic string type

// ✅ UPDATED Signatures
interface ManagementState {
  composites: Composite[];
  questions: Question[];
  users: ManagementUser[];
  isLoading: boolean;
  error: string | null;

  fetchComposites: (force?: boolean, hotelId?: string) => Promise<void>; // Added hotelId for super_admin
  createComposite: (data: { name: string, questions: string[], category: string, order: number, hotelId?: string }) => Promise<void>;
  updateComposite: (id: string, data: Partial<Composite>) => Promise<void>; // ✅ Use Partial
  deleteComposite: (id: string) => Promise<void>;
  toggleCompositeActive: (composite: Composite) => Promise<void>;

  fetchQuestions: (force?: boolean, hotelId?: string) => Promise<void>; // Added force and hotelId for super_admin
  createQuestion: (data: Partial<Question>) => Promise<void>; // Use Partial for flexibility
  updateQuestion: (id: string, data: Partial<Question>) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  toggleQuestionActive: (question: Question) => Promise<void>; // ✅ ADDED

  fetchUsers: (force?: boolean) => Promise<void>; // Added force
  createUser: (data: CreateUserPayload) => Promise<void>;
  updateUser: (id: string, data: UpdateUserPayload) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useManagementStore = create<ManagementState>((set, get) => ({
  composites: [],
  questions: [],
  users: [],
  isLoading: false,
  error: null,

  // --- COMPOSITE ACTIONS ---
  fetchComposites: async (force = false, hotelId?: string) => {
    // Keep cache check, but allow forcing a refresh
    if (get().composites.length > 0 && !force) return;

    set({ isLoading: true });
    try {
      const token = useAuthStore.getState().token;
      const params: Record<string, string> = {};
      if (hotelId) {
        params.hotelId = hotelId;
      }
      const res = await axios.get(`${BASE_URL}/admin/management/composites`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      set({ composites: res.data.data.composites || [], isLoading: false });
      console.log({ "composites": res.data.data.composites });
    } catch (err) {
      set({ error: 'Failed to fetch composites.', isLoading: false });
    }
  },

  createComposite: async (data) => {
    set({ isLoading: true });
    try {
      const token = useAuthStore.getState().token;
      await axios.post(`${BASE_URL}/admin/management/composites`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      get().fetchComposites(true, (data as any).hotelId); // Force refetch with hotelId for super_admin
    } catch (err) {
      set({ error: 'Failed to create composite', isLoading: false });
    }
  },
  updateComposite: async (id, data) => { // ✅ Data is now Partial<Composite>
    set({ isLoading: true });
    try {
      const token = useAuthStore.getState().token;
      await axios.put(`${BASE_URL}/admin/management/composites/${id}`, data, { // data is now partial
        headers: { Authorization: `Bearer ${token}` }
      });
      get().fetchComposites(true);
    } catch (err) {
      set({ error: 'Failed to update composite', isLoading: false });
    }
  },
  deleteComposite: async (id) => {
    try {
      const token = useAuthStore.getState().token;
      await axios.delete(`${BASE_URL}/admin/management/composites/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      get().fetchComposites(true); // ✅ Force refetch
    } catch (err) {
      set({ error: 'Failed to delete composite' });
    }
  },
  toggleCompositeActive: async (composite) => {
    // Optimistically update UI
    set(state => ({
      composites: state.composites.map(c =>
        c._id === composite._id ? { ...c, isActive: !c.isActive } : c
      ),
    }));
    // Call update with just the toggled status
    get().updateComposite(composite._id, { isActive: !composite.isActive });
  },

  // --- QUESTION ACTIONS ---
  fetchQuestions: async (force = false, hotelId?: string) => {
    if (get().questions.length > 0 && !force) return;
    set({ isLoading: true });
    try {
      const token = useAuthStore.getState().token;
      const params: Record<string, string> = {};
      if (hotelId) {
        params.hotelId = hotelId;
      }
      const res = await axios.get(`${BASE_URL}/admin/management/questions`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      set({ questions: res.data.data.questions || [], isLoading: false, error: null });
      console.log("managementStore: Fetched Questions from API:", res.data.data.questions);
    } catch (err) {
      console.error("managementStore: Failed to fetch questions", err);
      let errorMsg = 'Failed to fetch questions';
      set({ error: errorMsg, isLoading: false, questions: [] });
    }
  },
  createQuestion: async (data) => {
    set({ isLoading: true });
    try {
      const token = useAuthStore.getState().token;
      await axios.post(`${BASE_URL}/admin/management/questions`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      get().fetchQuestions(true, (data as any).hotelId); // Force refetch with hotelId for super_admin
    } catch (err) {
      set({ error: 'Failed to create question', isLoading: false });
    }
  },
  updateQuestion: async (id, data) => {
    set({ isLoading: true });
    try {
      const token = useAuthStore.getState().token;
      await axios.put(`${BASE_URL}/admin/management/questions/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      get().fetchQuestions(true); // ✅ Force refetch
    } catch (err) {
      set({ error: 'Failed to update question', isLoading: false });
    }
  },
  deleteQuestion: async (id) => {
    try {
      const token = useAuthStore.getState().token;
      await axios.delete(`${BASE_URL}/admin/management/questions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      get().fetchQuestions(true); // ✅ Force refetch
    } catch (err) {
      set({ error: 'Failed to delete question' });
    }
  },
  toggleQuestionActive: async (question) => {
    // Optimistically update UI
    set(state => ({
      questions: state.questions.map(q =>
        q._id === question._id ? { ...q, isActive: !q.isActive } : q
      ),
    }));
    // Call update with just the toggled status
    get().updateQuestion(question._id, { isActive: !question.isActive });
  },
  // --- USER ACTIONS ---
  fetchUsers: async (force = false) => {
    if (get().users.length > 0 && !force) return;
    set({ isLoading: true });
    try {
      const token = useAuthStore.getState().token;
      const res = await axios.get(`${BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ users: res.data.data.users, isLoading: false });
    } catch (err) {
      set({ error: 'Failed to fetch users', isLoading: false });
    }
  },
  createUser: async (data) => {
    set({ isLoading: true });
    try {
      const token = useAuthStore.getState().token;
      await axios.post(`${BASE_URL}/admin/users`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      get().fetchUsers(true); // ✅ Force refetch
    } catch (err) {
      set({ error: 'Failed to create user', isLoading: false });
    }
  },
  updateUser: async (id, data) => {
    set({ isLoading: true });
    try {
      const token = useAuthStore.getState().token;
      await axios.put(`${BASE_URL}/admin/users/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      get().fetchUsers(true); // ✅ Force refetch
    } catch (err) {
      set({ error: 'Failed to update user', isLoading: false });
    }
  },
  deleteUser: async (id) => {
    try {
      const token = useAuthStore.getState().token;
      await axios.delete(`${BASE_URL}/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      get().fetchUsers(true); // ✅ Force refetch
    } catch (err) {
      set({ error: 'Failed to deactivate user' });
    }
  },
}));