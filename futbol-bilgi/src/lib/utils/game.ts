import type { GameMode, DifficultyLevel, LevelInfo } from '@/types';
import { MILLIONAIRE_STEPS, XP_TABLE, DAILY_CHALLENGE_CONFIG } from '@/lib/constants/game';

/**
 * Calculate XP earned from a game session.
 */
export function calculateXP(score: number, mode: GameMode): number {
  switch (mode) {
    case 'millionaire': {
      // Base XP from score tiers
      if (score >= 1000000) return 500;
      if (score >= 64000) return 250;
      if (score >= 2000) return 100;
      if (score >= 100) return 25;
      return 10;
    }
    case 'quick':
      // 10 XP per correct answer (score / 100 = correct answers)
      return Math.floor(score / 100) * 10;
    case 'duel':
      // 30 XP for playing, 50 bonus for winning
      return 30;
    case 'daily':
      return DAILY_CHALLENGE_CONFIG.base_xp;
    default:
      return 0;
  }
}

/**
 * Calculate coins earned from a game session.
 */
export function calculateCoins(score: number, mode: GameMode): number {
  switch (mode) {
    case 'millionaire': {
      // Coins proportional to score
      return Math.floor(score / 100);
    }
    case 'quick':
      // 5 coins per correct answer
      return Math.floor(score / 100) * 5;
    case 'duel':
      // 20 base coins, winner gets 50
      return 20;
    case 'daily':
      return DAILY_CHALLENGE_CONFIG.base_coins;
    default:
      return 0;
  }
}

/**
 * Get the time limit for a given difficulty level (in seconds).
 */
export function getTimeLimit(difficulty: DifficultyLevel): number {
  switch (difficulty) {
    case 1: return 30;
    case 2: return 25;
    case 3: return 25;
    case 4: return 20;
    case 5: return 15;
    default: return 30;
  }
}

/**
 * Get the safe point score for a given question number in Millionaire mode.
 * Returns the points the player is guaranteed if they fail after this point.
 */
export function getSafePointScore(questionNumber: number): number {
  // Find the highest safe point at or below the given question
  let safeScore = 0;

  for (const step of MILLIONAIRE_STEPS) {
    if (step.questionNumber > questionNumber) break;
    if (step.isSafePoint) {
      safeScore = step.points;
    }
  }

  return safeScore;
}

/**
 * Calculate current level information from total XP.
 */
export function calculateLevel(totalXP: number): LevelInfo {
  let currentLevel = 1;
  let xpForCurrentLevel = 0;
  let xpToNextLevel = XP_TABLE[0].xpToNext;

  for (let i = XP_TABLE.length - 1; i >= 0; i--) {
    if (totalXP >= XP_TABLE[i].xpRequired) {
      currentLevel = XP_TABLE[i].level;
      xpForCurrentLevel = XP_TABLE[i].xpRequired;
      xpToNextLevel = XP_TABLE[i].xpToNext;
      break;
    }
  }

  const currentXP = totalXP - xpForCurrentLevel;
  const progress = Math.min(currentXP / xpToNextLevel, 1);

  return {
    level: currentLevel,
    currentXP,
    nextLevelXP: xpToNextLevel,
    progress,
  };
}

/**
 * Format large numbers for display.
 * 1000 -> "1K", 1000000 -> "1M"
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    const val = num / 1000000;
    return val % 1 === 0 ? `${val}M` : `${val.toFixed(1)}M`;
  }
  if (num >= 1000) {
    const val = num / 1000;
    return val % 1 === 0 ? `${val}K` : `${val.toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Calculate bonus coins for daily streak.
 */
export function getStreakBonus(days: number): number {
  if (days <= 0) return 0;
  // Cap at 30 days to prevent excessive rewards
  const effectiveDays = Math.min(days, 30);
  return effectiveDays * DAILY_CHALLENGE_CONFIG.streak_bonus_multiplier;
}

/**
 * Get the Millionaire step data for a given question number.
 */
export function getMillionaireStep(questionNumber: number) {
  return MILLIONAIRE_STEPS.find((s) => s.questionNumber === questionNumber) ?? null;
}

/**
 * Format time in seconds to MM:SS display.
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate accuracy percentage.
 */
export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}
