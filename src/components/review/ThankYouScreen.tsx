/**
 * ThankYouScreen Component
 * Reusable thank you / success screen for review submissions
 */
import React from 'react';
import { CheckCircle, Star } from 'lucide-react';

export interface ThankYouScreenProps {
    title?: string;
    message: string;
    onAction?: () => void;
    actionLabel?: string;
    primaryColor?: string;
    accentColor?: string;
    icon?: 'star' | 'check';
}

/**
 * ThankYouScreen - Displays success message after review submission
 */
export const ThankYouScreen: React.FC<ThankYouScreenProps> = ({
    title = 'Thank You!',
    message,
    onAction,
    actionLabel = 'Submit Another Review',
    primaryColor = '#1e3a5f',
    accentColor = '#c9a962',
    icon = 'check',
}) => {
    const IconComponent = icon === 'star' ? Star : CheckCircle;

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{ background: `linear-gradient(135deg, ${primaryColor}10, ${accentColor}20)` }}
        >
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ backgroundColor: `${accentColor}20` }}
                >
                    <IconComponent
                        className="w-10 h-10"
                        style={{ color: accentColor, fill: icon === 'star' ? accentColor : undefined }}
                    />
                </div>
                <h1
                    className="text-2xl md:text-3xl font-bold mb-4"
                    style={{ color: primaryColor }}
                >
                    {title}
                </h1>
                <p className="text-gray-600 mb-6">{message}</p>
                {onAction && (
                    <button
                        onClick={onAction}
                        className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                        style={{ backgroundColor: primaryColor }}
                    >
                        {actionLabel}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ThankYouScreen;
