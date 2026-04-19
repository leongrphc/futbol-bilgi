'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Star, Coins, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ==========================================
// Reward Overlay — Animated XP/Coin display
// ==========================================

interface RewardOverlayProps {
  isVisible: boolean;
  xp: number;
  coins: number;
  levelUp?: { from: number; to: number } | null;
  onComplete?: () => void;
}

export function RewardOverlay({
  isVisible,
  xp,
  coins,
  levelUp = null,
  onComplete,
}: RewardOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onComplete}
        >
          <motion.div
            className="relative flex flex-col items-center gap-6"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {/* Title */}
            <motion.p
              className="font-display text-xl font-bold text-text-primary"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Ödüller Kazanıldı!
            </motion.p>

            {/* Reward items */}
            <div className="flex gap-8">
              {/* XP Reward */}
              <RewardItem
                icon={<Star className="h-8 w-8 text-accent-500" />}
                value={`+${xp}`}
                label="XP"
                color="text-accent-500"
                delay={0.3}
              />

              {/* Coin Reward */}
              <RewardItem
                icon={<Coins className="h-8 w-8 text-secondary-500" />}
                value={`+${coins}`}
                label="Coin"
                color="text-secondary-500"
                delay={0.5}
              />
            </div>

            {/* Level Up Banner */}
            <AnimatePresence>
              {levelUp && (
                <motion.div
                  className="mt-2 flex items-center gap-3 rounded-2xl border border-accent-500/30 bg-accent-500/10 px-6 py-3"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
                >
                  <TrendingUp className="h-6 w-6 text-accent-500" />
                  <div>
                    <p className="text-xs font-medium text-accent-500">Seviye Atladın!</p>
                    <p className="font-display text-lg font-bold text-text-primary">
                      Seviye {levelUp.from} → {levelUp.to}
                    </p>
                  </div>
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Zap className="h-6 w-6 text-warning" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tap to continue */}
            <motion.p
              className="mt-4 text-xs text-text-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Devam etmek için dokun
            </motion.p>

            {/* Floating particles */}
            <FloatingParticles />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ==========================================
// Single Reward Item
// ==========================================

interface RewardItemProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
  delay: number;
}

function RewardItem({ icon, value, label, color, delay }: RewardItemProps) {
  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
    >
      <motion.div
        className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-card/80 shadow-lg backdrop-blur-sm"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ delay: delay + 0.3, duration: 0.6 }}
      >
        {icon}
      </motion.div>
      <motion.p
        className={cn('font-display text-2xl font-bold', color)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.2, type: 'spring', stiffness: 300 }}
      >
        {value}
      </motion.p>
      <p className="text-xs text-text-muted">{label}</p>
    </motion.div>
  );
}

// ==========================================
// Floating Particles — decorative confetti
// ==========================================

function FloatingParticles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 300,
    y: (Math.random() - 0.5) * 300,
    size: Math.random() * 8 + 4,
    delay: Math.random() * 0.5,
    emoji: ['⭐', '🪙', '✨', '🏆'][Math.floor(Math.random() * 4)],
  }));

  return (
    <div className="pointer-events-none absolute inset-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2 text-lg"
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: [1, 1, 0],
            scale: [0, 1.2, 0.8],
          }}
          transition={{
            duration: 1.5,
            delay: p.delay + 0.3,
            ease: 'easeOut',
          }}
          style={{ fontSize: p.size * 2 }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  );
}

// ==========================================
// Energy Warning — shown before game start
// ==========================================

interface EnergyWarningProps {
  isVisible: boolean;
  currentEnergy: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function EnergyWarning({
  isVisible,
  currentEnergy,
  onConfirm,
  onCancel,
}: EnergyWarningProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass-card mx-4 max-w-sm p-6"
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
          >
            {currentEnergy <= 0 ? (
              // No energy — can't play
              <>
                <div className="mb-4 text-center text-4xl">😴</div>
                <h3 className="mb-2 text-center font-display text-lg font-bold text-text-primary">
                  Enerjin Bitti!
                </h3>
                <p className="mb-6 text-center text-sm text-text-secondary">
                  Oynamak için en az 1 enerji gerekiyor. Enerji 20 dakikada 1 yenilenir.
                </p>
                <button
                  onClick={onCancel}
                  className="w-full rounded-xl bg-bg-elevated py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-card"
                >
                  Tamam
                </button>
              </>
            ) : (
              // Has energy — confirm spend
              <>
                <div className="mb-4 text-center text-4xl">⚡</div>
                <h3 className="mb-2 text-center font-display text-lg font-bold text-text-primary">
                  Enerji Kullan
                </h3>
                <p className="mb-6 text-center text-sm text-text-secondary">
                  Bu oyun 1 enerji harcayacak. Kalan enerjin:{' '}
                  <span className="font-bold text-warning">{currentEnergy}/5</span>
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={onCancel}
                    className="flex-1 rounded-xl bg-bg-elevated py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-card"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={onConfirm}
                    className="flex-1 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 py-3 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
                  >
                    Oyna (1⚡)
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
