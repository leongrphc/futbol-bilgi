'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ShareButton } from '@/components/social/share-button';
import { buildFriendLeaderboardShare } from '@/lib/utils/share';
import type { AchievementTier } from '@/lib/achievements/definitions';

interface AchievementCardProps {
  name: string;
  description: string;
  tier: AchievementTier;
  progress: number;
  target: number;
  unlocked: boolean;
}

const tierVariantMap: Record<AchievementTier, 'bronze' | 'silver' | 'gold' | 'champion'> = {
  bronze: 'bronze',
  silver: 'silver',
  gold: 'gold',
  platinum: 'champion',
};

export function AchievementCard({ name, description, tier, progress, target, unlocked }: AchievementCardProps) {
  const ratio = target > 0 ? Math.min(progress / target, 1) : 0;

  return (
    <Card padding="md" variant={unlocked ? 'highlighted' : 'default'}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h4 className="font-display text-base font-bold text-text-primary">{name}</h4>
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        </div>
        <Badge variant={tierVariantMap[tier]} size="sm">{tier}</Badge>
      </div>

      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs text-text-secondary">
          <span>İlerleme</span>
          <span>{Math.min(progress, target)}/{target}</span>
        </div>
        <ProgressBar value={ratio} size="sm" variant={unlocked ? 'success' : 'default'} />
      </div>

      {unlocked ? (
        <ShareButton
          payload={buildFriendLeaderboardShare({
            title: `${name} başarımını kazandım!`,
            leaderName: name,
            leaderScore: progress,
            playerCount: target,
          })}
          label="Başarımı Paylaş"
          variant="outline"
          size="sm"
          fullWidth
        />
      ) : null}
    </Card>
  );
}
