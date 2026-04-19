import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateCoins, calculateLevel, calculateXP } from '@/lib/utils/game';
import { ENERGY_CONFIG } from '@/lib/constants/game';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin.from('profiles').select('*').eq('id', user.id).single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (profile.energy < ENERGY_CONFIG.cost_millionaire) {
    return NextResponse.json({ error: 'Insufficient energy' }, { status: 400 });
  }

  const nextEnergy = Math.max(0, profile.energy - ENERGY_CONFIG.cost_millionaire);

  const [{ data: updatedProfile, error: updateProfileError }, { data: session, error: sessionError }] = await Promise.all([
    admin
      .from('profiles')
      .update({ energy: nextEnergy, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('*')
      .single(),
    admin
      .from('game_sessions')
      .insert({
        user_id: user.id,
        mode: 'millionaire',
        league_scope: 'turkey',
      })
      .select('*')
      .single(),
  ]);

  if (updateProfileError || sessionError) {
    return NextResponse.json({ error: updateProfileError?.message || sessionError?.message }, { status: 500 });
  }

  return NextResponse.json({ data: { profile: updatedProfile, sessionId: session.id } });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sessionId, result, score, correctAnswers, totalAnswered, safePointReached, jokersUsed } = await request.json();

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

  const xpEarned = calculateXP(score, 'millionaire');
  const coinsEarned = calculateCoins(score, 'millionaire');
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
        jokers_used: jokersUsed ?? [],
        safe_point_reached: safePointReached,
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
