'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { MILLIONAIRE_STEPS } from '@/lib/constants/game';
import { formatNumber } from '@/lib/utils/game';
import { Lock, ChevronRight } from 'lucide-react';

// ==========================================
// Prize Ladder — Shows all 15 millionaire steps
// ==========================================

interface PrizeLadderProps {
  currentQuestion: number;
  isOpen: boolean;
  onClose: () => void;
}

export function PrizeLadder({ currentQuestion, isOpen, onClose }: PrizeLadderProps) {
  if (!isOpen) return null;

  const reversedSteps = [...MILLIONAIRE_STEPS].reverse();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass-card mx-4 max-h-[80vh] w-full max-w-sm overflow-y-auto p-4"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-center font-display text-lg font-bold text-text-primary">
          🏆 Ödül Basamakları
        </h3>

        <div className="space-y-1">
          {reversedSteps.map((step) => {
            const isCurrent = step.questionNumber === currentQuestion;
            const isPassed = step.questionNumber < currentQuestion;
            const isFuture = step.questionNumber > currentQuestion;

            return (
              <motion.div
                key={step.questionNumber}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all',
                  isCurrent && 'bg-primary-500/20 border border-primary-500/40 ring-1 ring-primary-500/20',
                  isPassed && 'bg-bg-elevated/50 opacity-60',
                  isFuture && 'opacity-40',
                  step.isSafePoint && !isCurrent && 'border-l-2 border-l-secondary-500'
                )}
                animate={isCurrent ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div className="flex items-center gap-2">
                  {isCurrent && (
                    <ChevronRight className="h-4 w-4 text-primary-500" />
                  )}
                  {step.isSafePoint && (
                    <Lock className="h-3 w-3 text-secondary-500" />
                  )}
                  <span className={cn(
                    'font-medium',
                    isCurrent ? 'text-primary-500' : isPassed ? 'text-text-secondary' : 'text-text-muted'
                  )}>
                    Soru {step.questionNumber}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={cn(
                    'font-mono font-bold',
                    isCurrent ? 'text-primary-500' : isPassed ? 'text-text-secondary' : 'text-text-muted',
                    step.questionNumber >= 13 && 'text-accent-500'
                  )}>
                    {formatNumber(step.points)}
                  </span>
                  {/* Difficulty indicator */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: step.difficulty }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          step.difficulty <= 2 ? 'bg-success' :
                          step.difficulty <= 3 ? 'bg-warning' :
                          step.difficulty <= 4 ? 'bg-danger' :
                          'bg-accent-500'
                        )}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-bg-elevated py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-card"
        >
          Kapat
        </button>
      </motion.div>
    </motion.div>
  );
}

// ==========================================
// Mini Prize Indicator — Compact current step info
// ==========================================

interface MiniPrizeProps {
  currentQuestion: number;
  score: number;
  safePointScore: number;
  onOpenLadder: () => void;
}

export function MiniPrize({ currentQuestion, safePointScore, onOpenLadder }: MiniPrizeProps) {
  const step = MILLIONAIRE_STEPS.find(s => s.questionNumber === currentQuestion);

  return (
    <motion.button
      className="flex w-full items-center justify-between rounded-xl bg-bg-elevated/60 px-4 py-2.5 transition-colors hover:bg-bg-elevated"
      onClick={onOpenLadder}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-2">
        <span className="font-display text-sm font-bold text-text-primary">
          Soru {currentQuestion}/15
        </span>
        {step?.isSafePoint && (
          <span className="flex items-center gap-1 rounded-full bg-secondary-500/10 px-2 py-0.5 text-[10px] font-medium text-secondary-500">
            <Lock className="h-2.5 w-2.5" /> Güvenli Nokta
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {safePointScore > 0 && (
          <span className="text-xs text-text-muted">
            🔒 {formatNumber(safePointScore)}
          </span>
        )}
        <span className="font-mono text-sm font-bold text-secondary-500">
          🏆 {step ? formatNumber(step.points) : '0'}
        </span>
      </div>
    </motion.button>
  );
}
