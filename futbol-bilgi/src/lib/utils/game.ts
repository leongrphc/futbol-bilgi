import type { GameMode, DifficultyLevel, LevelInfo } from '@/types';
import { MILLIONAIRE_STEPS, XP_TABLE, DAILY_CHALLENGE_CONFIG, DUEL_CONFIG, GAME_CONFIG, QUICK_PLAY_CONFIG } from '@/lib/constants/game';

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
      return DUEL_CONFIG.winner_xp;
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
      return DUEL_CONFIG.winner_coins;
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
 * Get streak status based on the last claim date.
 */
export function getStreakStatus(lastClaimDateStr: string | null, currentStreakDays: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastClaimDate = lastClaimDateStr ? new Date(lastClaimDateStr) : null;
  if (lastClaimDate) {
    lastClaimDate.setHours(0, 0, 0, 0);
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isClaimedToday = lastClaimDate?.getTime() === today.getTime();
  const wasClaimedYesterday = lastClaimDate?.getTime() === yesterday.getTime();

  // If claimed today, streak is maintained.
  // If claimed yesterday, streak is waiting to be maintained today.
  // Otherwise, the streak is broken (or 0 if never claimed).
  const isBroken = !isClaimedToday && !wasClaimedYesterday && lastClaimDate !== null;
  const canClaimToday = !isClaimedToday;

  return {
    isClaimedToday,
    wasClaimedYesterday,
    isBroken,
    canClaimToday,
    activeStreak: isBroken ? 0 : currentStreakDays,
  };
}

/**
 * Determine the streak value that will be set upon a successful claim today.
 */
export function getNextStreak(lastClaimDateStr: string | null, currentStreakDays: number): number {
  const status = getStreakStatus(lastClaimDateStr, currentStreakDays);
  if (!status.canClaimToday) return currentStreakDays; // Already claimed

  // If streak was maintained yesterday, increment it. Otherwise, start fresh at 1.
  return status.wasClaimedYesterday ? currentStreakDays + 1 : 1;
}

/**
 * Preview the reward for claiming today based on the streak.
 */
export function getDailyRewardPreview(lastClaimDateStr: string | null, currentStreakDays: number) {
  const nextStreak = getNextStreak(lastClaimDateStr, currentStreakDays);

  return {
    xp: DAILY_CHALLENGE_CONFIG.base_xp,
    coins: DAILY_CHALLENGE_CONFIG.base_coins + getStreakBonus(nextStreak),
    nextStreak,
  };
}

/**
 * Calculate progress to the next streak milestone.
 */
export function getStreakMilestoneProgress(streakDays: number) {
  const milestones = [7, 30, 100, 365];
  const nextMilestone = milestones.find((m) => m > streakDays) ?? milestones[milestones.length - 1];
  const progress = Math.min((streakDays / nextMilestone) * 100, 100);

  return {
    current: streakDays,
    next: nextMilestone,
    progress,
  };
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

/**
 * Calculate duel question score from correctness and remaining time.
 */
export function calculateDuelQuestionScore(
  isCorrect: boolean,
  timeRemaining: number,
  totalTime = DUEL_CONFIG.time_per_question,
): number {
  if (!isCorrect) return 0;

  const safeTime = Math.max(0, Math.min(timeRemaining, totalTime));
  const speedBonus = Math.round((safeTime / totalTime) * DUEL_CONFIG.max_speed_bonus);
  return DUEL_CONFIG.base_points + speedBonus;
}

/**
 * Calculate ELO delta using standard expected score formula.
 */
export function calculateDuelEloDelta(
  playerElo: number,
  opponentElo: number,
  result: 1 | 0.5 | 0,
): number {
  const expectedScore = 1 / (1 + 10 ** ((opponentElo - playerElo) / 400));
  return Math.round(GAME_CONFIG.elo_k_factor * (result - expectedScore));
}

/**
 * Decide duel winner; ties are broken by lower total answer time.
 */
export function calculateDuelWinner(
  playerScore: number,
  opponentScore: number,
  playerTotalTimeMs: number,
  opponentTotalTimeMs: number,
): 'player' | 'opponent' | 'draw' {
  if (playerScore > opponentScore) return 'player';
  if (opponentScore > playerScore) return 'opponent';
  if (playerTotalTimeMs < opponentTotalTimeMs) return 'player';
  if (opponentTotalTimeMs < playerTotalTimeMs) return 'opponent';
  return 'draw';
}

/**
 * Build a nearby mock opponent ELO from the player's rating.
 */
export function generateMockOpponentElo(playerElo: number, variance = 120): number {
  const delta = Math.floor(Math.random() * (variance * 2 + 1)) - variance;
  return Math.max(800, playerElo + delta);
}

/**
 * Generate a mock opponent response profile for one question.
 */
export function generateMockOpponentResponse(difficulty: DifficultyLevel, totalTime = DUEL_CONFIG.time_per_question) {
  const accuracyChance =
    difficulty === 1 ? 0.85 :
    difficulty === 2 ? 0.75 :
    difficulty === 3 ? 0.65 :
    difficulty === 4 ? 0.52 : 0.4;

  const isCorrect = Math.random() < accuracyChance;
  const timeSpent = Math.max(2, Math.min(totalTime, Math.floor(Math.random() * (totalTime - 1)) + 2));
  const timeRemaining = totalTime - timeSpent;
  const score = calculateDuelQuestionScore(isCorrect, timeRemaining, totalTime);

  return {
    isCorrect,
    timeSpent,
    timeRemaining,
    score,
  };
}

/**
 * Sum answer times in milliseconds.
 */
export function sumAnswerTimesMs(timesInSeconds: number[]): number {
  return timesInSeconds.reduce((total, value) => total + value * 1000, 0);
}

/**
 * Calculate quick mode time bonus.
 */
export function calculateQuickTimeBonus(timeRemaining: number): number {
  return Math.max(0, timeRemaining) * QUICK_PLAY_CONFIG.time_bonus_multiplier;
}

/**
 * Calculate quick mode XP reward in the 50-200 range.
 */
export function calculateQuickXP(correctAnswers: number): number {
  if (correctAnswers >= 9) return 200;
  if (correctAnswers >= 7) return 150;
  if (correctAnswers >= 4) return 100;
  return 50;
}
