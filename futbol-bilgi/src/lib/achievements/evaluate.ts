import { ACHIEVEMENT_DEFINITIONS } from './definitions';

export interface AchievementStats {
  answeredQuestions: number;
  correctAnswers: number;
  streakDays: number;
  duelWins: number;
  friendCount: number;
  millionaireBestScore: number;
  fastCorrectAnswers: number;
}

export function evaluateAchievementProgress(stats: AchievementStats) {
  return ACHIEVEMENT_DEFINITIONS.map((achievement) => {
    let progress = 0;

    switch (achievement.key) {
      case 'ilk_adim':
        progress = stats.answeredQuestions;
        break;
      case 'mukemmel_10':
      case 'bilgi_krali':
        progress = stats.correctAnswers;
        break;
      case 'streak_ustasi':
        progress = stats.streakDays;
        break;
      case 'duello_sampiyonu':
        progress = stats.duelWins;
        break;
      case 'sosyal_kelebek':
        progress = stats.friendCount;
        break;
      case 'milyoner':
        progress = stats.millionaireBestScore;
        break;
      case 'hiz_seytani':
        progress = stats.fastCorrectAnswers;
        break;
      default:
        progress = 0;
    }

    return {
      key: achievement.key,
      progress,
      target: achievement.target,
      unlocked: progress >= achievement.target,
    };
  });
}
