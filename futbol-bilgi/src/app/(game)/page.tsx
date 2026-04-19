'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, Swords, Calendar, Coins, Gem, Flame, Battery } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { RewardOverlay } from '@/components/game/reward-overlay';
import { useUserStore } from '@/lib/stores/user-store';
import { DAILY_CHALLENGE_CONFIG } from '@/lib/constants/game';
import { calculateLevel, formatNumber } from '@/lib/utils/game';
import { cn } from '@/lib/utils/cn';

// ==========================================
// Animation Variants
// ==========================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

// ==========================================
// Game Mode Data
// ==========================================

const gameModes = [
  {
    id: 'millionaire',
    title: 'Milyoner Yarışması',
    description: 'Kim Milyoner Olmak İster formatı',
    icon: Crown,
    gradient: 'from-primary-600 to-primary-400',
    href: '/play/millionaire',
    cost: '1 ⚡',
    badge: null,
  },
  {
    id: 'quick',
    title: 'Hızlı Maç',
    description: '10 soru, 120 saniye',
    icon: Zap,
    gradient: 'from-blue-600 to-blue-400',
    href: '/play/quick',
    cost: null,
    badge: 'Ücretsiz',
  },
  {
    id: 'duel',
    title: 'Düello',
    description: '1v1 Bilgi Yarışı',
    icon: Swords,
    gradient: 'from-orange-600 to-orange-400',
    href: '/play/duel',
    cost: '1 ⚡',
    badge: null,
  },
  {
    id: 'daily',
    title: 'Günlük Meydan Okuma',
    description: 'Bugünün 5 sorusu',
    icon: Calendar,
    gradient: 'from-purple-600 to-purple-400',
    href: '/play/daily',
    cost: null,
    badge: 'Günlük',
  },
];

// ==========================================
// Dashboard Page
// ==========================================

export default function DashboardPage() {
  const user = useUserStore((state) => state.user);
  const addXP = useUserStore((state) => state.addXP);
  const updateCoins = useUserStore((state) => state.updateCoins);
  const updateStreak = useUserStore((state) => state.updateStreak);
  const [showRewardOverlay, setShowRewardOverlay] = useState(false);
  const [rewardData, setRewardData] = useState<{ xp: number; coins: number; levelUp: { from: number; to: number } | null }>({
    xp: 0,
    coins: 0,
    levelUp: null,
  });

  if (!user) {
    return null;
  }

  const { level, currentXP, nextLevelXP, progress } = calculateLevel(user.xp);
  const successRate =
    user.total_questions_answered > 0
      ? Math.round((user.total_correct_answers / user.total_questions_answered) * 100)
      : 0;

  // Format current date in Turkish
  const currentDate = new Date().toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const today = new Date();
  const lastClaimDate = user.last_daily_claim ? new Date(user.last_daily_claim) : null;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isClaimedToday = lastClaimDate?.toDateString() === today.toDateString();
  const wasClaimedYesterday = lastClaimDate?.toDateString() === yesterday.toDateString();
  const canClaimDailyReward = !isClaimedToday;
  const nextStreak = !lastClaimDate ? 1 : wasClaimedYesterday ? user.streak_days + 1 : 1;

  const handleClaimDailyReward = () => {
    if (!canClaimDailyReward) return;

    const xp = DAILY_CHALLENGE_CONFIG.base_xp;
    const coins = DAILY_CHALLENGE_CONFIG.base_coins + (nextStreak * DAILY_CHALLENGE_CONFIG.streak_bonus_multiplier);

    const currentLevel = calculateLevel(user.xp).level;
    const newLevel = calculateLevel(user.xp + xp).level;
    const levelUp = newLevel > currentLevel ? { from: currentLevel, to: newLevel } : null;

    addXP(xp);
    updateCoins(coins);
    updateStreak(nextStreak);
    setRewardData({ xp, coins, levelUp });
    setShowRewardOverlay(true);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen p-4 pb-24"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="font-display text-3xl font-bold text-text-primary">
          Merhaba, {user.username}! 👋
        </h1>
        <p className="mt-1 text-sm text-text-secondary">{currentDate}</p>
      </motion.div>

      {/* Stats Bar */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {/* Energy */}
          <Card padding="sm" className="flex-shrink-0 w-32">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Battery className="h-4 w-4 text-warning" />
                <span className="text-xs text-text-secondary">Enerji</span>
              </div>
              <div className="font-display text-lg font-bold text-text-primary">
                {user.energy}/5
              </div>
              <ProgressBar value={user.energy / 5} variant="warning" size="sm" />
            </div>
          </Card>

          {/* Coins */}
          <Card padding="sm" className="flex-shrink-0 w-32">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-secondary-500" />
                <span className="text-xs text-text-secondary">Coin</span>
              </div>
              <div className="font-display text-lg font-bold text-text-primary">
                {formatNumber(user.coins)}
              </div>
            </div>
          </Card>

          {/* Gems */}
          <Card padding="sm" className="flex-shrink-0 w-32">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Gem className="h-4 w-4 text-info" />
                <span className="text-xs text-text-secondary">Gem</span>
              </div>
              <div className="font-display text-lg font-bold text-text-primary">
                {formatNumber(user.gems)}
              </div>
            </div>
          </Card>

          {/* Streak */}
          <Card padding="sm" className="flex-shrink-0 w-32">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-accent-500" />
                <span className="text-xs text-text-secondary">Streak</span>
              </div>
              <div className="font-display text-lg font-bold text-text-primary">
                {user.streak_days} gün
              </div>
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Level Progress */}
      <motion.div variants={itemVariants} className="mb-6">
        <Card padding="md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500/20 text-primary-500 font-display font-bold">
                {level}
              </div>
              <div>
                <div className="font-display text-sm font-semibold text-text-primary">
                  Seviye {level}
                </div>
                <div className="text-xs text-text-secondary">
                  {currentXP}/{nextLevelXP} XP
                </div>
              </div>
            </div>
          </div>
          <ProgressBar value={progress} variant="default" size="md" animated />
        </Card>
      </motion.div>

      {/* Game Modes Section */}
      <motion.div variants={itemVariants} className="mb-6">
        <h2 className="mb-4 font-display text-xl font-bold text-text-primary">
          🎮 Oyun Modları
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {gameModes.map((mode, index) => {
            const Icon = mode.icon;
            return (
              <motion.div
                key={mode.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link href={mode.href}>
                  <Card
                    padding="md"
                    className={cn(
                      'relative overflow-hidden h-full',
                      'hover:border-white/[0.16]'
                    )}
                  >
                    {/* Gradient background */}
                    <div
                      className={cn(
                        'absolute inset-0 bg-gradient-to-br opacity-10',
                        mode.gradient
                      )}
                    />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col gap-3">
                      {/* Icon */}
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br',
                          mode.gradient
                        )}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>

                      {/* Title */}
                      <div>
                        <h3 className="font-display text-base font-bold text-text-primary leading-tight">
                          {mode.title}
                        </h3>
                        <p className="mt-1 text-xs text-text-secondary">
                          {mode.description}
                        </p>
                      </div>

                      {/* Badge or Cost */}
                      <div className="flex items-center justify-between">
                        {mode.badge && (
                          <span className="rounded-full bg-bg-elevated px-2 py-1 text-xs font-medium text-text-secondary">
                            {mode.badge}
                          </span>
                        )}
                        {mode.cost && (
                          <span className="rounded-full bg-bg-elevated px-2 py-1 text-xs font-medium text-warning">
                            {mode.cost}
                          </span>
                        )}
                      </div>

                      {/* CTA Button */}
                      <Button size="sm" variant="primary" fullWidth>
                        {mode.id === 'duel' ? 'Eşleş' : mode.id === 'quick' ? 'Hızlı Başla' : mode.id === 'daily' ? 'Başla' : 'Oyna'}
                      </Button>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Daily Reward Banner */}
      {canClaimDailyReward ? (
        <motion.div variants={itemVariants} className="mb-6">
          <Card
            variant="highlighted"
            padding="md"
            className="animate-pulse-glow cursor-pointer"
            onClick={handleClaimDailyReward}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-500/20">
                  <span className="text-2xl">🎁</span>
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-text-primary">
                    Günlük Ödülünü Al!
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Bugün: +{DAILY_CHALLENGE_CONFIG.base_xp} XP, +{DAILY_CHALLENGE_CONFIG.base_coins + ((user.streak_days + 1) * DAILY_CHALLENGE_CONFIG.streak_bonus_multiplier)} coin
                  </p>
                </div>
              </div>
              <Button size="sm" variant="secondary">
                Al
              </Button>
            </div>
          </Card>
        </motion.div>
      ) : null}

      {/* Quick Stats */}
      <motion.div variants={itemVariants}>
        <h2 className="mb-4 font-display text-xl font-bold text-text-primary">
          📊 İstatistiklerin
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Card padding="md" className="text-center">
            <div className="font-display text-2xl font-bold text-text-primary">
              {formatNumber(user.total_questions_answered)}
            </div>
            <div className="mt-1 text-xs text-text-secondary">Toplam Soru</div>
          </Card>

          <Card padding="md" className="text-center">
            <div className="font-display text-2xl font-bold text-success">
              {formatNumber(user.total_correct_answers)}
            </div>
            <div className="mt-1 text-xs text-text-secondary">Doğru Cevap</div>
          </Card>

          <Card padding="md" className="text-center">
            <div className="font-display text-2xl font-bold text-primary-500">
              {successRate}%
            </div>
            <div className="mt-1 text-xs text-text-secondary">Başarı Oranı</div>
          </Card>
        </div>
      </motion.div>

      <RewardOverlay
        isVisible={showRewardOverlay}
        xp={rewardData.xp}
        coins={rewardData.coins}
        levelUp={rewardData.levelUp}
        onComplete={() => setShowRewardOverlay(false)}
      />
    </motion.div>
  );
}
