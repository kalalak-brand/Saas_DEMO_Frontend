// src/components/ui/Card.tsx
import React, { HTMLAttributes } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantClasses = {
    default: 'bg-surface shadow-sm border border-border-light',
    elevated: 'bg-surface shadow-md',
    outlined: 'bg-surface border border-border',
};

const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8',
};

/**
 * Card component for content containers
 */
export const Card: React.FC<CardProps> = ({
    variant = 'default',
    padding = 'md',
    className,
    children,
    ...props
}) => {
    return (
        <div
            className={clsx(
                'rounded-xl',
                variantClasses[variant],
                paddingClasses[padding],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
