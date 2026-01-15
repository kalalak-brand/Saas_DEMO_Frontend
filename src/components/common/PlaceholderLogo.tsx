// src/components/common/PlaceholderLogo.tsx
import React from 'react';
import { useSettingsStore } from '../../stores/settingsStore';

interface PlaceholderLogoProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    showText?: boolean;
}

const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
    xl: 'w-40 h-40',
};

const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
};

/**
 * Placeholder logo component
 * Shows custom logo if set in settings, otherwise shows a premium placeholder
 */
export const PlaceholderLogo: React.FC<PlaceholderLogoProps> = ({
    size = 'md',
    className = '',
    showText = true,
}) => {
    const logoUrl = useSettingsStore((state) => state.theme.logoUrl);
    const primaryColor = useSettingsStore((state) => state.theme.primaryColor);
    const accentColor = useSettingsStore((state) => state.theme.accentColor);

    // If custom logo is set, render it
    if (logoUrl) {
        return (
            <div className={`flex flex-col items-center ${className}`}>
                <img
                    src={logoUrl}
                    alt="Hotel Logo"
                    className={`${sizeClasses[size]} object-contain`}
                />
            </div>
        );
    }

    // Render premium placeholder logo
    return (
        <div className={`flex flex-col items-center ${className}`}>
            <svg
                className={sizeClasses[size]}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Outer circle */}
                <circle
                    cx="50"
                    cy="50"
                    r="48"
                    stroke={primaryColor}
                    strokeWidth="2"
                    fill="none"
                />

                {/* Inner decorative circle */}
                <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={accentColor}
                    strokeWidth="1"
                    fill="none"
                    strokeDasharray="4 2"
                />

                {/* Hotel building icon */}
                <path
                    d="M30 70V40L50 25L70 40V70H60V55H40V70H30Z"
                    fill={primaryColor}
                />

                {/* Windows */}
                <rect x="36" y="45" width="8" height="6" rx="1" fill={accentColor} />
                <rect x="56" y="45" width="8" height="6" rx="1" fill={accentColor} />
                <rect x="46" y="45" width="8" height="6" rx="1" fill={accentColor} />

                {/* Door */}
                <rect x="45" y="58" width="10" height="12" rx="1" fill={accentColor} />

                {/* Star decoration */}
                <path
                    d="M50 15L51.5 20H56.5L52.5 23L54 28L50 25L46 28L47.5 23L43.5 20H48.5L50 15Z"
                    fill={accentColor}
                />
            </svg>

            {showText && (
                <span
                    className={`mt-2 font-heading font-semibold ${textSizeClasses[size]}`}
                    style={{ color: primaryColor }}
                >
                    Your Hotel
                </span>
            )}
        </div>
    );
};

export default PlaceholderLogo;
