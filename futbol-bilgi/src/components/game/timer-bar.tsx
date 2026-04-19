'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

// ==========================================
// Timer Bar — Animated countdown for questions
// ==========================================

interface TimerBarProps {
  timeRemaining: number;
  totalTime: number;
  isRunning: boolean;
  isExpired: boolean;
}

export function TimerBar({ timeRemaining, totalTime, isRunning, isExpired }: TimerBarProps) {
  const progress = totalTime > 0 ? timeRemaining / totalTime : 0;
  const isLow = timeRemaining <= 5;
  const isCritical = timeRemaining <= 3;

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-text-secondary">Süre</span>
        <motion.span
          className={cn(
            'font-mono text-lg font-bold tabular-nums',
            isCritical ? 'text-danger' : isLow ? 'text-warning' : 'text-text-primary'
          )}
          animate={isLow && isRunning ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          {timeRemaining}s
        </motion.span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg-elevated">
        <motion.div
          className={cn(
            'h-full rounded-full transition-colors duration-300',
            isCritical
              ? 'bg-danger'
              : isLow
                ? 'bg-warning'
                : 'bg-primary-500'
          )}
          initial={{ width: '100%' }}
          animate={{
            width: `${progress * 100}%`,
            ...(isLow && isRunning ? { opacity: [1, 0.6, 1] } : {}),
          }}
          transition={
            isLow && isRunning
              ? { opacity: { duration: 0.5, repeat: Infinity } }
              : { duration: 0.3 }
          }
        />
      </div>
    </div>
  );
}
