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
      category: leagueScope === 'world' ? 'Milli Takım' : leagueScope === 'europe' ? 'Avrupa Kupaları' : 'Türkiye',
      sub_category: topic,
      difficulty,
      season_range: leagueScope === 'world' ? '1930-2025' : '1992-2025',
      team_tags: [topic],
      era_tag: difficulty >= 4 ? 'classic' : 'modern',
      question_text: `Mock taslak ${sequence}: ${topic} konusunda editör doğrulaması bekleyen soru metni.`,
      options: [
        { key: 'A', text: `${topic} için seçenek A ${sequence}` },
        { key: 'B', text: `${topic} için seçenek B ${sequence}` },
        { key: 'C', text: `${topic} için seçenek C ${sequence}` },
        { key: 'D', text: `${topic} için seçenek D ${sequence}` },
      ],
      correct_answer: 'A',
      explanation: `Bu kayıt gerçek AI çıktısı değil, editoryal kontrol için üretilmiş mock taslaktır. ${topic} bilgisini doğruladıktan sonra yayına al.`,
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

  const safeTopic = topic.trim();
  if (safeTopic.length < 3) {
    return NextResponse.json({ error: 'Konu en az 3 karakter olmalı.' }, { status: 400 });
  }

  if (safeTopic.length > 80) {
    return NextResponse.json({ error: 'Konu en fazla 80 karakter olabilir.' }, { status: 400 });
  }

  const safeLeagueScope = league_scope === 'europe' || league_scope === 'world' ? league_scope : 'turkey';
  const safeDifficulty = typeof difficulty === 'number' ? Math.max(1, Math.min(5, difficulty)) : 3;
  const safeCount = typeof count === 'number' ? Math.max(1, Math.min(5, count)) : 3;

  const drafts = buildGeneratedQuestions(safeTopic, safeLeagueScope, safeDifficulty, safeCount);
  return NextResponse.json({
    data: drafts,
    meta: {
      source: 'mock',
      review_required: true,
    },
  });
}
