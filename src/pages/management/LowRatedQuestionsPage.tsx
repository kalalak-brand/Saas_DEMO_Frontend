import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLowRatedReportStore } from '../../stores/lowRatedReportStore';
import { useActiveCategories } from '../../stores/categoryStore';
import { ApiQuestion } from '../../stores/reviewStore';
import { ChevronRight, BarChart2 } from 'lucide-react';

const LowRatedQuestionsPage: React.FC = () => {
  const navigate = useNavigate();
  const activeCategories = useActiveCategories();
  const [activeTab, setActiveTab] = useState<string>('');
  const { questions, isLoadingQuestions, error, fetchRatingQuestions } = useLowRatedReportStore();

  // Set default tab when categories load
  useEffect(() => {
    if (activeCategories.length > 0 && !activeTab) {
      setActiveTab(activeCategories[0].slug);
    }
  }, [activeCategories, activeTab]);

  useEffect(() => {
    // Fetch questions on component mount
    fetchRatingQuestions();
  }, [fetchRatingQuestions]);

  const getQuestionsByCategory = (categorySlug: string) => {
    return questions.filter(q => q.category === categorySlug);
  };

  const renderTabContent = (categorySlug: string) => {
    if (isLoadingQuestions) {
      return <div className="text-center p-10 animate-pulse">Loading questions...</div>;
    }
    if (error) {
      return <div className="text-center p-10 text-red-500">{error}</div>;
    }

    if (!categorySlug) {
      return <div className="text-center p-10 text-gray-500">No categories available.</div>;
    }

    const categoryQuestions = getQuestionsByCategory(categorySlug);

    if (categoryQuestions.length === 0) {
      return <div className="text-center p-10 text-gray-500">No rating questions found for this category.</div>;
    }

    return (
      <div className="space-y-2">
        {categoryQuestions.map((q: ApiQuestion) => (
          <button
            key={q._id}
            onClick={() => navigate(`/management/report/question-detail/${q._id}`)}
            className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:shadow-md transition-all"
          >
            <span className="text-left text-gray-800 font-medium">{q.text}</span>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="flex items-center gap-2 mb-6">
        <BarChart2 className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold text-gray-800">Low-Rated Questions Report</h1>
      </div>

      <p className="text-lg text-gray-600 mb-6">
        Select a question to see all guest reviews where the rating was 2 or below.
      </p>

      <div className="bg-white rounded-lg shadow-md">
        {/* Dynamic Category Tab Headers */}
        <div className="flex border-b border-gray-300 px-4 overflow-x-auto">
          {activeCategories.length === 0 ? (
            <p className="py-2 text-gray-500">No categories available</p>
          ) : (
            activeCategories.map((category) => (
              <button
                key={category.slug}
                onClick={() => setActiveTab(category.slug)}
                className={`py-2 px-6 text-base font-medium whitespace-nowrap ${activeTab === category.slug
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {category.name}
              </button>
            ))
          )}
        </div>

        {/* Tab Panel */}
        <div className="p-4 md:p-6">
          {renderTabContent(activeTab)}
        </div>
      </div>
    </div>
  );
};

export default LowRatedQuestionsPage;
