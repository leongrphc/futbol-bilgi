'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

// ==========================================
// ProgressBar Props
// ==========================================

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Progress value between 0 and 1 */
  value: number;
  /** Visual variant */
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'gold' | 'info';
  /** Size of the bar */
  size?: 'sm' | 'md' | 'lg';
  /** Show percentage label */
  showLabel?: boolean;
  /** Animate the bar on mount */
  animated?: boolean;
  /** Custom label text (overrides percentage) */
  label?: string;
}

// ==========================================
// Variant Color Map
// ==========================================

const variantColors: Record<string, string> = {
  default: 'bg-primary-500',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  gold: 'bg-secondary-500',
  info: 'bg-info',
};

const variantGlows: Record<string, string> = {
  default: 'shadow-primary-500/40',
  success: 'shadow-success/40',
  warning: 'shadow-warning/40',
  danger: 'shadow-danger/40',
  gold: 'shadow-secondary-500/40',
  info: 'shadow-info/40',
};

const sizeClasses: Record<string, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

// ==========================================
// ProgressBar Component
// ==========================================

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      value,
      variant = 'default',
      size = 'md',
      showLabel = false,
      animated = true,
      label,
      ...props
    },
    ref
  ) => {
    const clampedValue = Math.max(0, Math.min(1, value));
    const percentage = Math.round(clampedValue * 100);

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {/* Label */}
        {showLabel && (
          <div className="mb-1 flex items-center justify-between text-xs text-text-secondary">
            <span>{label ?? ''}</span>
            <span>{percentage}%</span>
          </div>
        )}

        {/* Track */}
        <div
          className={cn(
            'w-full overflow-hidden rounded-full bg-bg-elevated',
            sizeClasses[size]
          )}
        >
          {/* Fill */}
          <div
            className={cn(
              'h-full rounded-full',
              variantColors[variant],
              animated && 'transition-all duration-500 ease-out',
              clampedValue > 0 && `shadow-sm ${variantGlows[variant]}`
            )}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

export { ProgressBar };
