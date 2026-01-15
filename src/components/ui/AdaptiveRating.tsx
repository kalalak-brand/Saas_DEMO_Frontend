/**
 * AdaptiveRating Component
 * Renders star rating for scale 1-5 or button grid for scale 1-10
 */
import React, { useState } from 'react';
import { Star } from 'lucide-react';
import clsx from 'clsx';

export interface AdaptiveRatingProps {
    value: number | null;
    onChange: (value: number) => void;
    max: 5 | 10;
    accentColor?: string;
    disabled?: boolean;
}

export const AdaptiveRating: React.FC<AdaptiveRatingProps> = ({
    value,
    onChange,
    max,
    accentColor = "#c9a962",
    disabled = false
}) => {
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    // For 1-5: Use star rating with flex-wrap for mobile
    if (max === 5) {
        return (
            <div className="flex flex-wrap gap-2 justify-center">
                {Array.from({ length: max }, (_, i) => {
                    const starValue = i + 1;
                    const isFilled = (hoverValue ?? value ?? 0) >= starValue;
                    return (
                        <button
                            key={starValue}
                            type="button"
                            onClick={() => !disabled && onChange(starValue)}
                            onMouseEnter={() => !disabled && setHoverValue(starValue)}
                            onMouseLeave={() => setHoverValue(null)}
                            className={clsx(
                                "transition-transform hover:scale-110",
                                disabled && "cursor-not-allowed opacity-50"
                            )}
                            style={{ color: isFilled ? accentColor : '#d1d5db' }}
                            disabled={disabled}
                        >
                            <Star className={clsx("w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10", isFilled && "fill-current")} />
                        </button>
                    );
                })}
            </div>
        );
    }

    // For 1-10: Use button grid (5 columns on mobile, 10 on tablet+)
    return (
        <div className="grid grid-cols-5 md:grid-cols-10 gap-1 sm:gap-2">
            {Array.from({ length: max }, (_, i) => {
                const ratingValue = i + 1;
                const isSelected = value === ratingValue;
                return (
                    <button
                        key={ratingValue}
                        type="button"
                        onClick={() => !disabled && onChange(ratingValue)}
                        className={clsx(
                            "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg font-semibold text-sm sm:text-base transition-all",
                            isSelected
                                ? "text-white shadow-lg scale-105"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                            disabled && "cursor-not-allowed opacity-50"
                        )}
                        style={isSelected ? { backgroundColor: accentColor } : {}}
                        disabled={disabled}
                    >
                        {ratingValue}
                    </button>
                );
            })}
        </div>
    );
};

export default AdaptiveRating;
