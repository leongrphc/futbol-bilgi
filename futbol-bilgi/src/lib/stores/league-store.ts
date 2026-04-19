import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LeagueTier } from '@/types';
import type { LeagueSeason, LeagueSeasonEntry, SeasonMovement } from '@/lib/league/season';
import { getSeasonRewards } from '@/lib/league/rewards';
import { getLeagueZone, getNextLeagueTier, rankLeagueEntries } from '@/lib/league/ranking';

interface LeagueState {
  currentSeason: LeagueSeason;
  entries: LeagueSeasonEntry[];
}

interface LeagueActions {
  ensurePlayerEntry: (userId: string, tier: LeagueTier) => void;
  recordDuelResult: (userId: string, tier: LeagueTier, result: 'win' | 'draw' | 'loss') => void;
  finalizeSeasonForTier: (tier: LeagueTier) => Array<{ userId: string; nextTier: LeagueTier; movement: SeasonMovement; rewards: ReturnType<typeof getSeasonRewards> }>;
}

const now = new Date();
const seasonStart = new Date(now);
seasonStart.setHours(0, 0, 0, 0);
const seasonEnd = new Date(seasonStart);
seasonEnd.setDate(seasonEnd.getDate() + 7);

const initialSeason: LeagueSeason = {
  id: `season_${seasonStart.toISOString().slice(0, 10)}`,
  name: 'Haftalık Lig',
  starts_at: seasonStart.toISOString(),
  ends_at: seasonEnd.toISOString(),
  status: 'active',
};

export const useLeagueStore = create<LeagueState & LeagueActions>()(
  persist(
    (set, get) => ({
      currentSeason: initialSeason,
      entries: [],

      ensurePlayerEntry: (userId, tier) => {
        const state = get();
        const exists = state.entries.some(
          (entry) => entry.user_id === userId && entry.season_id === state.currentSeason.id,
        );

        if (exists) return;

        set((current) => ({
          entries: [
            ...current.entries,
            {
              user_id: userId,
              season_id: current.currentSeason.id,
              tier_at_start: tier,
              season_score: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              final_rank: null,
              movement: 'stayed',
              reward_coins: 0,
              reward_gems: 0,
              reward_theme_key: null,
              reward_badge_key: null,
              updated_at: new Date().toISOString(),
            },
          ],
        }));
      },

      recordDuelResult: (userId, tier, result) => {
        get().ensurePlayerEntry(userId, tier);

        set((state) => ({
          entries: state.entries.map((entry) => {
            if (entry.user_id !== userId || entry.season_id !== state.currentSeason.id) {
              return entry;
            }

            return {
              ...entry,
              season_score: entry.season_score + (result === 'win' ? 3 : result === 'draw' ? 1 : 0),
              wins: entry.wins + (result === 'win' ? 1 : 0),
              draws: entry.draws + (result === 'draw' ? 1 : 0),
              losses: entry.losses + (result === 'loss' ? 1 : 0),
              updated_at: new Date().toISOString(),
            };
          }),
        }));
      },

      finalizeSeasonForTier: (tier) => {
        const state = get();
        const tierEntries = rankLeagueEntries(
          state.entries.filter((entry) => entry.season_id === state.currentSeason.id && entry.tier_at_start === tier),
        );

        const results = tierEntries.map((entry) => {
          const zone = getLeagueZone(entry.final_rank ?? tierEntries.length, tierEntries.length);
          const movement: SeasonMovement =
            zone === 'promotion' && tier !== 'champion'
              ? 'promoted'
              : zone === 'relegation' && tier !== 'bronze'
                ? 'relegated'
                : 'stayed';
          const rewards = getSeasonRewards(tier);
          return {
            userId: entry.user_id,
            nextTier: getNextLeagueTier(tier, movement),
            movement,
            rewards,
          };
        });

        set((current) => ({
          entries: current.entries.map((entry) => {
            const result = results.find((item) => item.userId === entry.user_id);
            if (!result || entry.season_id !== current.currentSeason.id || entry.tier_at_start !== tier) {
              return entry;
            }

            return {
              ...entry,
              movement: result.movement,
              reward_coins: result.rewards.coins,
              reward_gems: result.rewards.gems,
              reward_theme_key: result.rewards.themeKey,
              reward_badge_key: result.rewards.badgeKey,
            };
          }),
        }));

        return results;
      },
    }),
    {
      name: 'futbol-bilgi-league',
      partialize: (state) => ({
        currentSeason: state.currentSeason,
        entries: state.entries,
      }),
    },
  ),
);
