'use client';

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

// ==========================================
// Input Variants
// ==========================================

const inputVariants = cva(
  [
    'w-full rounded-xl',
    'bg-bg-elevated text-text-primary',
    'border border-white/[0.08]',
    'px-4 py-3',
    'text-base',
    'transition-all duration-200',
    'placeholder:text-text-muted',
    'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
  {
    variants: {
      hasError: {
        true: 'border-danger focus:ring-danger/50 focus:border-danger',
      },
      hasIcon: {
        true: 'pl-11',
      },
    },
    defaultVariants: {
      hasError: false,
      hasIcon: false,
    },
  }
);

// ==========================================
// Input Props
// ==========================================

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

// ==========================================
// Input Component
// ==========================================

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, hasError, hasIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const showError = hasError || !!error;
    const showIcon = hasIcon || !!icon;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              inputVariants({ hasError: showError, hasIcon: showIcon, className })
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
