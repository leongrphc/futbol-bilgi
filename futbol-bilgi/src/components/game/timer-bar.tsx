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
            isExpired ? 'text-danger' : isCritical ? 'text-danger' : isLow ? 'text-warning' : 'text-text-primary'
          )}
          animate={
            isCritical && isRunning
              ? { scale: [1, 1.18, 1], x: [0, -2, 2, 0] }
              : isLow && isRunning
                ? { scale: [1, 1.12, 1] }
                : {}
          }
          transition={{ duration: 0.45, repeat: isLow && isRunning ? Infinity : 0 }}
        >
          {timeRemaining}s
        </motion.span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-bg-elevated">
        {isLow && isRunning && (
          <motion.div
            className={cn(
              'absolute inset-0 rounded-full',
              isCritical ? 'bg-danger/20' : 'bg-warning/20'
            )}
            animate={{ opacity: [0.35, 0.8, 0.35] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}
        <motion.div
          className={cn(
            'relative z-10 h-full rounded-full transition-colors duration-300',
            isCritical
              ? 'bg-danger shadow-[0_0_16px_rgba(248,81,73,0.45)]'
              : isLow
                ? 'bg-warning shadow-[0_0_16px_rgba(210,153,34,0.35)]'
                : 'bg-primary-500'
          )}
          initial={{ width: '100%' }}
          animate={{
            width: `${progress * 100}%`,
            ...(isLow && isRunning ? { opacity: [1, 0.65, 1] } : {}),
          }}
          transition={
            isLow && isRunning
              ? { opacity: { duration: 0.5, repeat: Infinity }, width: { duration: 0.3 } }
              : { duration: 0.3 }
          }
        />
      </div>
    </div>
  );
}
