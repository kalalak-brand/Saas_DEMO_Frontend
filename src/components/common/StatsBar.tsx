// src/components/common/StatsBar.tsx
import { useState, useEffect } from 'react';
import StatCard from './StatCard';
import { useStatsStore } from '../../stores/statsStore';
import { useFilterStore, Category } from '../../stores/filterStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useNavigate } from 'react-router-dom';
import CategorySelectionModal from './CategorySelectionModal';
import { BarChart3, Settings2 } from 'lucide-react';

const StatsBar = () => {
  const { stats, isLoading, fetchStats } = useStatsStore();
  const { category } = useFilterStore();
  const { theme } = useSettingsStore();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      console.log("DEBOUNCED Stats Fetch: Fetching stats for category:", category);
      // Fetch stats for any category - updated to handle dynamic categories
      if (category) {
        fetchStats(category as 'room' | 'f&b');
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [fetchStats, category]);

  const handleModalSubmit = (selectedCategory: Category) => {
    navigate(`/compare/${selectedCategory}`);
    setIsModalOpen(false);
  };

  const statData = [
    { title: "Total Reviews", value: isLoading ? "..." : stats.totalReviews },
    { title: "Total Staff", value: isLoading ? "..." : stats.totalStaff },
    { title: "Active Staff", value: isLoading ? "..." : stats.activeStaff },
  ];

  return (
    <>
      <div className="py-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-5 mx-4">
          {/* Stats Cards */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 flex-1">
            {statData.map((card) => (
              <StatCard key={card.title} title={card.title} value={card.value} />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:justify-end gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 text-white font-semibold px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all w-full lg:w-auto"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <BarChart3 size={20} />
              Compare Analytics
            </button>
            <button
              onClick={() => navigate("/management/composites")}
              className="flex items-center justify-center gap-2 text-white font-semibold px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all w-full lg:w-auto"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <Settings2 size={20} />
              Configure Questions
            </button>
          </div>
        </div>
      </div>
      <CategorySelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </>
  );
};

export default StatsBar;