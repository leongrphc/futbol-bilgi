import { LEAGUE_TIERS } from '@/lib/constants/game';
import type { LeagueTier } from '@/types';
import type { LeagueSeasonEntry, SeasonMovement } from './season';

export function rankLeagueEntries(entries: LeagueSeasonEntry[]): LeagueSeasonEntry[] {
  return [...entries]
    .sort((a, b) => {
      if (b.season_score !== a.season_score) return b.season_score - a.season_score;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
    })
    .map((entry, index) => ({ ...entry, final_rank: index + 1 }));
}

export function getLeagueZone(rank: number, totalPlayers: number): 'promotion' | 'relegation' | 'safe' {
  if (totalPlayers < 5) return 'safe';
  const movementCount = Math.floor(totalPlayers * 0.2);
  if (rank <= movementCount) return 'promotion';
  if (rank > totalPlayers - movementCount) return 'relegation';
  return 'safe';
}

export function getNextLeagueTier(tier: LeagueTier, movement: SeasonMovement): LeagueTier {
  const index = LEAGUE_TIERS.indexOf(tier);
  if (movement === 'promoted') {
    return LEAGUE_TIERS[Math.min(index + 1, LEAGUE_TIERS.length - 1)];
  }
  if (movement === 'relegated') {
    return LEAGUE_TIERS[Math.max(index - 1, 0)];
  }
  return tier;
}
