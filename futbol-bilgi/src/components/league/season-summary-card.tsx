'use client';

import { Trophy, Clock3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LEAGUE_TIER_CONFIG } from '@/lib/constants/game';
import type { LeagueTier } from '@/types';

interface SeasonSummaryCardProps {
  tier: LeagueTier;
  rank: number | null;
  totalPlayers: number;
  seasonScore: number;
  endsAt: string;
  zone: 'promotion' | 'relegation' | 'safe';
}

export function SeasonSummaryCard({ tier, rank, totalPlayers, seasonScore, endsAt, zone }: SeasonSummaryCardProps) {
  const tierConfig = LEAGUE_TIER_CONFIG[tier];
  const zoneLabel = zone === 'promotion' ? 'Terfi Hattı' : zone === 'relegation' ? 'Düşme Hattı' : 'Güvende';
  const zoneVariant = zone === 'promotion' ? 'success' : zone === 'relegation' ? 'danger' : 'default';

  return (
    <Card padding="lg" variant="highlighted">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-secondary-500" />
          <h3 className="font-display text-lg font-semibold text-text-primary">Haftalık Lig</h3>
        </div>
        <Badge variant={zoneVariant} size="sm">{zoneLabel}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-text-secondary">Aktif Lig</p>
          <p className="mt-1 font-display text-lg font-bold text-text-primary">{tierConfig.icon} {tierConfig.name}</p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">Sıra</p>
          <p className="mt-1 font-display text-lg font-bold text-text-primary">{rank ? `${rank}/${totalPlayers}` : '-'}</p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">Sezon Puanı</p>
          <p className="mt-1 font-display text-lg font-bold text-primary-500">{seasonScore}</p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">Bitiş</p>
          <p className="mt-1 flex items-center gap-1 text-sm font-medium text-text-primary"><Clock3 className="h-4 w-4" />{new Date(endsAt).toLocaleDateString('tr-TR')}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-bg-primary/60 p-3 text-sm text-text-secondary">
        {zone === 'promotion' ? (
          <span className="flex items-center gap-2 text-success"><ArrowUpRight className="h-4 w-4" />Bu hafta terfi hattındasın.</span>
        ) : zone === 'relegation' ? (
          <span className="flex items-center gap-2 text-danger"><ArrowDownRight className="h-4 w-4" />Düşme hattından çıkmak için daha fazla puan topla.</span>
        ) : (
          <span>Ligini koruyorsun. Birkaç galibiyetle terfi hattına yaklaşabilirsin.</span>
        )}
      </div>
    </Card>
  );
}
