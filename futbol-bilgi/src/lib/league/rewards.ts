import type { LeagueTier } from '@/types';

export function getSeasonRewards(tier: LeagueTier) {
  switch (tier) {
    case 'champion':
      return { coins: 500, gems: 30, themeKey: 'champion-night', badgeKey: 'champion-finalist' };
    case 'diamond':
      return { coins: 350, gems: 15, themeKey: 'diamond-flare', badgeKey: 'diamond-climber' };
    case 'gold':
      return { coins: 220, gems: 5, themeKey: 'gold-glow', badgeKey: 'gold-runner' };
    case 'silver':
      return { coins: 140, gems: 0, themeKey: null, badgeKey: 'silver-streak' };
    case 'bronze':
    default:
      return { coins: 80, gems: 0, themeKey: null, badgeKey: 'bronze-starter' };
  }
}
