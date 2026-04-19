'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, Swords, Calendar, Coins, Gem, Flame, Battery, PlayCircle, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { RewardOverlay } from '@/components/game/reward-overlay';
import { SeasonSummaryCard } from '@/components/league/season-summary-card';
import { useUserStore } from '@/lib/stores/user-store';
import { useLeagueStore } from '@/lib/stores/league-store';
import { getLeagueZone } from '@/lib/league/ranking';
import { calculateLevel, formatNumber, getStreakStatus, getDailyRewardPreview } from '@/lib/utils/game';
import { cn } from '@/lib/utils/cn';
import type { LeagueTier, UserSettings } from '@/types';

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
    description: '5 soru, hız bonuslu 1v1',
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

interface DailyRewardResponse {
  data?: {
    xp: number;
    coins: number;
    gems: number;
    energy: number;
    energy_last_refill: string;
    level: number;
    streak_days: number;
    last_daily_claim: string | null;
    total_questions_answered: number;
    total_correct_answers: number;
    elo_rating: number;
    settings: UserSettings;
    username: string;
    email: string;
    avatar_url: string | null;
    avatar_frame: string | null;
    favorite_team: string | null;
    league_tier: LeagueTier;
    is_premium: boolean;
    created_at: string;
    updated_at: string;
  };
  reward?: {
    xp: number;
    coins: number;
    nextStreak: number;
  };
  error?: string;
}

export default function DashboardPage() {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const currentSeason = useLeagueStore((state) => state.currentSeason);
  const entries = useLeagueStore((state) => state.entries);
  const fetchCurrentSeason = useLeagueStore((state) => state.fetchCurrentSeason);
  const fetchEntries = useLeagueStore((state) => state.fetchEntries);
  const ensurePlayerEntry = useLeagueStore((state) => state.ensurePlayerEntry);
  const [showRewardOverlay, setShowRewardOverlay] = useState(false);
  const [adMessage, setAdMessage] = useState<string | null>(null);
  const [iapMessage, setIapMessage] = useState<string | null>(null);
  const [claimingRewardType, setClaimingRewardType] = useState<string | null>(null);
  const [purchasingProductId, setPurchasingProductId] = useState<string | null>(null);
  const [rewardData, setRewardData] = useState<{
    xp: number;
    coins: number;
    levelUp: { from: number; to: number } | null;
    streakUp: { days: number } | null;
    streakMilestone: { days: number } | null;
  }>({
    xp: 0,
    coins: 0,
    levelUp: null,
    streakUp: null,
    streakMilestone: null,
  });

  useEffect(() => {
    if (!user) return;
    fetchCurrentSeason();
    ensurePlayerEntry(user.id, user.league_tier);
  }, [user, fetchCurrentSeason, ensurePlayerEntry]);

  useEffect(() => {
    if (!currentSeason) return;
    fetchEntries(currentSeason.id);
  }, [currentSeason, fetchEntries]);

  if (!user) {
    return null;
  }

  if (!currentSeason) {
    return (
      <div className="min-h-screen p-4 pb-24 flex items-center justify-center">
        <Card padding="lg" className="text-center">
          <p className="text-text-secondary">Sezon bilgisi yükleniyor...</p>
        </Card>
      </div>
    );
  }

  const { level, currentXP, nextLevelXP, progress } = calculateLevel(user.xp);
  const successRate =
    user.total_questions_answered > 0
      ? Math.round((user.total_correct_answers / user.total_questions_answered) * 100)
      : 0;

  const currentEntry = currentSeason
    ? entries.find((entry) => entry.user_id === user.id && entry.season_id === currentSeason.id)
    : undefined;
  const currentSeasonTier = currentEntry?.tier_at_start ?? user.league_tier;
  const tierEntries = currentSeason
    ? entries.filter((entry) => entry.season_id === currentSeason.id && entry.tier_at_start === currentSeasonTier)
    : [];
  const rankedTierEntries = [...tierEntries].sort((a, b) => b.season_score - a.season_score);
  const currentRank = rankedTierEntries.findIndex((entry) => entry.user_id === user.id) + 1;
  const leagueZone = currentRank > 0 ? getLeagueZone(currentRank, rankedTierEntries.length) : 'safe';
  const seasonScore = currentEntry?.season_score ?? 0;
  const totalTierPlayers = rankedTierEntries.length;
  const seasonEndsAt = currentSeason.ends_at;

  const currentDate = new Date().toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const { canClaimToday, activeStreak } = getStreakStatus(user.last_daily_claim, user.streak_days);
  const rewardPreview = getDailyRewardPreview(user.last_daily_claim, user.streak_days);

  const handleClaimAdReward = async (rewardType: 'energy_refill' | 'coins_small' | 'double_answer_joker') => {
    setClaimingRewardType(rewardType);
    setAdMessage(null);

    const response = await fetch('/api/ads/reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rewardType }),
    });

    const json = await response.json();

    if (!response.ok || !json.data || !user) {
      setAdMessage(json.error ?? 'Ödül alınamadı.');
      setClaimingRewardType(null);
      return;
    }

    setUser({
      ...user,
      ...json.data.profile,
    });

    if (rewardType === 'coins_small') {
      setRewardData({
        xp: 0,
        coins: json.data.reward.coins ?? 0,
        levelUp: null,
        streakUp: null,
        streakMilestone: null,
      });
      setShowRewardOverlay(true);
    } else {
      setAdMessage(
        rewardType === 'energy_refill'
          ? '+1 enerji hesabına işlendi.'
          : 'Çift cevap jokeri hesabına eklendi.'
      );
    }

    setClaimingRewardType(null);
  };

  const handlePurchaseProduct = async (productId: 'gems_small' | 'gems_medium' | 'gems_large' | 'starter_pack') => {
    if (!user) return;

    setPurchasingProductId(productId);
    setIapMessage(null);

    const response = await fetch('/api/iap/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });

    const json = await response.json();

    if (!response.ok || !json.data) {
      setIapMessage(json.error ?? 'Satın alma başarısız oldu.');
      setPurchasingProductId(null);
      return;
    }

    setUser({
      ...user,
      ...json.data.profile,
    });
    setIapMessage(`${json.data.purchase.label} hesabına eklendi.`);
    setPurchasingProductId(null);
  };

  const handleClaimDailyReward = async () => {
    if (!canClaimToday) return;

    const currentLevel = calculateLevel(user.xp).level;
    const response = await fetch('/api/me/progression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'claim_daily_reward' }),
    });

    const json = (await response.json()) as DailyRewardResponse;

    if (!response.ok || !json.data || !json.reward) {
      return;
    }

    const nextLevel = calculateLevel(json.data.xp).level;
    const levelUp = nextLevel > currentLevel ? { from: currentLevel, to: nextLevel } : null;
    const milestones = [7, 30, 100, 365];
    const streakUp = { days: json.reward.nextStreak };
    const streakMilestone = milestones.includes(json.reward.nextStreak) ? { days: json.reward.nextStreak } : null;

    setUser({
      ...user,
      ...json.data,
    });

    setRewardData({
      xp: json.reward.xp,
      coins: json.reward.coins,
      levelUp,
      streakUp,
      streakMilestone,
    });
    setShowRewardOverlay(true);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen p-4 pb-24"
    >
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="font-display text-3xl font-bold text-text-primary">
          Merhaba, {user.username}! 👋
        </h1>
        <p className="mt-1 text-sm text-text-secondary">{currentDate}</p>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <Card padding="sm" className="flex-shrink-0 w-32">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Battery className="h-4 w-4 text-warning" />
                <span className="text-xs text-text-secondary">Enerji</span>
              </div>
              <div className="font-display text-lg font-bold text-text-primary">{user.energy}/5</div>
              <ProgressBar value={user.energy / 5} variant="warning" size="sm" />
            </div>
          </Card>

          <Card padding="sm" className="flex-shrink-0 w-32">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-secondary-500" />
                <span className="text-xs text-text-secondary">Coin</span>
              </div>
              <div className="font-display text-lg font-bold text-text-primary">{formatNumber(user.coins)}</div>
            </div>
          </Card>

          <Card padding="sm" className="flex-shrink-0 w-32">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Gem className="h-4 w-4 text-info" />
                <span className="text-xs text-text-secondary">Gem</span>
              </div>
              <div className="font-display text-lg font-bold text-text-primary">{formatNumber(user.gems)}</div>
            </div>
          </Card>

          <Card padding="sm" className="flex-shrink-0 w-32">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-accent-500" />
                <span className="text-xs text-text-secondary">Streak</span>
              </div>
              <div className="font-display text-lg font-bold text-text-primary">{activeStreak} gün</div>
            </div>
          </Card>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-6">
        <Card padding="md">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500/20 font-display font-bold text-primary-500">
                {level}
              </div>
              <div>
                <div className="font-display text-sm font-semibold text-text-primary">Seviye {level}</div>
                <div className="text-xs text-text-secondary">{currentXP}/{nextLevelXP} XP</div>
              </div>
            </div>
          </div>
          <ProgressBar value={progress} variant="default" size="md" animated />
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-6">
        <SeasonSummaryCard
          tier={currentSeasonTier}
          rank={currentRank || null}
          totalPlayers={totalTierPlayers}
          seasonScore={seasonScore}
          endsAt={seasonEndsAt}
          zone={leagueZone}
        />
      </motion.div>

      <motion.div variants={itemVariants} className="mb-6">
        <Card padding="md" variant="highlighted">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-text-secondary">Rewarded Reklam</p>
              <h2 className="mt-1 font-display text-lg font-bold text-text-primary">İzle, ödülünü al</h2>
              <p className="mt-1 text-xs text-text-secondary">Enerji, coin veya çift cevap jokeri kazan.</p>
            </div>
            <PlayCircle className="h-6 w-6 text-secondary-500" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button size="sm" variant="secondary" onClick={() => handleClaimAdReward('energy_refill')} isLoading={claimingRewardType === 'energy_refill'}>
              +1 Enerji
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleClaimAdReward('coins_small')} isLoading={claimingRewardType === 'coins_small'}>
              +50 Coin
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleClaimAdReward('double_answer_joker')} isLoading={claimingRewardType === 'double_answer_joker'}>
              Çift Cevap
            </Button>
          </div>
          {adMessage && <p className="mt-3 text-xs text-text-secondary">{adMessage}</p>}
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-6">
        <Card padding="md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-text-secondary">Mock IAP</p>
              <h2 className="mt-1 font-display text-lg font-bold text-text-primary">Gem Paketleri</h2>
              <p className="mt-1 text-xs text-text-secondary">Gerçek ödeme olmadan sandbox satın alma akışı.</p>
            </div>
            <ShoppingBag className="h-6 w-6 text-primary-500" />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card padding="sm" className="space-y-2">
              <p className="font-display text-sm font-bold text-text-primary">Küçük Paket</p>
              <p className="text-xs text-text-secondary">50 gem</p>
              <Button size="sm" fullWidth onClick={() => handlePurchaseProduct('gems_small')} isLoading={purchasingProductId === 'gems_small'}>
                Satın Al
              </Button>
            </Card>
            <Card padding="sm" className="space-y-2">
              <p className="font-display text-sm font-bold text-text-primary">Orta Paket</p>
              <p className="text-xs text-text-secondary">200 gem</p>
              <Button size="sm" fullWidth onClick={() => handlePurchaseProduct('gems_medium')} isLoading={purchasingProductId === 'gems_medium'}>
                Satın Al
              </Button>
            </Card>
            <Card padding="sm" className="space-y-2">
              <p className="font-display text-sm font-bold text-text-primary">Büyük Paket</p>
              <p className="text-xs text-text-secondary">500 gem</p>
              <Button size="sm" fullWidth onClick={() => handlePurchaseProduct('gems_large')} isLoading={purchasingProductId === 'gems_large'}>
                Satın Al
              </Button>
            </Card>
            <Card padding="sm" variant="highlighted" className="space-y-2">
              <p className="font-display text-sm font-bold text-text-primary">Starter Pack</p>
              <p className="text-xs text-text-secondary">100 gem + 5000 coin</p>
              <Button
                size="sm"
                fullWidth
                variant={user.settings.purchases?.starter_pack_claimed ? 'secondary' : 'primary'}
                onClick={() => handlePurchaseProduct('starter_pack')}
                isLoading={purchasingProductId === 'starter_pack'}
                disabled={user.settings.purchases?.starter_pack_claimed}
              >
                {user.settings.purchases?.starter_pack_claimed ? 'Alındı' : 'Satın Al'}
              </Button>
            </Card>
          </div>
          {iapMessage && <p className="mt-3 text-xs text-text-secondary">{iapMessage}</p>}
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-6">
        <h2 className="mb-4 font-display text-xl font-bold text-text-primary">🎮 Oyun Modları</h2>
        <div className="grid grid-cols-2 gap-3">
          {gameModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <motion.div key={mode.id} variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link href={mode.href}>
                  <Card padding="md" className={cn('relative h-full overflow-hidden', 'hover:border-white/[0.16]')}>
                    <div className={cn('absolute inset-0 bg-gradient-to-br opacity-10', mode.gradient)} />
                    <div className="relative z-10 flex flex-col gap-3">
                      <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br', mode.gradient)}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-display text-base font-bold leading-tight text-text-primary">{mode.title}</h3>
                        <p className="mt-1 text-xs text-text-secondary">{mode.description}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        {mode.badge && <span className="rounded-full bg-bg-elevated px-2 py-1 text-xs font-medium text-text-secondary">{mode.badge}</span>}
                        {mode.cost && <span className="rounded-full bg-bg-elevated px-2 py-1 text-xs font-medium text-warning">{mode.cost}</span>}
                      </div>
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

      {canClaimToday && (
        <motion.div variants={itemVariants} className="mb-6">
          <Card variant="highlighted" padding="md" className="animate-pulse-glow cursor-pointer" onClick={handleClaimDailyReward}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-500/20">
                  <span className="text-2xl">🎁</span>
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-text-primary">Günlük Ödülünü Al!</h3>
                  <p className="text-xs text-text-secondary">Bugün: +{rewardPreview.xp} XP, +{rewardPreview.coins} coin</p>
                </div>
              </div>
              <Button size="sm" variant="secondary">Al</Button>
            </div>
          </Card>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <h2 className="mb-4 font-display text-xl font-bold text-text-primary">📊 İstatistiklerin</h2>
        <div className="grid grid-cols-3 gap-3">
          <Card padding="md" className="text-center">
            <div className="font-display text-2xl font-bold text-text-primary">{formatNumber(user.total_questions_answered)}</div>
            <div className="mt-1 text-xs text-text-secondary">Toplam Soru</div>
          </Card>

          <Card padding="md" className="text-center">
            <div className="font-display text-2xl font-bold text-success">{formatNumber(user.total_correct_answers)}</div>
            <div className="mt-1 text-xs text-text-secondary">Doğru Cevap</div>
          </Card>

          <Card padding="md" className="text-center">
            <div className="font-display text-2xl font-bold text-primary-500">{successRate}%</div>
            <div className="mt-1 text-xs text-text-secondary">Başarı Oranı</div>
          </Card>
        </div>
      </motion.div>

      <RewardOverlay
        isVisible={showRewardOverlay}
        xp={rewardData.xp}
        coins={rewardData.coins}
        levelUp={rewardData.levelUp}
        streakUp={rewardData.streakUp}
        streakMilestone={rewardData.streakMilestone}
        onComplete={() => setShowRewardOverlay(false)}
      />
    </motion.div>
  );
}
