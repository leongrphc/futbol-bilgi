import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/guard';

interface GeneratedQuestionDraft {
  league_scope: string;
  league: string;
  category: string;
  sub_category: string;
  difficulty: number;
  season_range: string;
  team_tags: string[];
  era_tag: string;
  question_text: string;
  options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  is_active: boolean;
}

function buildGeneratedQuestions(topic: string, leagueScope: string, difficulty: number, count: number): GeneratedQuestionDraft[] {
  return Array.from({ length: count }, (_, index) => {
    const sequence = index + 1;
    return {
      league_scope: leagueScope,
      league: leagueScope === 'europe' ? 'champions_league' : leagueScope === 'world' ? 'world_cup' : 'super_lig',
      category: leagueScope === 'world' ? 'Milli Takım' : 'Avrupa',
      sub_category: topic,
      difficulty,
      season_range: leagueScope === 'world' ? '1930-2025' : '1992-2025',
      team_tags: [topic],
      era_tag: difficulty >= 4 ? 'classic' : 'modern',
      question_text: `${topic} odaklı örnek AI soru ${sequence}: bu taslak editör onayı ile yayına alınmalıdır.`,
      options: [
        { key: 'A', text: `${topic} Seçenek A ${sequence}` },
        { key: 'B', text: `${topic} Seçenek B ${sequence}` },
        { key: 'C', text: `${topic} Seçenek C ${sequence}` },
        { key: 'D', text: `${topic} Seçenek D ${sequence}` },
      ],
      correct_answer: 'A',
      explanation: `${topic} için AI destekli ilk taslak açıklaması. Editör tarafından doğrulanmadan yayınlanmamalıdır.`,
      is_active: false,
    };
  });
}

export async function POST(request: Request) {
  await requireAdmin();

  const { topic, league_scope, difficulty, count } = await request.json();

  if (typeof topic !== 'string' || !topic.trim()) {
    return NextResponse.json({ error: 'Konu gerekli.' }, { status: 400 });
  }

  const safeLeagueScope = league_scope === 'europe' || league_scope === 'world' ? league_scope : 'turkey';
  const safeDifficulty = typeof difficulty === 'number' ? Math.max(1, Math.min(5, difficulty)) : 3;
  const safeCount = typeof count === 'number' ? Math.max(1, Math.min(5, count)) : 3;

  const drafts = buildGeneratedQuestions(topic.trim(), safeLeagueScope, safeDifficulty, safeCount);
  return NextResponse.json({ data: drafts });
}
