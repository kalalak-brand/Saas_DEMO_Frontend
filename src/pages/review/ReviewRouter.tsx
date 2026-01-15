// src/pages/review/ReviewRouter.tsx
/**
 * ReviewRouter - Conditionally renders the selected review design
 * Based on reviewDesign setting from settingsStore
 */
import React, { lazy, Suspense } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { Loader2 } from 'lucide-react';

// Lazy load review page designs
const ClassicReviewPage = lazy(() => import('./ReviewPage'));
const StarRatingReviewPage = lazy(() => import('./StarRatingReviewPage'));

// Loading fallback
const ReviewLoadingFallback: React.FC = () => (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
        <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <p className="mt-4 text-gray-600">Loading review form...</p>
        </div>
    </div>
);

/**
 * ReviewRouter Component
 * Renders the appropriate review page based on admin settings
 */
const ReviewRouter: React.FC = () => {
    const reviewDesign = useSettingsStore((state) => state.reviewDesign);

    return (
        <Suspense fallback={<ReviewLoadingFallback />}>
            {reviewDesign === 'star-rating' && <StarRatingReviewPage />}
            {reviewDesign === 'modern' && <StarRatingReviewPage />} {/* TODO: Create ModernReviewPage */}
            {reviewDesign === 'classic' && <ClassicReviewPage />}
            {/* Default to classic if reviewDesign is not set */}
            {!reviewDesign && <ClassicReviewPage />}
        </Suspense>
    );
};

export default ReviewRouter;
