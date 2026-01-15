// src/stores/categoryStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useMemo } from 'react';
import apiClient from '../utils/apiClient';

/**
 * Guest info fields configuration for a category
 */
export interface GuestInfoFields {
    name: boolean;
    phone: boolean;
    roomNumber: boolean;
    email: boolean;
}

/**
 * Category interface representing a review category
 */
export interface Category {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    isActive: boolean;
    order: number;
    hotelId?: string;
    guestInfoFields?: GuestInfoFields;
    staffRolePrefix?: string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Category creation/update payload
 */
export interface CategoryPayload {
    name: string;
    slug?: string;
    description?: string;
    icon?: string;
    isActive?: boolean;
    order?: number;
    guestInfoFields?: Partial<GuestInfoFields>;
    staffRolePrefix?: string;
    hotelId?: string; // Required for super_admin
}

/**
 * Category store state
 */
interface CategoryState {
    categories: Category[];
    isLoading: boolean;
    error: string | null;
    lastFetched: number | null;
    selectedHotelId: string | null; // For super_admin hotel selection

    // Actions
    fetchCategories: (force?: boolean, hotelId?: string) => Promise<void>;
    createCategory: (data: CategoryPayload) => Promise<boolean>;
    updateCategory: (id: string, data: Partial<CategoryPayload>) => Promise<boolean>;
    deleteCategory: (id: string, hotelId?: string) => Promise<boolean>;
    toggleCategoryActive: (id: string, hotelId?: string) => Promise<void>;
    reorderCategories: (orderedIds: string[], hotelId?: string) => Promise<void>;
    setSelectedHotelId: (hotelId: string | null) => void;

    // Selectors
    getActiveCategories: () => Category[];
    getCategoryBySlug: (slug: string) => Category | undefined;
    getCategoryById: (id: string) => Category | undefined;
}

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Category Store with API integration and caching
 */
export const useCategoryStore = create<CategoryState>()(
    persist(
        (set, get) => ({
            categories: [],
            isLoading: false,
            error: null,
            lastFetched: null,
            selectedHotelId: null,

            /**
             * Set selected hotel ID for super_admin
             */
            setSelectedHotelId: (hotelId: string | null) => {
                set({ selectedHotelId: hotelId, categories: [], lastFetched: null });
            },

            /**
             * Fetch categories from backend with caching
             */
            fetchCategories: async (force = false, hotelId?: string) => {
                const { lastFetched, isLoading, selectedHotelId } = get();

                // Skip if already loading
                if (isLoading) return;

                // Use cache if not forcing and cache is fresh
                if (!force && lastFetched && Date.now() - lastFetched < CACHE_DURATION) {
                    return;
                }

                set({ isLoading: true, error: null });

                try {
                    // Use provided hotelId or selectedHotelId for super_admin
                    const queryHotelId = hotelId || selectedHotelId;
                    const params = queryHotelId ? { hotelId: queryHotelId } : {};

                    const response = await apiClient.get('/categories', { params });
                    const categories = response.data.data?.categories || response.data.data || [];
                    set({ categories, isLoading: false, lastFetched: Date.now() });
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : 'Failed to fetch categories';
                    set({ error: message, isLoading: false });
                    console.error('Failed to fetch categories:', error);
                }
            },

            /**
             * Create a new category
             */
            createCategory: async (data: CategoryPayload) => {
                set({ isLoading: true, error: null });
                const { selectedHotelId } = get();

                try {
                    // Include hotelId from data or selectedHotelId for super_admin
                    const payload = {
                        ...data,
                        hotelId: data.hotelId || selectedHotelId,
                    };
                    const response = await apiClient.post('/categories', payload);
                    const newCategory = response.data.data?.category || response.data.data;
                    set((state) => ({
                        categories: [...state.categories, newCategory],
                        isLoading: false,
                        lastFetched: Date.now(),
                    }));
                    return true;
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : 'Failed to create category';
                    set({ error: message, isLoading: false });
                    return false;
                }
            },

            /**
             * Update an existing category
             */
            updateCategory: async (id: string, data: Partial<CategoryPayload>) => {
                set({ isLoading: true, error: null });
                const { selectedHotelId } = get();

                try {
                    // Include hotelId from data or selectedHotelId for super_admin
                    const payload = {
                        ...data,
                        hotelId: data.hotelId || selectedHotelId,
                    };
                    const response = await apiClient.put(`/categories/${id}`, payload);
                    const updatedCategory = response.data.data?.category || response.data.data;
                    set((state) => ({
                        categories: state.categories.map((c) =>
                            c._id === id ? updatedCategory : c
                        ),
                        isLoading: false,
                        lastFetched: Date.now(),
                    }));
                    return true;
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : 'Failed to update category';
                    set({ error: message, isLoading: false });
                    return false;
                }
            },

            /**
             * Delete a category
             */
            deleteCategory: async (id: string, hotelId?: string) => {
                set({ isLoading: true, error: null });
                const { selectedHotelId } = get();

                try {
                    const queryHotelId = hotelId || selectedHotelId;
                    const params = queryHotelId ? { hotelId: queryHotelId } : {};
                    await apiClient.delete(`/categories/${id}`, { params });
                    set((state) => ({
                        categories: state.categories.filter((c) => c._id !== id),
                        isLoading: false,
                        lastFetched: Date.now(),
                    }));
                    return true;
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : 'Failed to delete category';
                    set({ error: message, isLoading: false });
                    return false;
                }
            },

            /**
             * Toggle category active status with optimistic update
             */
            toggleCategoryActive: async (id: string, hotelId?: string) => {
                const { categories, selectedHotelId } = get();
                const category = categories.find((c) => c._id === id);
                if (!category) return;

                // Optimistic update
                set({
                    categories: categories.map((c) =>
                        c._id === id ? { ...c, isActive: !c.isActive } : c
                    ),
                });

                try {
                    const bodyHotelId = hotelId || selectedHotelId;
                    await apiClient.patch(`/categories/${id}/toggle`, { hotelId: bodyHotelId });
                } catch (error) {
                    // Revert on failure
                    set({
                        categories: categories.map((c) =>
                            c._id === id ? { ...c, isActive: category.isActive } : c
                        ),
                    });
                    console.error('Failed to toggle category:', error);
                }
            },

            /**
             * Reorder categories with optimistic update
             */
            reorderCategories: async (orderedIds: string[], hotelId?: string) => {
                const { categories, selectedHotelId } = get();

                // Optimistic update
                const reordered = orderedIds
                    .map((id, index) => {
                        const cat = categories.find((c) => c._id === id);
                        return cat ? { ...cat, order: index + 1 } : null;
                    })
                    .filter(Boolean) as Category[];

                set({ categories: reordered });

                try {
                    const bodyHotelId = hotelId || selectedHotelId;
                    await apiClient.post('/categories/reorder', { orderedIds, hotelId: bodyHotelId });
                } catch (error) {
                    // Revert on failure
                    set({ categories });
                    console.error('Failed to reorder categories:', error);
                }
            },

            /**
             * Get only active categories
             */
            getActiveCategories: () => {
                return get()
                    .categories.filter((c) => c.isActive)
                    .sort((a, b) => a.order - b.order);
            },

            /**
             * Get category by slug
             */
            getCategoryBySlug: (slug: string) => {
                return get().categories.find((c) => c.slug === slug);
            },

            /**
             * Get category by ID
             */
            getCategoryById: (id: string) => {
                return get().categories.find((c) => c._id === id);
            },
        }),
        {
            name: 'review-system-categories',
            partialize: (state) => ({
                categories: state.categories,
                lastFetched: state.lastFetched,
            }),
        }
    )
);

/**
 * Hook to get categories sorted by order
 */
export const useSortedCategories = () => {
    return useCategoryStore((state) =>
        [...state.categories].sort((a, b) => a.order - b.order)
    );
};

/**
 * Hook to get active categories only
 */
export const useActiveCategories = () => {
    const categories = useCategoryStore((state) => state.categories);

    return useMemo(
        () =>
            categories
                .filter((c) => c.isActive)
                .sort((a, b) => a.order - b.order),
        [categories]
    );
};

/**
 * Fetch public categories for guest review forms (no auth required)
 */
export const fetchPublicCategories = async (hotelId: string): Promise<Category[]> => {
    try {
        const response = await apiClient.get('/categories/public', { params: { hotelId } });
        return response.data.data?.categories || [];
    } catch (error) {
        console.error('Failed to fetch public categories:', error);
        return [];
    }
};

export default useCategoryStore;
