/**
 * ReviewLoadingSpinner Component
 * Consistent loading state for review pages
 */
import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ReviewLoadingSpinnerProps {
    message?: string;
    primaryColor?: string;
    accentColor?: string;
}

/**
 * ReviewLoadingSpinner - Displays a centered loading spinner with optional message
 */
export const ReviewLoadingSpinner: React.FC<ReviewLoadingSpinnerProps> = ({
    message = 'Loading...',
    primaryColor = '#1e3a5f',
    accentColor = '#c9a962',
}) => {
    return (
        <div
            className="min-h-screen flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${primaryColor}10, ${accentColor}10)` }}
        >
            <div className="text-center">
                <Loader2
                    className="w-12 h-12 animate-spin mx-auto"
                    style={{ color: primaryColor }}
                />
                <p className="mt-4 text-gray-600">{message}</p>
            </div>
        </div>
    );
};

export default ReviewLoadingSpinner;
