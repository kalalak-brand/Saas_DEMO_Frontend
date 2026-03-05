// src/pages/review/ReviewRouter.tsx
/**
 * ReviewRouter - Conditionally renders the selected review design.
 * For public guest review pages, fetches settings via the PUBLIC API
 * (no auth required) to determine which design to render.
 *
 * Time: O(1), Space: O(1)
 */
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPublicSettings, ReviewDesign } from '../../stores/settingsStore';
import { Loader2 } from 'lucide-react';
import { useReviewStore } from '../../stores/reviewStore';

// Lazy load review page designs — chunked for faster initial load
const ClassicReviewPage = lazy(() => import('./ReviewPage'));
const StarRatingReviewPage = lazy(() => import('./StarRatingReviewPage'));

// Loading fallback — lightweight spinner
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
 * Fetches public settings (no auth) to determine which design to render.
 * Prefetches questions in parallel with settings for faster loading.
 */
const ReviewRouter: React.FC = () => {
    const { hotelCode, orgSlug, category } = useParams<{
        hotelCode: string;
        orgSlug?: string;
        category: string;
    }>();

    const [design, setDesign] = useState<ReviewDesign | null>(null);
    const [settled, setSettled] = useState(false);
    const { fetchQuestions } = useReviewStore();

    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            // Fetch public settings AND prefetch questions in parallel
            // Time: O(1) — two concurrent HTTP requests
            const hotelInfo = useReviewStore.getState().hotelInfo;
            const hotelId = hotelInfo?._id;

            const [settings] = await Promise.all([
                // Settings fetch (public, no auth)
                hotelId
                    ? fetchPublicSettings(hotelId)
                    : Promise.resolve(null),
                // Prefetch questions in parallel
                category && hotelCode
                    ? fetchQuestions(category, hotelCode, orgSlug)
                    : Promise.resolve(),
            ]);

            if (!cancelled) {
                setDesign(settings?.reviewDesign || 'star-rating');
                setSettled(true);
            }
        };

        // Fast path: if we don't have hotelId yet, just default to star-rating
        // The questions fetch will populate hotelInfo
        setDesign('star-rating');
        setSettled(true);

        // Background: try to load actual settings
        init().catch(() => {
            if (!cancelled) {
                setDesign('star-rating');
                setSettled(true);
            }
        });

        return () => { cancelled = true; };
    }, [hotelCode, orgSlug, category, fetchQuestions]);

    if (!settled) {
        return <ReviewLoadingFallback />;
    }

    return (
        <Suspense fallback={<ReviewLoadingFallback />}>
            {design === 'classic' && <ClassicReviewPage />}
            {(design === 'star-rating' || design === 'modern' || !design) && <StarRatingReviewPage />}
        </Suspense>
    );
};

export default ReviewRouter;
