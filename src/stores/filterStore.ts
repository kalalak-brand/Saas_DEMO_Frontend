import { create } from 'zustand';

// Category is now dynamic string to support categories from categoryStore
export type Category = string;

interface FilterState {
    category: Category;
    setCategory: (category: Category) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
    category: 'room', // Default to 'room'
    setCategory: (category) => set({ category }),
}));