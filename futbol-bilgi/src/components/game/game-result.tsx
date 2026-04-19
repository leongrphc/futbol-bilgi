'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { formatNumber, calculateAccuracy } from '@/lib/utils/game';
import { Trophy, Star, Coins, Target, Clock, ArrowRight, Home, RotateCcw } from 'lucide-react';
import type { GameResult } from '@/types';

// ==========================================
// Game Result Screen — Score summary after game ends
// ==========================================

interface GameResultScreenProps {
  result: GameResult;
  score: number;
  correctAnswers: number;
  totalAnswered: number;
  xpEarned: number;
  coinsEarned: number;
  questionReached: number;
  totalQuestions: number;
  safePointScore: number;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

const resultConfig: Record<GameResult, { title: string; emoji: string; color: string; bgGlow: string }> = {
  win: {
    title: 'Tebrikler! 🏆',
    emoji: '🎉',
    color: 'text-secondary-500',
    bgGlow: 'from-secondary-500/20 via-transparent to-transparent',
  },
  loss: {
    title: 'Oyun Bitti',
    emoji: '😔',
    color: 'text-danger',
    bgGlow: 'from-danger/10 via-transparent to-transparent',
  },
  timeout: {
    title: 'Süre Doldu!',
    emoji: '⏰',
    color: 'text-warning',
    bgGlow: 'from-warning/10 via-transparent to-transparent',
  },
  forfeit: {
    title: 'Çekildiniz',
    emoji: '🏳️',
    color: 'text-text-secondary',
    bgGlow: 'from-white/5 via-transparent to-transparent',
  },
  draw: {
    title: 'Berabere',
    emoji: '🤝',
    color: 'text-primary-500',
    bgGlow: 'from-primary-500/10 via-transparent to-transparent',
  },
};

export function GameResultScreen({
  result,
  score,
  correctAnswers,
  totalAnswered,
  xpEarned,
  coinsEarned,
  questionReached,
  totalQuestions,
  safePointScore,
  onPlayAgain,
  onGoHome,
}: GameResultScreenProps) {
  const config = resultConfig[result];
  const accuracy = calculateAccuracy(correctAnswers, totalAnswered);
  const finalScore = result === 'loss' || result === 'timeout' ? safePointScore : score;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      {/* Background glow */}
      <div className={cn('pointer-events-none fixed inset-0 bg-gradient-radial', config.bgGlow)} />

      <motion.div
        className="relative z-10 w-full max-w-sm space-y-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Result header */}
        <motion.div
          className="text-center"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <motion.div
            className="mb-3 text-6xl"
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {config.emoji}
          </motion.div>
          <h1 className={cn('font-display text-3xl font-bold', config.color)}>
            {config.title}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Soru {questionReached}/{totalQuestions}
          </p>
        </motion.div>

        {/* Score card */}
        <motion.div
          className="glass-card overflow-hidden p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Main score */}
          <div className="mb-6 text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-text-muted">
              Toplam Puan
            </p>
            <motion.p
              className="font-display text-4xl font-bold text-secondary-500"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
            >
              {formatNumber(finalScore)}
            </motion.p>
            {safePointScore > 0 && result !== 'win' && (
              <p className="mt-1 text-xs text-text-muted">
                🔒 Güvenli nokta puanı: {formatNumber(safePointScore)}
              </p>
            )}
            {safePointScore === 0 && result === 'timeout' && (
              <p className="mt-1 text-xs text-text-muted">
                ⏱ Süre bonusu skoruna dahil edildi.
              </p>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatItem
              icon={<Target className="h-4 w-4" />}
              label="Doğru"
              value={`${correctAnswers}/${totalAnswered}`}
              color="text-success"
              delay={0.3}
            />
            <StatItem
              icon={<Trophy className="h-4 w-4" />}
              label="Başarı"
              value={`%${accuracy}`}
              color="text-primary-500"
              delay={0.4}
            />
            <StatItem
              icon={<Star className="h-4 w-4" />}
              label="XP Kazanıldı"
              value={`+${xpEarned}`}
              color="text-accent-500"
              delay={0.5}
            />
            <StatItem
              icon={<Coins className="h-4 w-4" />}
              label="Coin Kazanıldı"
              value={`+${coinsEarned}`}
              color="text-secondary-500"
              delay={0.6}
            />
          </div>
        </motion.div>

        {/* Progress bar — how far they got */}
        <motion.div
          className="glass-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">İlerleme</span>
            <span className="text-xs font-bold text-text-primary">
              {questionReached}/{totalQuestions}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-bg-elevated">
            <motion.div
              className={cn(
                'h-full rounded-full',
                result === 'win' ? 'bg-gradient-to-r from-secondary-500 to-accent-500' : 'bg-primary-500'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${(questionReached / totalQuestions) * 100}%` }}
              transition={{ delay: 0.6, duration: 0.8 }}
            />
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <button
            onClick={onGoHome}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-bg-elevated py-3.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-card"
          >
            <Home className="h-4 w-4" />
            Ana Sayfa
          </button>
          <button
            onClick={onPlayAgain}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4" />
            Tekrar Oyna
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ==========================================
// Stat Item — Single stat in the grid
// ==========================================

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  delay: number;
}

function StatItem({ icon, label, value, color, delay }: StatItemProps) {
  return (
    <motion.div
      className="flex items-center gap-2.5 rounded-lg bg-bg-primary/50 p-3"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
    >
      <div className={cn('flex-shrink-0', color)}>{icon}</div>
      <div>
        <p className="text-[10px] text-text-muted">{label}</p>
        <p className={cn('text-sm font-bold', color)}>{value}</p>
      </div>
    </motion.div>
  );
}
