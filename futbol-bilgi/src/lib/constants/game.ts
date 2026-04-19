import type { MillionaireStep, JokerType, LeagueTier } from '@/types';

// ==========================================
// Millionaire Mode — 15-Step Progression
// ==========================================

export const MILLIONAIRE_STEPS: MillionaireStep[] = [
  // Easy — Difficulty 1, 30s
  { questionNumber: 1,  points: 100,     difficulty: 1, isSafePoint: false, timeLimit: 30 },
  { questionNumber: 2,  points: 200,     difficulty: 1, isSafePoint: false, timeLimit: 30 },
  { questionNumber: 3,  points: 500,     difficulty: 1, isSafePoint: false, timeLimit: 30 },

  // Medium — Difficulty 2, 25s
  { questionNumber: 4,  points: 1000,    difficulty: 2, isSafePoint: false, timeLimit: 25 },
  { questionNumber: 5,  points: 2000,    difficulty: 2, isSafePoint: true,  timeLimit: 25 }, // Safe Point 1

  // Hard — Difficulty 3, 25s
  { questionNumber: 6,  points: 4000,    difficulty: 3, isSafePoint: false, timeLimit: 25 },
  { questionNumber: 7,  points: 8000,    difficulty: 3, isSafePoint: false, timeLimit: 25 },

  // Expert — Difficulty 4, 20s
  { questionNumber: 8,  points: 16000,   difficulty: 4, isSafePoint: false, timeLimit: 20 },
  { questionNumber: 9,  points: 32000,   difficulty: 4, isSafePoint: false, timeLimit: 20 },
  { questionNumber: 10, points: 64000,   difficulty: 4, isSafePoint: true,  timeLimit: 20 }, // Safe Point 2

  // Expert+ — Difficulty 4, 20s
  { questionNumber: 11, points: 125000,  difficulty: 4, isSafePoint: false, timeLimit: 20 },
  { questionNumber: 12, points: 250000,  difficulty: 4, isSafePoint: false, timeLimit: 20 },

  // Legend — Difficulty 5, 15s
  { questionNumber: 13, points: 500000,  difficulty: 5, isSafePoint: false, timeLimit: 15 },
  { questionNumber: 14, points: 750000,  difficulty: 5, isSafePoint: false, timeLimit: 15 },
  { questionNumber: 15, points: 1000000, difficulty: 5, isSafePoint: false, timeLimit: 15 },
];

// ==========================================
// Joker Costs (in coins)
// ==========================================

export const JOKER_COSTS: Record<JokerType, number> = {
  fifty_fifty: 50,
  audience: 75,
  phone: 100,
  freeze_time: 60,
  skip: 120,
  double_answer: 80,
};

// ==========================================
// Joker Display Names
// ==========================================

export const JOKER_NAMES: Record<JokerType, string> = {
  fifty_fifty: 'Yarı Yarıya',
  audience: 'Seyirci',
  phone: 'Telefon',
  freeze_time: 'Süre Dondur',
  skip: 'Pas Geç',
  double_answer: 'Çift Cevap',
};

// ==========================================
// XP Table — Level Progression
// ==========================================

export interface XPLevelRange {
  level: number;
  xpRequired: number; // Total XP to reach this level
  xpToNext: number;   // XP needed from this level to next
}

export const XP_TABLE: XPLevelRange[] = [
  { level: 1,  xpRequired: 0,      xpToNext: 100 },
  { level: 2,  xpRequired: 100,    xpToNext: 150 },
  { level: 3,  xpRequired: 250,    xpToNext: 200 },
  { level: 4,  xpRequired: 450,    xpToNext: 300 },
  { level: 5,  xpRequired: 750,    xpToNext: 400 },
  { level: 6,  xpRequired: 1150,   xpToNext: 500 },
  { level: 7,  xpRequired: 1650,   xpToNext: 650 },
  { level: 8,  xpRequired: 2300,   xpToNext: 800 },
  { level: 9,  xpRequired: 3100,   xpToNext: 1000 },
  { level: 10, xpRequired: 4100,   xpToNext: 1200 },
  { level: 11, xpRequired: 5300,   xpToNext: 1500 },
  { level: 12, xpRequired: 6800,   xpToNext: 1800 },
  { level: 13, xpRequired: 8600,   xpToNext: 2100 },
  { level: 14, xpRequired: 10700,  xpToNext: 2500 },
  { level: 15, xpRequired: 13200,  xpToNext: 3000 },
  { level: 16, xpRequired: 16200,  xpToNext: 3500 },
  { level: 17, xpRequired: 19700,  xpToNext: 4000 },
  { level: 18, xpRequired: 23700,  xpToNext: 4500 },
  { level: 19, xpRequired: 28200,  xpToNext: 5000 },
  { level: 20, xpRequired: 33200,  xpToNext: 6000 },
  { level: 21, xpRequired: 39200,  xpToNext: 7000 },
  { level: 22, xpRequired: 46200,  xpToNext: 8000 },
  { level: 23, xpRequired: 54200,  xpToNext: 9000 },
  { level: 24, xpRequired: 63200,  xpToNext: 10000 },
  { level: 25, xpRequired: 73200,  xpToNext: 12000 },
  { level: 26, xpRequired: 85200,  xpToNext: 14000 },
  { level: 27, xpRequired: 99200,  xpToNext: 16000 },
  { level: 28, xpRequired: 115200, xpToNext: 18000 },
  { level: 29, xpRequired: 133200, xpToNext: 20000 },
  { level: 30, xpRequired: 153200, xpToNext: 25000 },
];

// ==========================================
// Energy System
// ==========================================

export const ENERGY_CONFIG = {
  max: 5,
  refill_minutes: 20,
  cost_millionaire: 1,
  cost_quick: 0,
  cost_duel: 1,
  cost_daily: 0,
} as const;

// ==========================================
// League Tiers
// ==========================================

export const LEAGUE_TIERS: LeagueTier[] = [
  'bronze',
  'silver',
  'gold',
  'diamond',
  'champion',
];

export const LEAGUE_TIER_CONFIG: Record<LeagueTier, { name: string; minElo: number; icon: string }> = {
  bronze:   { name: 'Bronz Lig',    minElo: 0,    icon: '🥉' },
  silver:   { name: 'Gumus Lig',    minElo: 800,  icon: '🥈' },
  gold:     { name: 'Altin Lig',    minElo: 1200, icon: '🥇' },
  diamond:  { name: 'Elmas Lig',    minElo: 1600, icon: '💎' },
  champion: { name: 'Sampiyon Lig', minElo: 2000, icon: '🏆' },
};

// ==========================================
// Quick Play Mode
// ==========================================

export const QUICK_PLAY_CONFIG = {
  total_questions: 10,
  total_time: 120, // seconds
  points_per_correct: 100,
  time_bonus_multiplier: 2, // bonus per second remaining
} as const;

// ==========================================
// Daily Challenge
// ==========================================

export const DAILY_CHALLENGE_CONFIG = {
  questions: 5,
  streak_bonus_multiplier: 25, // extra coins per streak day
  base_xp: 50,
  base_coins: 100,
} as const;

// ==========================================
// Duel Mode
// ==========================================

export const DUEL_CONFIG = {
  total_questions: 5,
  time_per_question: 15,
  base_points: 100,
  max_speed_bonus: 50,
  winner_xp: 200,
  winner_coins: 50,
  energy_cost: ENERGY_CONFIG.cost_duel,
} as const;

// ==========================================
// General Game Settings
// ==========================================

export const GAME_CONFIG = {
  max_level: 30,
  answer_keys: ['A', 'B', 'C', 'D'] as const,
  default_league_scope: 'turkey' as const,
  elo_k_factor: 32, // for duel ELO calculation
  min_username_length: 3,
  max_username_length: 20,
} as const;
