'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShareButton } from '@/components/social/share-button';
import { buildFriendLeaderboardShare } from '@/lib/utils/share';
import { LEAGUE_TIER_CONFIG } from '@/lib/constants/game';
import type { LeagueTier } from '@/types';

interface SeasonalRow {
  userId: string;
  username: string;
  tier: LeagueTier;
  rank: number;
  seasonScore: number;
  zone: 'promotion' | 'relegation' | 'safe';
  isCurrentUser?: boolean;
}

export function SeasonalLeaderboard({ rows }: { rows: SeasonalRow[] }) {
  return (
    <Card padding="lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-text-primary">Sezon Sıralaması</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">Puan {'>'} Galibiyet {'>'} Güncelleme</span>
          <ShareButton
            payload={buildFriendLeaderboardShare({
              title: 'Haftalık Lig Sıralamam',
              leaderName: rows[0]?.username ?? 'Oyuncu',
              leaderScore: rows[0]?.seasonScore ?? 0,
              playerCount: rows.length,
            })}
            label="Paylaş"
            variant="ghost"
            size="sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.userId} className="flex items-center gap-3 rounded-xl bg-bg-primary/50 p-3">
            <div className="w-8 text-center font-display text-lg font-bold text-text-secondary">{row.rank}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-text-primary">
                {row.username} {row.isCurrentUser ? <span className="text-primary-500">(Sen)</span> : null}
              </p>
              <p className="text-xs text-text-secondary">{LEAGUE_TIER_CONFIG[row.tier].icon} {LEAGUE_TIER_CONFIG[row.tier].name}</p>
            </div>
            <Badge variant={row.zone === 'promotion' ? 'success' : row.zone === 'relegation' ? 'danger' : 'default'} size="sm">
              {row.zone === 'promotion' ? 'Terfi' : row.zone === 'relegation' ? 'Düşme' : 'Güvenli'}
            </Badge>
            <div className="font-mono text-sm font-bold text-text-primary">{row.seasonScore}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
