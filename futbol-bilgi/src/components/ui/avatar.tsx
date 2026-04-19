'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

// ==========================================
// Avatar Props
// ==========================================

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Image source URL */
  src?: string | null;
  /** Alt text for image */
  alt?: string;
  /** Fallback text (initials) */
  fallback?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Optional frame style */
  frame?: string | null;
  /** Show online indicator */
  showOnline?: boolean;
  /** Is user online */
  isOnline?: boolean;
}

// ==========================================
// Size Config
// ==========================================

const sizeClasses: Record<string, { container: string; text: string; indicator: string }> = {
  sm: {
    container: 'h-8 w-8',
    text: 'text-xs',
    indicator: 'h-2 w-2 border',
  },
  md: {
    container: 'h-10 w-10',
    text: 'text-sm',
    indicator: 'h-2.5 w-2.5 border-2',
  },
  lg: {
    container: 'h-14 w-14',
    text: 'text-base',
    indicator: 'h-3 w-3 border-2',
  },
  xl: {
    container: 'h-20 w-20',
    text: 'text-xl',
    indicator: 'h-4 w-4 border-2',
  },
};

// ==========================================
// Frame Config
// ==========================================

const frameClasses: Record<string, string> = {
  default: 'ring-2 ring-bg-elevated',
  bronze: 'ring-2 ring-amber-600',
  silver: 'ring-2 ring-gray-400',
  gold: 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/20',
  diamond: 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-400/20',
  champion: 'ring-3 ring-purple-500 shadow-lg shadow-purple-500/30',
  premium: 'ring-2 ring-secondary-500 shadow-lg shadow-secondary-500/20',
};

// ==========================================
// Avatar Component
// ==========================================

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      src,
      alt = 'Avatar',
      fallback,
      size = 'md',
      frame,
      showOnline = false,
      isOnline = false,
      ...props
    },
    ref
  ) => {
    const sizeConfig = sizeClasses[size];
    const frameClass = frame ? (frameClasses[frame] ?? frameClasses.default) : frameClasses.default;

    // Generate fallback initials
    const initials = fallback
      ? fallback
          .split(' ')
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : '?';

    return (
      <div ref={ref} className={cn('relative inline-block', className)} {...props}>
        {/* Avatar circle */}
        <div
          className={cn(
            'relative overflow-hidden rounded-full bg-bg-elevated',
            sizeConfig.container,
            frameClass
          )}
        >
          {src ? (
            <img
              src={src}
              alt={alt}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div
              className={cn(
                'flex h-full w-full items-center justify-center bg-primary-500/20 font-semibold text-primary-400',
                sizeConfig.text
              )}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Online indicator */}
        {showOnline && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full border-bg-primary',
              sizeConfig.indicator,
              isOnline ? 'bg-success' : 'bg-text-muted'
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
