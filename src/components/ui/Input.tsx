// src/components/ui/Input.tsx
import React, { forwardRef, InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    error?: string;
    helperText?: string;
    size?: 'sm' | 'md' | 'lg';
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base',
};

/**
 * Premium Input component with label, error state, and icons
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            helperText,
            size = 'md',
            leftIcon,
            rightIcon,
            className,
            id,
            ...props
        },
        ref
    ) => {
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block mb-1.5 text-sm font-medium text-text-primary"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={clsx(
                            'w-full rounded-lg border bg-surface text-text-primary',
                            'placeholder:text-text-muted',
                            'transition-all duration-200',
                            'focus:outline-none focus:ring-2 focus:ring-offset-0',
                            error
                                ? 'border-error focus:border-error focus:ring-error-light'
                                : 'border-border focus:border-primary focus:ring-primary-100',
                            sizeClasses[size],
                            leftIcon && 'pl-10',
                            rightIcon && 'pr-10',
                            props.disabled && 'bg-surface-elevated cursor-not-allowed opacity-60',
                            className
                        )}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {(error || helperText) && (
                    <p
                        className={clsx(
                            'mt-1.5 text-xs',
                            error ? 'text-error' : 'text-text-muted'
                        )}
                    >
                        {error || helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
