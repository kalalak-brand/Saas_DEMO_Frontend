// src/components/ui/RatingInput.tsx
import React, { useMemo, useCallback } from 'react';
import clsx from 'clsx';

interface RatingInputProps {
    currentRating: number | null;
    onChange: (rating: number) => void;
    scale?: 5 | 10;
    showLabels?: boolean;
    disabled?: boolean;
    showNA?: boolean;
    className?: string;
}

/**
 * Configurable Rating Input component
 * Adapts to 1-5 or 1-10 scale based on settings or prop override
 */
export const RatingInput: React.FC<RatingInputProps> = ({
    currentRating,
    onChange,
    scale: scaleProp,
    showLabels = true,
    disabled = false,
    showNA = true,
    className,
}) => {
    // Rating scale is always 5
    const scale = scaleProp ?? 5;

    // Generate rating options based on scale
    const ratingOptions = useMemo(() => {
        return Array.from({ length: scale }, (_, i) => scale - i);
    }, [scale]);

    // Labels for the scale ends
    const labels = useMemo(() => {
        if (scale === 5) {
            return { max: 'Excellent', min: 'Poor' };
        }
        return { max: 'Outstanding', min: 'Unacceptable' };
    }, [scale]);

    const handleRatingClick = useCallback(
        (rating: number) => {
            if (!disabled) {
                onChange(rating);
            }
        },
        [disabled, onChange]
    );

    return (
        <div className={clsx('flex flex-col', className)}>
            {/* Labels row */}
            {showLabels && (
                <div className="flex justify-between mb-2 text-xs font-medium text-secondary">
                    <span>{labels.max}</span>
                    <span>{labels.min}</span>
                </div>
            )}

            {/* Rating buttons */}
            <div className="flex items-center gap-1">
                {ratingOptions.map((rating) => (
                    <button
                        key={rating}
                        type="button"
                        onClick={() => handleRatingClick(rating)}
                        disabled={disabled}
                        aria-label={`Rating ${rating}`}
                        aria-pressed={currentRating === rating}
                        className={clsx(
                            'flex items-center justify-center rounded-lg transition-all duration-200',
                            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                            scale === 5
                                ? 'w-10 h-10 text-sm font-medium'
                                : 'w-8 h-8 text-xs font-medium',
                            currentRating === rating
                                ? 'bg-primary text-white shadow-md scale-110'
                                : 'bg-surface-elevated text-text-secondary border border-border hover:border-primary hover:text-primary',
                            disabled && 'opacity-50 cursor-not-allowed hover:border-border hover:text-text-secondary'
                        )}
                    >
                        {rating}
                    </button>
                ))}

                {/* N/A option */}
                {showNA && (
                    <button
                        type="button"
                        onClick={() => handleRatingClick(0)}
                        disabled={disabled}
                        aria-label="Not Applicable"
                        aria-pressed={currentRating === 0}
                        className={clsx(
                            'flex items-center justify-center rounded-lg transition-all duration-200 ml-2',
                            'focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-1',
                            scale === 5
                                ? 'w-10 h-10 text-sm font-medium'
                                : 'w-8 h-8 text-xs font-medium',
                            currentRating === 0
                                ? 'bg-secondary text-white shadow-md scale-110'
                                : 'bg-surface-elevated text-text-muted border border-border hover:border-secondary hover:text-secondary',
                            disabled && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        N/A
                    </button>
                )}
            </div>
        </div>
    );
};

export default RatingInput;
