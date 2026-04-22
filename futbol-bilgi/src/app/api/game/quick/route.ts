import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { QUICK_PLAY_CONFIG } from '@/lib/constants/game';
import { calculateLevel, calculateQuickXP } from '@/lib/utils/game';
import { getQuickModeQuestionsFromDb } from '@/lib/questions/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const leagueScope = searchParams.get('scope') === 'europe' ? 'europe' : searchParams.get('scope') === 'world' ? 'world' : 'turkey';

  const admin = createAdminClient();
  const [{ data: session, error }, questionsResult] = await Promise.all([
    admin
      .from('game_sessions')
      .insert({
        user_id: user.id,
        mode: 'quick',
        league_scope: leagueScope,
      })
      .select('*')
      .single(),
    getQuickModeQuestionsFromDb(leagueScope, QUICK_PLAY_CONFIG.total_questions),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { sessionId: session.id, questions: questionsResult } });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sessionId, result, score, correctAnswers, totalAnswered } = await request.json();

  if (!sessionId || !result) {
    return NextResponse.json({ error: 'Missing sessionId or result' }, { status: 400 });
  }

  const admin = createAdminClient();
  const [{ data: profile, error: profileError }, { data: session, error: sessionError }] = await Promise.all([
    admin.from('profiles').select('*').eq('id', user.id).single(),
    admin.from('game_sessions').select('*').eq('id', sessionId).eq('user_id', user.id).single(),
  ]);

  if (profileError || sessionError) {
    return NextResponse.json({ error: profileError?.message || sessionError?.message }, { status: 500 });
  }

  if (session.ended_at) {
    return NextResponse.json({ error: 'Session already finalized' }, { status: 400 });
  }

  const xpEarned = calculateQuickXP(correctAnswers);
  const nextXp = profile.xp + xpEarned;
  const nextLevel = calculateLevel(nextXp).level;

  const [{ data: updatedProfile, error: updateProfileError }, { data: updatedSession, error: updateSessionError }] = await Promise.all([
    admin
      .from('profiles')
      .update({
        xp: nextXp,
        level: nextLevel,
        total_questions_answered: profile.total_questions_answered + totalAnswered,
        total_correct_answers: profile.total_correct_answers + correctAnswers,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('*')
      .single(),
    admin
      .from('game_sessions')
      .update({
        ended_at: new Date().toISOString(),
        score,
        questions_answered: totalAnswered,
        correct_answers: correctAnswers,
        result,
        xp_earned: xpEarned,
        coins_earned: 0,
      })
      .eq('id', sessionId)
      .select('*')
      .single(),
  ]);

  if (updateProfileError || updateSessionError) {
    return NextResponse.json({ error: updateProfileError?.message || updateSessionError?.message }, { status: 500 });
  }

  return NextResponse.json({ data: { profile: updatedProfile, session: updatedSession, rewards: { xp: xpEarned, coins: 0 } } });
}
