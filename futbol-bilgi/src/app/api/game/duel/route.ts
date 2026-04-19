import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DUEL_CONFIG, ENERGY_CONFIG } from '@/lib/constants/game';
import { calculateDuelEloDelta, calculateLevel } from '@/lib/utils/game';

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

  if (profile.energy < ENERGY_CONFIG.cost_duel) {
    return NextResponse.json({ error: 'Insufficient energy' }, { status: 400 });
  }

  const nextEnergy = Math.max(0, profile.energy - ENERGY_CONFIG.cost_duel);

  const [{ data: updatedProfile, error: updateProfileError }, { data: session, error: sessionError }] = await Promise.all([
    admin
      .from('profiles')
      .update({ energy: nextEnergy, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('*')
      .single(),
    admin
      .from('game_sessions')
      .insert({ user_id: user.id, mode: 'duel', league_scope: 'turkey' })
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

  const { sessionId, result, score, correctAnswers, totalAnswered, opponentElo } = await request.json();

  if (!sessionId || !result || typeof opponentElo !== 'number') {
    return NextResponse.json({ error: 'Missing sessionId, result, or opponentElo' }, { status: 400 });
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

  const duelScore = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
  const eloDelta = calculateDuelEloDelta(profile.elo_rating, opponentElo, duelScore);
  const xpEarned = result === 'win' ? DUEL_CONFIG.winner_xp : 0;
  const coinsEarned = result === 'win' ? DUEL_CONFIG.winner_coins : 0;
  const nextXp = profile.xp + xpEarned;
  const nextLevel = calculateLevel(nextXp).level;

  const [{ data: updatedProfile, error: updateProfileError }, { data: updatedSession, error: updateSessionError }] = await Promise.all([
    admin
      .from('profiles')
      .update({
        xp: nextXp,
        coins: profile.coins + coinsEarned,
        level: nextLevel,
        elo_rating: profile.elo_rating + eloDelta,
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

  return NextResponse.json({ data: { profile: updatedProfile, session: updatedSession, rewards: { xp: xpEarned, coins: coinsEarned, eloDelta } } });
}
