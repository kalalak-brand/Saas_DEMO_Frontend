// src/pages/review/SelectCategoryPage.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Hotel,
  Utensils,
  Coffee,
  Waves,
  Sparkles,
  Dumbbell,
  Users,
  Car,
  Briefcase,
  LogOut,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useActiveCategories, useCategoryStore } from '../../stores/categoryStore';
import { PlaceholderLogo } from '../../components/common/PlaceholderLogo';
import clsx from 'clsx';

/**
 * Icon mapping for category icons
 */
const iconMap: Record<string, LucideIcon> = {
  bed: Hotel,
  utensils: Utensils,
  coffee: Coffee,
  spa: Sparkles,
  pool: Waves,
  restaurant: Utensils,
  bar: Coffee,
  gym: Dumbbell,
  concierge: Users,
  parking: Car,
  default: Briefcase,
};

/**
 * Get icon component for a category
 */
const getCategoryIcon = (iconName?: string): LucideIcon => {
  if (!iconName) return iconMap.default;
  return iconMap[iconName] || iconMap.default;
};

/**
 * Select Category Page
 * Dynamically renders category buttons from the categoryStore
 */
const SelectCategoryPage: React.FC = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const activeCategories = useActiveCategories();
  const { fetchCategories, isLoading } = useCategoryStore();

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCategorySelect = (categorySlug: string) => {
    navigate(`/review/${categorySlug}`);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4">
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className={clsx(
          'absolute top-4 right-4 flex items-center gap-2',
          'bg-error text-white px-4 py-2 rounded-lg shadow-md',
          'hover:opacity-90 transition-opacity'
        )}
        title="Logout"
      >
        <LogOut size={20} />
        <span>Logout</span>
      </button>

      <div className="w-full max-w-4xl bg-surface rounded-2xl shadow-xl p-8 space-y-8 text-center">
        {/* Logo */}
        <PlaceholderLogo size="lg" />

        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-primary">Select Review Type</h2>
          <p className="text-lg text-text-secondary mt-2">
            Please select the area you would like to provide feedback for.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        )}

        {/* Category Grid */}
        {!isLoading && activeCategories.length > 0 && (
          <div
            className={clsx(
              'grid gap-6',
              activeCategories.length === 1 && 'grid-cols-1 max-w-xs mx-auto',
              activeCategories.length === 2 && 'grid-cols-1 md:grid-cols-2',
              activeCategories.length >= 3 && 'grid-cols-1 md:grid-cols-3'
            )}
          >
            {activeCategories.map((category) => {
              const IconComponent = getCategoryIcon(category.icon);
              return (
                <button
                  key={category._id}
                  onClick={() => handleCategorySelect(category.slug)}
                  className={clsx(
                    'flex flex-col items-center justify-center gap-4 p-8',
                    'bg-primary text-white rounded-xl shadow-lg',
                    'hover:shadow-xl hover:scale-[1.02] transition-all duration-200',
                    'focus:outline-none focus:ring-4 focus:ring-primary-200'
                  )}
                >
                  <IconComponent size={48} />
                  <span className="text-xl font-semibold">{category.name}</span>
                  {category.description && (
                    <span className="text-sm text-white/70">{category.description}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && activeCategories.length === 0 && (
          <div className="py-12 text-text-muted">
            <p>No active categories available.</p>
            <p className="text-sm mt-2">Please contact your administrator.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectCategoryPage;