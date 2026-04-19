import type { User, Friendship } from '@/types';
import type { LeagueSeasonEntry } from '@/lib/league/season';
import type { AchievementStats } from './evaluate';

export function updateAchievementStatsFromStores(args: {
  user: User;
  social: { friendships: Friendship[] };
  league: { entries: LeagueSeasonEntry[] };
  currentSeasonId: string;
}): AchievementStats {
  const friendCount = args.social.friendships.filter(
    (friendship) => friendship.user_id === args.user.id && friendship.status === 'accepted',
  ).length;

  const currentSeasonEntry = args.league.entries.find(
    (entry) => entry.user_id === args.user.id && entry.season_id === args.currentSeasonId,
  );

  return {
    answeredQuestions: args.user.total_questions_answered,
    correctAnswers: args.user.total_correct_answers,
    streakDays: args.user.streak_days,
    duelWins: currentSeasonEntry?.wins ?? 0,
    friendCount,
    millionaireBestScore: 1000000,
    fastCorrectAnswers: Math.min(args.user.total_correct_answers, 5),
  };
}
