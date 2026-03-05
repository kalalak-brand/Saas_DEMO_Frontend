/**
 * Low-Rated Questions Report Page
 * Shows all low-rating alert notifications bundled/grouped by guest review.
 * Each card displays the category, avg rating, guest info, timestamp,
 * and an expandable section showing individual low-rated questions.
 *
 * Data source: /api/notifications (type: 'low_rating')
 * Time: O(n) where n = notifications, Space: O(n)
 */
import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, User, Phone, DoorOpen, Clock, Loader2, RefreshCw } from 'lucide-react';
import { apiClient } from '../../utils/apiClient';
import { useActiveCategories } from '../../stores/categoryStore';

/** Individual low-rated question inside a notification */
interface LowRatedQuestion {
  questionId: string;
  questionText: string;
  rating: number;
}

/** Notification item from the API */
interface LowRatingNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  metadata: {
    reviewId?: string;
    categoryName?: string;
    categorySlug?: string;
    avgRating?: number;
    guestName?: string;
    guestPhone?: string;
    guestRoomNumber?: string;
    lowRatedQuestions?: LowRatedQuestion[];
  };
  isRead: boolean;
  createdAt: string;
}

/**
 * Rating badge component — color-coded circle
 * Time: O(1), Space: O(1)
 */
const RatingBadge: React.FC<{ rating: number }> = ({ rating }) => {
  const bg =
    rating <= 1.5 ? 'bg-red-500' :
      rating <= 2.5 ? 'bg-orange-500' :
        'bg-yellow-500';

  return (
    <span className={`${bg} text-white text-sm font-bold w-10 h-10 rounded-full flex items-center justify-center shrink-0`}>
      {rating.toFixed(1)}
    </span>
  );
};

/**
 * Time-ago helper
 * Time: O(1), Space: O(1)
 */
const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

/**
 * Single review alert card — expandable
 */
const ReviewCard: React.FC<{ notification: LowRatingNotification }> = ({ notification }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = notification.metadata;
  const lowRated = meta.lowRatedQuestions ?? [];

  return (
    <div className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all ${notification.isRead ? 'border-gray-200' : 'border-red-300 bg-red-50/30'
      }`}>
      {/* Header row */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <RatingBadge rating={meta.avgRating ?? 0} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{meta.categoryName || 'Review'}</span>
            {lowRated.length > 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                {lowRated.length} question{lowRated.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Guest info pills */}
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 flex-wrap">
            {meta.guestName && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> {meta.guestName}
              </span>
            )}
            {meta.guestRoomNumber && (
              <span className="flex items-center gap-1">
                <DoorOpen className="w-3.5 h-3.5" /> Room {meta.guestRoomNumber}
              </span>
            )}
            {meta.guestPhone && (
              <span className="flex items-center gap-1 text-blue-600">
                <Phone className="w-3.5 h-3.5" /> {meta.guestPhone}
              </span>
            )}
          </div>
        </div>

        {/* Timestamp + expand toggle */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {timeAgo(notification.createdAt)}
          </span>
          {lowRated.length > 0 && (
            expanded
              ? <ChevronUp className="w-4 h-4 text-gray-400" />
              : <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expandable questions list */}
      {expanded && lowRated.length > 0 && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-2">
          {lowRated.map((q, idx) => (
            <div
              key={q.questionId || idx}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
            >
              <span className="text-sm text-gray-700">{q.questionText}</span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded ${q.rating <= 1 ? 'bg-red-100 text-red-700' :
                  q.rating <= 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                }`}>
                {q.rating}/5
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Main page component
 */
const LowRatedQuestionsPage: React.FC = () => {
  const activeCategories = useActiveCategories();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [notifications, setNotifications] = useState<LowRatingNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all notifications (low_rating type)
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/notifications', {
        params: { limit: 100 },
      });
      const all: LowRatingNotification[] = res.data?.data?.notifications ?? [];
      // Filter only low_rating type
      setNotifications(all.filter((n) => n.type === 'low_rating'));
    } catch {
      setError('Failed to load low-rated reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Filter by category tab
  // Time: O(n), Space: O(n)
  const filtered = useMemo(() => {
    if (activeTab === 'all') return notifications;
    return notifications.filter(
      (n) => n.metadata.categorySlug === activeTab
    );
  }, [notifications, activeTab]);

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Low-Rated Reviews</h1>
        </div>
        <button
          onClick={fetchNotifications}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <p className="text-gray-600 mb-6">
        Guest reviews where one or more questions received a rating of 3 or below.
      </p>

      {/* Category tabs */}
      <div className="bg-white rounded-t-xl shadow-sm">
        <div className="flex border-b border-gray-200 px-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-3 px-5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'all'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            All ({notifications.length})
          </button>
          {activeCategories.map((cat) => {
            const count = notifications.filter(
              (n) => n.metadata.categorySlug === cat.slug
            ).length;
            return (
              <button
                key={cat._id}
                onClick={() => setActiveTab(cat.slug)}
                className={`py-3 px-5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === cat.slug
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-b-xl shadow-sm p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mr-3" />
            Loading reviews...
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No low-rated reviews found</p>
            <p className="text-sm mt-1">Reviews with ratings ≤ 3 will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((n) => (
              <ReviewCard key={n._id} notification={n} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LowRatedQuestionsPage;
