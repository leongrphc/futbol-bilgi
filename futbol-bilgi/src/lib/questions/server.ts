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

export async function getQuickModeQuestionsFromDb(leagueScope: LeagueScope, totalQuestions: number) {
  const admin = createAdminClient();
  const difficultyPlan: DifficultyLevel[] = totalQuestions <= 5 ? [1, 2, 2, 3, 4] : [1, 1, 2, 2, 3, 3, 4, 4, 5, 5];
  const selectedQuestions: Question[] = [];
  const usedIds = new Set<string>();

  for (const difficulty of difficultyPlan.slice(0, totalQuestions)) {
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

  if (selectedQuestions.length >= totalQuestions) {
    return selectedQuestions.slice(0, totalQuestions);
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
    if (selectedQuestions.length >= totalQuestions) break;
    usedIds.add(question.id);
    selectedQuestions.push(question);
  }

  return selectedQuestions.slice(0, totalQuestions);
}
