import type { DifficultyLevel, LeagueScope, Question, QuestionMedia, QuestionOption, QuestionStats } from '@/types';
import { createAdminClient } from '@/lib/supabase/admin';

interface QuestionRow {
  id: string;
  league_scope: LeagueScope;
  league: string | null;
  category: string;
  sub_category: string | null;
  difficulty: DifficultyLevel;
  season_range: string | null;
  team_tags: string[] | null;
  era_tag: string | null;
  question_text: string;
  options: unknown;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string | null;
  media: unknown;
  times_shown: number | null;
  times_correct: number | null;
  avg_answer_time_ms: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function mapQuestionOptions(value: unknown): QuestionOption[] {
  if (Array.isArray(value)) {
    return value
      .map((option) => {
        if (!option || typeof option !== 'object') return null;
        const key = String((option as { key?: unknown }).key ?? '').toUpperCase();
        const text = String((option as { text?: unknown }).text ?? '').trim();
        if (!['A', 'B', 'C', 'D'].includes(key) || !text) return null;
        return { key: key as 'A' | 'B' | 'C' | 'D', text };
      })
      .filter(Boolean) as QuestionOption[];
  }

  if (value && typeof value === 'object') {
    return ['A', 'B', 'C', 'D']
      .map((key) => {
        const text = String((value as Record<string, unknown>)[key] ?? '').trim();
        return text ? { key: key as 'A' | 'B' | 'C' | 'D', text } : null;
      })
      .filter(Boolean) as QuestionOption[];
  }

  return [];
}

function mapQuestionMedia(value: unknown): QuestionMedia | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const type = String((value as Record<string, unknown>).type ?? '').trim();
  const url = String((value as Record<string, unknown>).url ?? '').trim();
  const alt = String((value as Record<string, unknown>).alt ?? '').trim();

  if ((type === 'image' || type === 'video') && url) {
    return {
      type,
      url,
      ...(alt ? { alt } : {}),
    };
  }

  return null;
}

function mapQuestionStats(row: QuestionRow): QuestionStats {
  return {
    times_shown: Number(row.times_shown ?? 0),
    times_correct: Number(row.times_correct ?? 0),
    avg_answer_time_ms: Number(row.avg_answer_time_ms ?? 0),
  };
}

function mapQuestionRow(row: QuestionRow): Question {
  return {
    id: row.id,
    league_scope: row.league_scope,
    league: row.league ?? 'unknown_league',
    category: row.category,
    sub_category: row.sub_category ?? '',
    difficulty: row.difficulty,
    season_range: row.season_range ?? '',
    team_tags: row.team_tags ?? [],
    era_tag: row.era_tag,
    question_text: row.question_text,
    options: mapQuestionOptions(row.options),
    correct_answer: row.correct_answer,
    explanation: row.explanation ?? '',
    media: mapQuestionMedia(row.media),
    stats: mapQuestionStats(row),
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function getQuestionsByDifficultyPlan(leagueScope: LeagueScope, difficultyPlan: DifficultyLevel[]) {
  const admin = createAdminClient();
  const selectedQuestions: Question[] = [];
  const usedIds = new Set<string>();

  for (const difficulty of difficultyPlan) {
    const { data, error } = await admin
      .from('questions')
      .select('*')
      .eq('is_active', true)
      .eq('league_scope', leagueScope)
      .eq('difficulty', difficulty)
      .limit(40);

    if (error) {
      throw new Error(error.message);
    }

    const pool = ((data ?? []) as QuestionRow[])
      .map(mapQuestionRow)
      .filter((question) => question.options.length === 4 && !usedIds.has(question.id));

    if (pool.length === 0) {
      continue;
    }

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    usedIds.add(chosen.id);
    selectedQuestions.push(chosen);
  }

  if (selectedQuestions.length >= difficultyPlan.length) {
    return selectedQuestions.slice(0, difficultyPlan.length);
  }

  const { data: fallbackData, error: fallbackError } = await admin
    .from('questions')
    .select('*')
    .eq('is_active', true)
    .eq('league_scope', leagueScope)
    .limit(100);

  if (fallbackError) {
    throw new Error(fallbackError.message);
  }

  const fallbackPool = ((fallbackData ?? []) as QuestionRow[])
    .map(mapQuestionRow)
    .filter((question) => question.options.length === 4 && !usedIds.has(question.id));

  for (const question of fallbackPool) {
    if (selectedQuestions.length >= difficultyPlan.length) break;
    usedIds.add(question.id);
    selectedQuestions.push(question);
  }

  return selectedQuestions.slice(0, difficultyPlan.length);
}

export async function getQuickModeQuestionsFromDb(leagueScope: LeagueScope, totalQuestions: number) {
  const difficultyPlan: DifficultyLevel[] = totalQuestions <= 5 ? [1, 2, 2, 3, 4] : [1, 1, 2, 2, 3, 3, 4, 4, 5, 5];
  return getQuestionsByDifficultyPlan(leagueScope, difficultyPlan.slice(0, totalQuestions));
}

export async function getDailyModeQuestionsFromDb(leagueScope: LeagueScope, totalQuestions: number) {
  const difficultyPlan: DifficultyLevel[] = totalQuestions <= 5 ? [1, 2, 3, 3, 4] : [1, 1, 2, 2, 3, 3, 4, 4, 5, 5];
  return getQuestionsByDifficultyPlan(leagueScope, difficultyPlan.slice(0, totalQuestions));
}

export async function getWorldCupEventQuestionsFromDb(totalQuestions: number) {
  const difficultyPlan: DifficultyLevel[] = totalQuestions <= 5 ? [2, 3, 3, 4, 5] : [1, 2, 2, 3, 3, 4, 4, 5, 5, 5];
  return getQuestionsByDifficultyPlan('world', difficultyPlan.slice(0, totalQuestions));
}

export async function getMillionaireQuestionsFromDb(leagueScope: LeagueScope, difficultyPlan: DifficultyLevel[]) {
  return getQuestionsByDifficultyPlan(leagueScope, difficultyPlan);
}

export async function getTournamentRoundQuestionsFromDb(leagueScope: LeagueScope, round: number, questionsPerRound: number) {
  const roundPlans: Record<number, DifficultyLevel[]> = {
    1: [1, 2, 2, 3],
    2: [2, 3, 3, 4],
    3: [3, 4, 4, 5],
  };

  const fallbackPlan: DifficultyLevel[] = [1, 2, 3, 4];
  const difficultyPlan = (roundPlans[round] ?? fallbackPlan).slice(0, questionsPerRound);
  return getQuestionsByDifficultyPlan(leagueScope, difficultyPlan);
}


export async function getQuestionsByIdsFromDb(questionIds: string[]) {
  if (questionIds.length === 0) {
    return [] as Question[];
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('questions')
    .select('*')
    .in('id', questionIds);

  if (error) {
    throw new Error(error.message);
  }

  const byId = new Map(((data ?? []) as QuestionRow[]).map((row) => [row.id, mapQuestionRow(row)]));
  return questionIds.map((id) => byId.get(id)).filter(Boolean) as Question[];
}

export async function getDuelQuestionsFromDb(leagueScope: LeagueScope, totalQuestions: number) {
  const difficultyPlan: DifficultyLevel[] = totalQuestions <= 5 ? [1, 2, 3, 4, 5] : [1, 1, 2, 3, 3, 4, 4, 5, 5, 5];
  return getQuestionsByDifficultyPlan(leagueScope, difficultyPlan.slice(0, totalQuestions));
}

export async function getDuelChallengeQuestionIdsFromDb(leagueScope: LeagueScope, totalQuestions: number) {
  const questions = await getDuelQuestionsFromDb(leagueScope, totalQuestions);
  return questions.map((question) => question.id);
}

export async function getDuelChallengeQuestionsFromDb(questionIds: string[]) {
  return getQuestionsByIdsFromDb(questionIds);
}

export async function getDuelQuestionPayload(leagueScope: LeagueScope, totalQuestions: number) {
  const questions = await getDuelQuestionsFromDb(leagueScope, totalQuestions);
  return {
    questions,
    questionIds: questions.map((question) => question.id),
  };
}

export async function getDuelChallengePayload(questionIds: string[]) {
  const questions = await getQuestionsByIdsFromDb(questionIds);
  return {
    questions,
    questionIds: questions.map((question) => question.id),
  };
}

export type { QuestionRow };
export { mapQuestionRow };

export async function getTournamentQuestionSetForEntry(entryId: string, leagueScope: LeagueScope, round: number, questionsPerRound: number) {
  const admin = createAdminClient();
  const { data: existingAnswers, error: answersError } = await admin
    .from('question_answers')
    .select('question_id')
    .eq('session_id', entryId)
    .limit(100);

  if (answersError) {
    throw new Error(answersError.message);
  }

  const usedIds = new Set((existingAnswers ?? []).map((answer) => String(answer.question_id)));
  const questions = await getTournamentRoundQuestionsFromDb(leagueScope, round, questionsPerRound);
  return questions.filter((question) => !usedIds.has(question.id)).slice(0, questionsPerRound);
}
