'use client';

import { motion } from 'framer-motion';
import { Flame, Gift, TrendingUp, CalendarCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useUserStore } from '@/lib/stores/user-store';
import { getStreakStatus, getStreakMilestoneProgress, getDailyRewardPreview } from '@/lib/utils/game';
import { cn } from '@/lib/utils/cn';

export function StreakCard() {
  const user = useUserStore((state) => state.user);

  if (!user) return null;

  const { activeStreak, isBroken, canClaimToday } = getStreakStatus(user.last_daily_claim, user.streak_days);
  const { next, progress } = getStreakMilestoneProgress(activeStreak);
  const rewardPreview = getDailyRewardPreview(user.last_daily_claim, user.streak_days);

  return (
    <Card padding="md" className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent-500/10 blur-2xl" />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              activeStreak > 0 ? "bg-accent-500/20 text-accent-500" : "bg-bg-elevated text-text-muted"
            )}>
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-text-primary">
                {activeStreak > 0 ? `${activeStreak} Günlük Seri` : 'Seri Yok'}
              </h3>
              <p className="text-xs text-text-secondary">
                {isBroken ? 'Serin bozuldu, yeniden başla!' : 'Harika gidiyorsun, bozma!'}
              </p>
            </div>
          </div>
        </div>

        {/* Milestone Progress */}
        <div className="rounded-xl bg-bg-elevated/50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-text-secondary" />
              <span className="text-xs font-medium text-text-secondary">Sonraki Dönüm Noktası</span>
            </div>
            <span className="text-xs font-bold text-text-primary">
              {activeStreak} / {next} gün
            </span>
          </div>
          <ProgressBar value={progress / 100} variant="warning" size="sm" />
        </div>

        {/* Reward Status */}
        <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-bg-elevated p-3">
          <div className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
            canClaimToday ? "bg-secondary-500/20 text-secondary-500" : "bg-success/20 text-success"
          )}>
            {canClaimToday ? <Gift className="h-4 w-4" /> : <CalendarCheck className="h-4 w-4" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-text-primary">
              {canClaimToday ? 'Bugünün ödülü seni bekliyor!' : 'Bugünün ödülü alındı'}
            </p>
            {canClaimToday ? (
              <p className="text-xs text-text-secondary">
                Ana sayfadan {rewardPreview.coins} Coin ödülünü al.
              </p>
            ) : (
              <p className="text-xs text-text-secondary">
                Yarın tekrar gel, serini devam ettir.
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
