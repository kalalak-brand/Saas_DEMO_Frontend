import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, MessageSquareHeart, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const AnalyticsHubPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark">Analytics</h1>
        <p className="text-sm text-secondary mt-1">
          {user?.hotelId && typeof user.hotelId === 'object'
            ? `Viewing ${user.hotelId.name}`
            : 'Select a hotel to view analytics.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/management/service-analytics')}
          className="group bg-surface border border-border rounded-2xl p-5 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-primary-dark">Service Analysis</p>
                <p className="text-sm text-secondary mt-1">
                  Response time, completion rate, department performance.
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-secondary group-hover:text-primary transition-colors mt-1" />
          </div>
        </button>

        <button
          onClick={() => navigate('/management/responses')}
          className="group bg-surface border border-border rounded-2xl p-5 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <MessageSquareHeart className="w-5 h-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-primary-dark">Feedback Analysis</p>
                <p className="text-sm text-secondary mt-1">
                  Review responses, low ratings, and improvement areas.
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-secondary group-hover:text-primary transition-colors mt-1" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default AnalyticsHubPage;

