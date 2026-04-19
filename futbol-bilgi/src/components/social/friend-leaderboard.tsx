'use client';

import { Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import type { LeagueTier } from '@/types';
import { LEAGUE_TIER_CONFIG } from '@/lib/constants/game';

interface FriendLeaderboardEntry {
  id: string;
  username: string;
  avatar_url: string | null;
  avatar_frame: string | null;
  league_tier: LeagueTier;
  score: number;
  isCurrentUser?: boolean;
}

interface FriendLeaderboardProps {
  entries: FriendLeaderboardEntry[];
}

export function FriendLeaderboard({ entries }: FriendLeaderboardProps) {
  return (
    <Card padding="lg">
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-secondary-500" />
        <h3 className="font-display text-lg font-semibold text-text-primary">Arkadaş Sıralaması</h3>
      </div>

      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-text-secondary">Arkadaş eklendiğinde mini sıralama burada görünecek.</p>
        ) : (
          entries.map((entry, index) => (
            <div key={entry.id} className="flex items-center gap-3 rounded-xl bg-bg-primary/50 p-3">
              <div className="w-6 text-center font-display text-lg font-bold text-text-secondary">{index + 1}</div>
              <Avatar
                src={entry.avatar_url}
                fallback={entry.username}
                frame={entry.avatar_frame}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">
                  {entry.username} {entry.isCurrentUser ? <span className="text-primary-500">(Sen)</span> : null}
                </p>
                <p className="text-xs text-text-secondary">
                  {LEAGUE_TIER_CONFIG[entry.league_tier].icon} {LEAGUE_TIER_CONFIG[entry.league_tier].name}
                </p>
              </div>
              <div className="text-right font-mono text-sm font-bold text-text-primary">{entry.score.toLocaleString()}</div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
