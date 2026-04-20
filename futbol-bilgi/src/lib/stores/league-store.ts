import { create } from 'zustand';
import type { LeagueTier, User } from '@/types';
import type { LeagueSeason, LeagueSeasonEntry } from '@/lib/league/season';

interface LeagueState {
  currentSeason: LeagueSeason | null;
  currentSeasonLoaded: boolean;
  entries: LeagueSeasonEntry[];
  loading: boolean;
}

interface LeagueActions {
  fetchCurrentSeason: () => Promise<void>;
  fetchEntries: (seasonId?: string, tier?: LeagueTier) => Promise<void>;
  ensurePlayerEntry: (userId: string, tier: LeagueTier) => Promise<void>;
  recordDuelResult: (userId: string, tier: LeagueTier, result: 'win' | 'draw' | 'loss') => Promise<void>;
  finalizeSeasonForTier: (tier: LeagueTier) => Promise<{ entries: LeagueSeasonEntry[]; profile: User }>;
}

export const useLeagueStore = create<LeagueState & LeagueActions>()((set, get) => ({
  currentSeason: null,
  currentSeasonLoaded: false,
  entries: [],
  loading: false,

  fetchCurrentSeason: async () => {
    try {
      const response = await fetch('/api/league/season');
      const json = await response.json();
      set({ currentSeason: json.data ?? null, currentSeasonLoaded: true });
    } catch (error) {
      console.error('Failed to fetch current season:', error);
      set({ currentSeason: null, currentSeasonLoaded: true });
    }
  },

  fetchEntries: async (seasonId, tier) => {
    try {
      set({ loading: true });
      const params = new URLSearchParams();
      if (seasonId) params.set('season_id', seasonId);
      if (tier) params.set('tier', tier);

      const response = await fetch(`/api/league/entries?${params}`);
      const json = await response.json();
      if (json.data) {
        set({ entries: json.data });
      }
    } catch (error) {
      console.error('Failed to fetch entries:', error);
    } finally {
      set({ loading: false });
    }
  },

  ensurePlayerEntry: async (userId, tier) => {
    let state = get();
    if (!state.currentSeasonLoaded) {
      await get().fetchCurrentSeason();
      state = get();
    }

    if (!state.currentSeason) return;

    const exists = state.entries.some(
      (entry) => entry.user_id === userId && entry.season_id === state.currentSeason?.id,
    );

    if (exists) return;

    try {
      const response = await fetch('/api/league/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, tier }),
      });

      const json = await response.json();
      if (json.data) {
        set((current) => ({
          entries: [...current.entries, json.data],
        }));
      }
    } catch (error) {
      console.error('Failed to create entry:', error);
    }
  },

  recordDuelResult: async (userId, tier, result) => {
    await get().ensurePlayerEntry(userId, tier);

    try {
      const response = await fetch('/api/league/record-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, tier, result }),
      });

      if (response.ok) {
        // Refresh entries
        const state = get();
        if (state.currentSeason) {
          await get().fetchEntries(state.currentSeason.id);
        }
      }
    } catch (error) {
      console.error('Failed to record duel result:', error);
    }
  },

  finalizeSeasonForTier: async (tier) => {
    const state = get();
    if (!state.currentSeason) {
      throw new Error('Aktif sezon bulunamadı.');
    }

    const response = await fetch('/api/league/finalize-season', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ season_id: state.currentSeason.id, tier }),
    });

    const json = await response.json();

    if (!response.ok || !json.data) {
      throw new Error(json.error ?? 'Sezon finalizasyonu başarısız oldu.');
    }

    set({ entries: json.data.entries });
    return json.data;
  },
}));
