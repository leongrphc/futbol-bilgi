'use client';

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

// ==========================================
// Button Variants
// ==========================================

const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2',
    'rounded-xl font-semibold',
    'transition-all duration-200 ease-out',
    'active:scale-[0.97]',
    'disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:outline-2 focus-visible:outline-offset-2',
    'cursor-pointer',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-primary-500 text-white',
          'hover:bg-primary-600',
          'focus-visible:outline-primary-500',
          'shadow-lg shadow-primary-500/20',
          'hover:shadow-xl hover:shadow-primary-500/30',
        ].join(' '),
        secondary: [
          'bg-secondary-500 text-bg-primary',
          'hover:bg-secondary-400',
          'focus-visible:outline-secondary-500',
          'shadow-lg shadow-secondary-500/20',
          'hover:shadow-xl hover:shadow-secondary-500/30',
        ].join(' '),
        danger: [
          'bg-danger text-white',
          'hover:bg-red-600',
          'focus-visible:outline-danger',
          'shadow-lg shadow-danger/20',
        ].join(' '),
        ghost: [
          'bg-transparent text-text-secondary',
          'hover:bg-bg-elevated hover:text-text-primary',
          'focus-visible:outline-text-secondary',
        ].join(' '),
        outline: [
          'bg-transparent text-text-primary',
          'border border-text-muted',
          'hover:border-primary-500 hover:text-primary-500',
          'focus-visible:outline-primary-500',
        ].join(' '),
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-14 px-8 text-lg',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

// ==========================================
// Button Props
// ==========================================

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

// ==========================================
// Button Component
// ==========================================

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Yukleniyor...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
