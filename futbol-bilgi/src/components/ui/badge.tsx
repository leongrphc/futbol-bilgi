'use client';

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import type { DifficultyLevel, LeagueTier } from '@/types';

// ==========================================
// Badge Variants
// ==========================================

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-bg-elevated text-text-secondary',
        primary: 'bg-primary-500/20 text-primary-400 border border-primary-500/30',
        secondary: 'bg-secondary-500/20 text-secondary-400 border border-secondary-500/30',
        success: 'bg-success/20 text-success border border-success/30',
        danger: 'bg-danger/20 text-danger border border-danger/30',
        warning: 'bg-warning/20 text-warning border border-warning/30',
        info: 'bg-info/20 text-info border border-info/30',
        // Difficulty
        easy: 'bg-difficulty-easy/20 text-difficulty-easy border border-difficulty-easy/30',
        medium: 'bg-difficulty-medium/20 text-difficulty-medium border border-difficulty-medium/30',
        hard: 'bg-difficulty-hard/20 text-difficulty-hard border border-difficulty-hard/30',
        expert: 'bg-difficulty-expert/20 text-difficulty-expert border border-difficulty-expert/30',
        legend: 'bg-difficulty-legend/20 text-difficulty-legend border border-difficulty-legend/30',
        // League tiers
        bronze: 'bg-amber-800/20 text-amber-600 border border-amber-700/30',
        silver: 'bg-gray-400/20 text-gray-300 border border-gray-400/30',
        gold: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
        diamond: 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30',
        champion: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// ==========================================
// Badge Props
// ==========================================

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

// ==========================================
// Badge Component
// ==========================================

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

// ==========================================
// Helper — Get Badge Variant from Difficulty
// ==========================================

export function getDifficultyVariant(
  difficulty: DifficultyLevel
): NonNullable<VariantProps<typeof badgeVariants>['variant']> {
  switch (difficulty) {
    case 1:
      return 'easy';
    case 2:
      return 'medium';
    case 3:
      return 'hard';
    case 4:
      return 'expert';
    case 5:
      return 'legend';
    default:
      return 'default';
  }
}

export function getDifficultyLabel(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case 1:
      return 'Kolay';
    case 2:
      return 'Orta';
    case 3:
      return 'Zor';
    case 4:
      return 'Uzman';
    case 5:
      return 'Efsane';
    default:
      return 'Bilinmeyen';
  }
}

// ==========================================
// Helper — Get Badge Variant from League Tier
// ==========================================

export function getLeagueTierVariant(
  tier: LeagueTier
): NonNullable<VariantProps<typeof badgeVariants>['variant']> {
  return tier;
}

export { Badge, badgeVariants };
