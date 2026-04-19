import type { LeagueTier } from '@/types';

export type SeasonStatus = 'upcoming' | 'active' | 'finalized';
export type SeasonMovement = 'promoted' | 'stayed' | 'relegated';

export interface LeagueSeason {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: SeasonStatus;
}

export interface LeagueSeasonEntry {
  user_id: string;
  season_id: string;
  tier_at_start: LeagueTier;
  season_score: number;
  wins: number;
  draws: number;
  losses: number;
  final_rank: number | null;
  movement: SeasonMovement;
  reward_coins: number;
  reward_gems: number;
  reward_theme_key: string | null;
  reward_badge_key: string | null;
  updated_at: string;
}
