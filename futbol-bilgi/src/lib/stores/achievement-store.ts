import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ACHIEVEMENT_DEFINITIONS } from '@/lib/achievements/definitions';
import { evaluateAchievementProgress, type AchievementStats } from '@/lib/achievements/evaluate';

interface UnlockedAchievement {
  key: string;
  unlockedAt: string;
}

interface AchievementState {
  progress: Record<string, number>;
  unlocked: UnlockedAchievement[];
  newlyUnlocked: string[];
  stats: AchievementStats;
}

interface AchievementActions {
  updateStats: (partial: Partial<AchievementStats>) => void;
  evaluate: () => Array<{ key: string; rewardCoins: number; rewardGems: number; rewardXp: number }>;
  clearNewlyUnlocked: () => void;
}

const initialStats: AchievementStats = {
  answeredQuestions: 0,
  correctAnswers: 0,
  streakDays: 0,
  duelWins: 0,
  friendCount: 0,
  millionaireBestScore: 0,
  fastCorrectAnswers: 0,
};

export const useAchievementStore = create<AchievementState & AchievementActions>()(
  persist(
    (set, get) => ({
      progress: {},
      unlocked: [],
      newlyUnlocked: [],
      stats: initialStats,

      updateStats: (partial) => {
        set((state) => ({
          stats: { ...state.stats, ...partial },
        }));
      },

      evaluate: () => {
        const state = get();
        const evaluated = evaluateAchievementProgress(state.stats);
        const unlocks = evaluated.filter((item) => item.unlocked && !state.unlocked.some((unlocked) => unlocked.key === item.key));

        if (unlocks.length === 0) {
          set({
            progress: Object.fromEntries(evaluated.map((item) => [item.key, item.progress])),
          });
          return [];
        }

        const rewards = unlocks.map((unlock) => {
          const definition = ACHIEVEMENT_DEFINITIONS.find((item) => item.key === unlock.key)!;
          return {
            key: unlock.key,
            rewardCoins: definition.rewardCoins,
            rewardGems: definition.rewardGems,
            rewardXp: definition.rewardXp,
          };
        });

        set((current) => ({
          progress: Object.fromEntries(evaluated.map((item) => [item.key, item.progress])),
          unlocked: [
            ...current.unlocked,
            ...unlocks.map((item) => ({ key: item.key, unlockedAt: new Date().toISOString() })),
          ],
          newlyUnlocked: unlocks.map((item) => item.key),
        }));

        return rewards;
      },

      clearNewlyUnlocked: () => {
        set({ newlyUnlocked: [] });
      },
    }),
    {
      name: 'futbol-bilgi-achievements',
      partialize: (state) => ({
        progress: state.progress,
        unlocked: state.unlocked,
        newlyUnlocked: state.newlyUnlocked,
        stats: state.stats,
      }),
    },
  ),
);
