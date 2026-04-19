'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import {
  Percent,
  Users,
  Phone,
  Timer,
  SkipForward,
  Copy
} from 'lucide-react';
import type { JokerType, JokerState } from '@/types';
import { JOKER_NAMES } from '@/lib/constants/game';

// ==========================================
// Joker Icons Map
// ==========================================

const JOKER_ICONS: Record<JokerType, React.ReactNode> = {
  fifty_fifty: <Percent className="h-4 w-4" />,
  audience: <Users className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  freeze_time: <Timer className="h-4 w-4" />,
  skip: <SkipForward className="h-4 w-4" />,
  double_answer: <Copy className="h-4 w-4" />,
};

const JOKER_COLORS: Record<JokerType, string> = {
  fifty_fifty: 'from-blue-500 to-blue-700',
  audience: 'from-purple-500 to-purple-700',
  phone: 'from-green-500 to-green-700',
  freeze_time: 'from-cyan-500 to-cyan-700',
  skip: 'from-orange-500 to-orange-700',
  double_answer: 'from-pink-500 to-pink-700',
};

// ==========================================
// Single Joker Button
// ==========================================

interface JokerButtonProps {
  joker: JokerState;
  onUse: (type: JokerType) => void;
  disabled: boolean;
}

function JokerButton({ joker, onUse, disabled }: JokerButtonProps) {
  const isUsable = !joker.isUsed && joker.isAvailable && !disabled;

  return (
    <motion.button
      className={cn(
        'relative flex flex-col items-center gap-1 rounded-xl p-2.5 transition-all duration-200',
        isUsable
          ? 'cursor-pointer bg-gradient-to-b ' + JOKER_COLORS[joker.type] + ' shadow-lg hover:shadow-xl active:scale-95'
          : 'cursor-not-allowed bg-bg-elevated/50 opacity-40'
      )}
      onClick={() => isUsable && onUse(joker.type)}
      disabled={!isUsable}
      whileHover={isUsable ? { scale: 1.05 } : {}}
      whileTap={isUsable ? { scale: 0.95 } : {}}
    >
      {/* Icon */}
      <div className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg',
        isUsable ? 'bg-white/20 text-white' : 'bg-white/5 text-text-muted'
      )}>
        {JOKER_ICONS[joker.type]}
      </div>

      {/* Label */}
      <span className={cn(
        'text-[10px] font-medium leading-tight',
        isUsable ? 'text-white/90' : 'text-text-muted'
      )}>
        {JOKER_NAMES[joker.type].split(' ')[0]}
      </span>

      {/* Used overlay */}
      {joker.isUsed && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-bg-primary/70">
          <span className="text-lg">✕</span>
        </div>
      )}
    </motion.button>
  );
}

// ==========================================
// Joker Bar — All jokers in a row
// ==========================================

interface JokerBarProps {
  jokers: JokerState[];
  onUseJoker: (type: JokerType) => void;
  disabled: boolean;
}

export function JokerBar({ jokers, onUseJoker, disabled }: JokerBarProps) {
  return (
    <motion.div
      className="flex items-center justify-center gap-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      {jokers.map((joker) => (
        <JokerButton
          key={joker.type}
          joker={joker}
          onUse={onUseJoker}
          disabled={disabled}
        />
      ))}
    </motion.div>
  );
}

// ==========================================
// Audience Joker Result — Bar chart display
// ==========================================

interface AudienceResultProps {
  distribution: Record<'A' | 'B' | 'C' | 'D', number>;
}

export function AudienceResult({ distribution }: AudienceResultProps) {
  const entries = Object.entries(distribution) as ['A' | 'B' | 'C' | 'D', number][];
  const maxValue = Math.max(...entries.map(([, v]) => v));

  return (
    <motion.div
      className="glass-card p-4"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <p className="mb-3 text-center text-xs font-medium text-text-secondary">
        👥 Seyirci Sonuçları
      </p>
      <div className="flex items-end justify-center gap-3">
        {entries.map(([key, value]) => (
          <div key={key} className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-text-primary">{value}%</span>
            <motion.div
              className="w-10 rounded-t-md bg-primary-500"
              initial={{ height: 0 }}
              animate={{ height: `${(value / maxValue) * 60}px` }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />
            <span className="text-xs font-medium text-text-secondary">{key}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ==========================================
// Phone Joker Result — Friend's suggestion
// ==========================================

interface PhoneResultProps {
  suggestion: 'A' | 'B' | 'C' | 'D';
  confidence: number;
}

export function PhoneResult({ suggestion, confidence }: PhoneResultProps) {
  return (
    <motion.div
      className="glass-card p-4"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <p className="mb-2 text-center text-xs font-medium text-text-secondary">
        📱 Telefon Joker
      </p>
      <p className="text-center text-sm text-text-primary">
        &quot;Bence cevap <span className="font-bold text-secondary-500">{suggestion}</span> şıkkı.
        {confidence >= 80 ? ' Çok eminim!' : confidence >= 50 ? ' Oldukça eminim.' : ' Ama tam emin değilim.'}
        &quot;
      </p>
      <p className="mt-1 text-center text-xs text-text-muted">
        Güven: %{confidence}
      </p>
    </motion.div>
  );
}
