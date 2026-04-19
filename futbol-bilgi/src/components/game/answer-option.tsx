'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import type { QuestionOption } from '@/types';

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
  selected: 'border-secondary-500 bg-secondary-500/12 ring-2 ring-secondary-500/30 shadow-lg shadow-secondary-500/10',
  correct: 'border-success bg-success/15 ring-2 ring-success/30 glow-green',
  wrong: 'border-danger bg-danger/15 ring-2 ring-danger/30 glow-danger',
  eliminated: 'border-white/[0.04] bg-bg-primary/50 opacity-30 pointer-events-none blur-[0.5px]',
};

const keyStyles: Record<AnswerState, string> = {
  default: 'bg-bg-card text-text-secondary',
  selected: 'bg-secondary-500 text-bg-primary',
  correct: 'bg-success text-white',
  wrong: 'bg-danger text-white',
  eliminated: 'bg-bg-card/50 text-text-muted',
};

const optionVariants = {
  initial: { opacity: 0, x: -20, scale: 0.98 },
  animate: { opacity: 1, x: 0, scale: 1 },
  selected: { scale: 1.01, y: -1 },
  correct: { scale: [1, 1.02, 1], y: [0, -2, 0] },
  wrong: { x: [0, -4, 4, -3, 3, 0] },
  eliminated: { opacity: 0.25, scale: 0.98 },
};

const keyBadgeVariants = {
  correct: { scale: [1, 1.18, 1], rotate: [0, -6, 0] },
  wrong: { x: [0, -3, 3, -3, 3, 0], rotate: [0, -4, 4, -2, 2, 0] },
};

const indicatorTransition = {
  type: 'spring' as const,
  stiffness: 320,
  damping: 20,
};

function getMotionState(state: AnswerState) {
  switch (state) {
    case 'selected':
      return optionVariants.selected;
    case 'correct':
      return optionVariants.correct;
    case 'wrong':
      return optionVariants.wrong;
    case 'eliminated':
      return optionVariants.eliminated;
    default:
      return optionVariants.animate;
  }
}

function getTextClass(state: AnswerState) {
  switch (state) {
    case 'correct':
      return 'text-success';
    case 'wrong':
      return 'text-danger';
    case 'eliminated':
      return 'text-text-muted line-through';
    default:
      return 'text-text-primary';
  }
}

function renderIndicator(state: AnswerState) {
  if (state === 'correct') {
    return (
      <motion.span
        initial={{ scale: 0, rotate: -12, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={indicatorTransition}
        className="text-lg"
      >
        ✅
      </motion.span>
    );
  }

  if (state === 'wrong') {
    return (
      <motion.span
        initial={{ scale: 0, rotate: -12, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={indicatorTransition}
        className="text-lg"
      >
        ❌
      </motion.span>
    );
  }

  return null;
}

export function AnswerOption({ option, state, disabled, onSelect }: AnswerOptionProps) {
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
      initial={optionVariants.initial}
      animate={getMotionState(state)}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <motion.div
        className={cn(
          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold',
          keyStyles[state]
        )}
        animate={state === 'correct' ? keyBadgeVariants.correct : state === 'wrong' ? keyBadgeVariants.wrong : {}}
        transition={{ duration: 0.4 }}
      >
        {option.key}
      </motion.div>

      <span className={cn('flex-1 text-sm font-medium', getTextClass(state))}>
        {option.text}
      </span>

      {renderIndicator(state)}
    </motion.button>
  );
}

interface AnswerGridProps {
  options: QuestionOption[];
  selectedAnswer: 'A' | 'B' | 'C' | 'D' | null;
  correctAnswer: 'A' | 'B' | 'C' | 'D' | null;
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
          transition={{ duration: 0.28, delay: index * 0.08 }}
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
