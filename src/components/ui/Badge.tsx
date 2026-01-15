// src/components/ui/Badge.tsx
import React from 'react';
import clsx from 'clsx';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
    variant?: BadgeVariant;
    size?: BadgeSize;
    children: React.ReactNode;
    className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-surface-elevated text-text-secondary',
    primary: 'bg-primary-100 text-primary',
    success: 'bg-success-light text-success',
    warning: 'bg-warning-light text-warning',
    error: 'bg-error-light text-error',
    info: 'bg-info-light text-info',
};

const sizeClasses: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
};

/**
 * Badge component for status indicators
 */
export const Badge: React.FC<BadgeProps> = ({
    variant = 'default',
    size = 'sm',
    children,
    className,
}) => {
    return (
        <span
            className={clsx(
                'inline-flex items-center font-medium rounded-full',
                variantClasses[variant],
                sizeClasses[size],
                className
            )}
        >
            {children}
        </span>
    );
};

export default Badge;
