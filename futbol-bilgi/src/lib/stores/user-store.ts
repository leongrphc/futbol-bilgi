import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserSettings, LeagueTier } from '@/types';
import { calculateLevel } from '@/lib/utils/game';

// ==========================================
// User Store State
// ==========================================

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ==========================================
// User Store Actions
// ==========================================

interface UserActions {
  // Auth
  setUser: (user: User) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  refreshUser: () => Promise<void>;

  // Currency
  updateCoins: (amount: number) => void;
  updateGems: (amount: number) => void;

  // Energy
  updateEnergy: (amount: number) => void;
  refillEnergy: () => void;

  // XP & Level
  addXP: (amount: number) => void;

  // Profile
  updateUsername: (username: string) => void;
  updateAvatar: (url: string) => void;
  updateAvatarFrame: (frame: string) => void;
  updateFavoriteTeam: (team: string) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;

  // Stats
  incrementQuestionsAnswered: (correct: boolean) => void;
  updateStreak: (days: number) => void;
  updateLeagueTier: (tier: LeagueTier) => void;
  updateEloRating: (rating: number) => void;
}

export type UserStore = UserState & UserActions;

// ==========================================
// Default Settings
// ==========================================

const defaultSettings: UserSettings = {
  sound_enabled: true,
  music_enabled: true,
  vibration_enabled: true,
  notifications_enabled: true,
  language: 'tr',
  theme: 'dark',
};

interface ThemeShopPayload {
  shopItems: User['shop_items'];
  inventory: User['inventory'];
}

async function fetchThemeData(): Promise<ThemeShopPayload> {
  const response = await fetch('/api/shop/themes');

  if (!response.ok) {
    return { shopItems: [], inventory: [] };
  }

  const json = await response.json();
  return json.data ?? { shopItems: [], inventory: [] };
}

// ==========================================
// Zustand Store with Persistence
// ==========================================

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: true,

      // Auth
      setUser: (user) => {
        set({
          user: {
            ...user,
            settings: { ...defaultSettings, ...user.settings },
          },
          isAuthenticated: true,
          isLoading: false,
        });
      },

      clearUser: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      refreshUser: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const [profileResponse, themeData] = await Promise.all([
            fetch('/api/me'),
            fetchThemeData(),
          ]);

          if (!profileResponse.ok) {
            return;
          }

          const json = await profileResponse.json();
          if (!json.data) {
            return;
          }

          set({
            user: {
              ...user,
              ...json.data,
              settings: { ...defaultSettings, ...(json.data.settings ?? {}) },
              inventory: themeData.inventory,
              shop_items: themeData.shopItems,
            },
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to refresh user:', error);
        }
      },

      // Currency
      updateCoins: (amount) => {
        const { user } = get();
        if (!user) return;
        set({
          user: { ...user, coins: Math.max(0, user.coins + amount) },
        });
      },

      updateGems: (amount) => {
        const { user } = get();
        if (!user) return;
        set({
          user: { ...user, gems: Math.max(0, user.gems + amount) },
        });
      },

      // Energy
      updateEnergy: (amount) => {
        const { user } = get();
        if (!user) return;
        set({
          user: {
            ...user,
            energy: Math.max(0, Math.min(5, user.energy + amount)),
          },
        });
      },

      refillEnergy: () => {
        const { user } = get();
        if (!user) return;
        set({
          user: {
            ...user,
            energy: 5,
            energy_last_refill: new Date().toISOString(),
          },
        });
      },

      // XP & Level
      addXP: (amount) => {
        const { user } = get();
        if (!user) return;
        const newTotalXP = user.xp + amount;
        const { level } = calculateLevel(newTotalXP);
        set({
          user: {
            ...user,
            xp: newTotalXP,
            level,
          },
        });
      },

      // Profile
      updateUsername: (username) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, username } });
      },

      updateAvatar: (url) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, avatar_url: url } });
      },

      updateAvatarFrame: (frame) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, avatar_frame: frame } });
      },

      updateFavoriteTeam: (team) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, favorite_team: team } });
      },

      updateSettings: (newSettings) => {
        const { user } = get();
        if (!user) return;
        set({
          user: {
            ...user,
            settings: { ...user.settings, ...newSettings },
          },
        });
      },

      // Stats
      incrementQuestionsAnswered: (correct) => {
        const { user } = get();
        if (!user) return;
        set({
          user: {
            ...user,
            total_questions_answered: user.total_questions_answered + 1,
            total_correct_answers: correct
              ? user.total_correct_answers + 1
              : user.total_correct_answers,
          },
        });
      },

      updateStreak: (days) => {
        const { user } = get();
        if (!user) return;
        set({
          user: {
            ...user,
            streak_days: days,
            last_daily_claim: new Date().toISOString(),
          },
        });
      },

      updateLeagueTier: (tier) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, league_tier: tier } });
      },

      updateEloRating: (rating) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, elo_rating: rating } });
      },
    }),
    {
      name: 'futbol-bilgi-user',
      // Only persist specific fields to avoid stale data
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
