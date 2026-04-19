'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import type { QuestionOption } from '@/types';

// ==========================================
// Answer Option — Single answer button
// ==========================================

type AnswerState = 'default' | 'selected' | 'correct' | 'wrong' | 'eliminated';

interface AnswerOptionProps {
  option: QuestionOption;
  state: AnswerState;
  disabled: boolean;
  onSelect: (key: 'A' | 'B' | 'C' | 'D') => void;
  showDoubleAnswer?: boolean;
}

const stateStyles: Record<AnswerState, string> = {
  default: 'border-white/[0.08] bg-bg-elevated hover:border-primary-500/50 hover:bg-bg-elevated/80 active:scale-[0.98]',
  selected: 'border-secondary-500 bg-secondary-500/10 ring-1 ring-secondary-500/30',
  correct: 'border-success bg-success/15 ring-1 ring-success/30',
  wrong: 'border-danger bg-danger/15 ring-1 ring-danger/30',
  eliminated: 'border-white/[0.04] bg-bg-primary/50 opacity-30 pointer-events-none',
};

const keyStyles: Record<AnswerState, string> = {
  default: 'bg-bg-card text-text-secondary',
  selected: 'bg-secondary-500 text-bg-primary',
  correct: 'bg-success text-white',
  wrong: 'bg-danger text-white',
  eliminated: 'bg-bg-card/50 text-text-muted',
};

export function AnswerOption({ option, state, disabled, onSelect, showDoubleAnswer }: AnswerOptionProps) {
  return (
    <motion.button
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all duration-200',
        stateStyles[state],
        disabled && state === 'default' && 'pointer-events-none opacity-70'
      )}
      onClick={() => onSelect(option.key)}
      disabled={disabled || state === 'eliminated'}
      whileTap={state === 'default' && !disabled ? { scale: 0.97 } : {}}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Key badge (A, B, C, D) */}
      <motion.div
        className={cn(
          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold',
          keyStyles[state]
        )}
        animate={
          state === 'correct'
            ? { scale: [1, 1.2, 1] }
            : state === 'wrong'
              ? { x: [0, -3, 3, -3, 3, 0] }
              : {}
        }
        transition={{ duration: 0.4 }}
      >
        {option.key}
      </motion.div>

      {/* Answer text */}
      <span
        className={cn(
          'flex-1 text-sm font-medium',
          state === 'correct'
            ? 'text-success'
            : state === 'wrong'
              ? 'text-danger'
              : state === 'eliminated'
                ? 'text-text-muted line-through'
                : 'text-text-primary'
        )}
      >
        {option.text}
      </span>

      {/* Correct/wrong indicator */}
      {state === 'correct' && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-lg"
        >
          ✅
        </motion.span>
      )}
      {state === 'wrong' && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-lg"
        >
          ❌
        </motion.span>
      )}
    </motion.button>
  );
}

// ==========================================
// Answer Grid — All 4 options
// ==========================================

interface AnswerGridProps {
  options: QuestionOption[];
  selectedAnswer: 'A' | 'B' | 'C' | 'D' | null;
  correctAnswer: 'A' | 'B' | 'C' | 'D' | null; // null while unrevealed
  eliminatedOptions: ('A' | 'B' | 'C' | 'D')[];
  disabled: boolean;
  onSelect: (key: 'A' | 'B' | 'C' | 'D') => void;
  showDoubleAnswer?: boolean;
}

export function AnswerGrid({
  options,
  selectedAnswer,
  correctAnswer,
  eliminatedOptions,
  disabled,
  onSelect,
  showDoubleAnswer,
}: AnswerGridProps) {
  function getOptionState(key: 'A' | 'B' | 'C' | 'D'): AnswerState {
    if (eliminatedOptions.includes(key)) return 'eliminated';
    if (correctAnswer !== null) {
      if (key === correctAnswer) return 'correct';
      if (key === selectedAnswer && key !== correctAnswer) return 'wrong';
      return 'default';
    }
    if (key === selectedAnswer) return 'selected';
    return 'default';
  }

  return (
    <div className="space-y-2.5">
      {options.map((option, index) => (
        <motion.div
          key={option.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.08 }}
        >
          <AnswerOption
            option={option}
            state={getOptionState(option.key)}
            disabled={disabled}
            onSelect={onSelect}
            showDoubleAnswer={showDoubleAnswer}
          />
        </motion.div>
      ))}
    </div>
  );
}
