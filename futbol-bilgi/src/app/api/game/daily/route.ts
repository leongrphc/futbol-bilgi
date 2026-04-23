import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/supabase/request-auth';
import { DAILY_CHALLENGE_CONFIG } from '@/lib/constants/game';
import { calculateLevel } from '@/lib/utils/game';
import { getDailyModeQuestionsFromDb, getWorldCupEventQuestionsFromDb } from '@/lib/questions/server';

export async function POST(request: Request) {
  const { user } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const leagueScope = searchParams.get('scope') === 'europe' ? 'europe' : searchParams.get('scope') === 'world' ? 'world' : 'turkey';
  const isWorldCupEvent = searchParams.get('event') === 'world-cup';

  const admin = createAdminClient();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { data: existingSession, error: existingSessionError } = await admin
    .from('game_sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('mode', 'daily')
    .gte('created_at', startOfToday.toISOString())
    .limit(1)
    .maybeSingle();

  if (existingSessionError) {
    return NextResponse.json({ error: existingSessionError.message }, { status: 500 });
  }

  if (existingSession) {
    return NextResponse.json({ error: 'Daily challenge already started today' }, { status: 400 });
  }

  const [{ data: session, error: sessionError }, questions] = await Promise.all([
    admin
      .from('game_sessions')
      .insert({
        user_id: user.id,
        mode: 'daily',
        league_scope: leagueScope,
      })
      .select('*')
      .single(),
    isWorldCupEvent
      ? getWorldCupEventQuestionsFromDb(DAILY_CHALLENGE_CONFIG.questions)
      : getDailyModeQuestionsFromDb(leagueScope, DAILY_CHALLENGE_CONFIG.questions),
  ]);

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  return NextResponse.json({ data: { sessionId: session.id, questions } });
}

export async function PATCH(request: Request) {
  const { user } = await getAuthenticatedUser(request);

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

  const xpEarned = DAILY_CHALLENGE_CONFIG.base_xp;
  const coinsEarned = DAILY_CHALLENGE_CONFIG.base_coins;
  const nextXp = profile.xp + xpEarned;
  const nextCoins = profile.coins + coinsEarned;
  const nextLevel = calculateLevel(nextXp).level;

  const [{ data: updatedProfile, error: updateProfileError }, { data: updatedSession, error: updateSessionError }] = await Promise.all([
    admin
      .from('profiles')
      .update({
        xp: nextXp,
        coins: nextCoins,
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
        coins_earned: coinsEarned,
      })
      .eq('id', sessionId)
      .select('*')
      .single(),
  ]);

  if (updateProfileError || updateSessionError) {
    return NextResponse.json({ error: updateProfileError?.message || updateSessionError?.message }, { status: 500 });
  }

  return NextResponse.json({ data: { profile: updatedProfile, session: updatedSession, rewards: { xp: xpEarned, coins: coinsEarned } } });
}
