import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DUEL_CONFIG, ENERGY_CONFIG } from '@/lib/constants/game';
import { calculateDuelEloDelta, calculateDuelWinner, calculateLevel } from '@/lib/utils/game';

function normalizeAnswerTimeMs(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function normalizeInviteQuestionIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

async function finalizeChallengeInvite(params: {
  admin: ReturnType<typeof createAdminClient>;
  inviteId: string;
  userId: string;
  sessionId: string;
  score: number;
  correctAnswers: number;
  answerTimeMs: number;
}) {
  const { admin, inviteId, userId, sessionId, score, correctAnswers, answerTimeMs } = params;
  const { data: invite, error: inviteError } = await admin
    .from('duel_invites')
    .select('*')
    .eq('id', inviteId)
    .single();

  if (inviteError) {
    throw new Error(inviteError.message);
  }

  const isFromUser = invite.from_user_id === userId;
  const updatePayload = isFromUser
    ? {
        from_user_score: score,
        from_user_correct_answers: correctAnswers,
        from_user_answer_time_ms: answerTimeMs,
        from_user_played_at: new Date().toISOString(),
        from_user_session_id: sessionId,
        updated_at: new Date().toISOString(),
      }
    : {
        to_user_score: score,
        to_user_correct_answers: correctAnswers,
        to_user_answer_time_ms: answerTimeMs,
        to_user_played_at: new Date().toISOString(),
        to_user_session_id: sessionId,
        updated_at: new Date().toISOString(),
      };

  const { error: updateInviteError } = await admin
    .from('duel_invites')
    .update(updatePayload)
    .eq('id', inviteId);

  if (updateInviteError) {
    throw new Error(updateInviteError.message);
  }

  const refreshedInviteResponse = await admin
    .from('duel_invites')
    .select('*')
    .eq('id', inviteId)
    .single();

  if (refreshedInviteResponse.error) {
    throw new Error(refreshedInviteResponse.error.message);
  }

  const refreshedInvite = refreshedInviteResponse.data;
  const bothPlayed = refreshedInvite.from_user_score !== null && refreshedInvite.to_user_score !== null;

  if (!bothPlayed) {
    return { invite: refreshedInvite, duelResult: null as 'win' | 'loss' | 'draw' | null, eloDelta: 0 };
  }

  const winner = calculateDuelWinner(
    refreshedInvite.from_user_score,
    refreshedInvite.to_user_score,
    normalizeAnswerTimeMs(refreshedInvite.from_user_answer_time_ms),
    normalizeAnswerTimeMs(refreshedInvite.to_user_answer_time_ms),
  );

  const winnerUserId = winner === 'player'
    ? refreshedInvite.from_user_id
    : winner === 'opponent'
      ? refreshedInvite.to_user_id
      : null;

  const completedAt = new Date().toISOString();
  const { error: completeInviteError } = await admin
    .from('duel_invites')
    .update({
      status: 'completed',
      winner_user_id: winnerUserId,
      completed_at: completedAt,
      updated_at: completedAt,
    })
    .eq('id', inviteId);

  if (completeInviteError) {
    throw new Error(completeInviteError.message);
  }

  const loserUserId = winnerUserId === null
    ? null
    : winnerUserId === refreshedInvite.from_user_id
      ? refreshedInvite.to_user_id
      : refreshedInvite.from_user_id;

  if (winnerUserId) {
    const [{ data: winnerProfile }, { data: loserProfile }] = await Promise.all([
      admin.from('profiles').select('username').eq('id', winnerUserId).single(),
      loserUserId ? admin.from('profiles').select('username').eq('id', loserUserId).single() : Promise.resolve({ data: null }),
    ]);

    await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: winnerUserId,
          title: 'Challenge tamamlandı',
          body: `${loserProfile?.username ?? 'Rakibin'} karşısında challenge'ı kazandın.`,
          url: '/profile',
          type: 'duel_result',
        }),
      }).catch(() => null),
      loserUserId
        ? fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/notifications/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: loserUserId,
              title: 'Challenge sonucu hazır',
              body: `${winnerProfile?.username ?? 'Rakibin'} challenge'ı kazandı. Sonucu profilinden görebilirsin.`,
              url: '/profile',
              type: 'duel_result',
            }),
          }).catch(() => null)
        : Promise.resolve(null),
    ]);
  }

  const userDuelResult: 'win' | 'loss' | 'draw' = winnerUserId === null ? 'draw' : winnerUserId === userId ? 'win' : 'loss';
  const opponentUserId = refreshedInvite.from_user_id === userId ? refreshedInvite.to_user_id : refreshedInvite.from_user_id;
  const { data: opponentProfile, error: opponentProfileError } = await admin
    .from('profiles')
    .select('elo_rating')
    .eq('id', opponentUserId)
    .single();

  if (opponentProfileError) {
    throw new Error(opponentProfileError.message);
  }

  const { data: currentProfile, error: currentProfileError } = await admin
    .from('profiles')
    .select('elo_rating')
    .eq('id', userId)
    .single();

  if (currentProfileError) {
    throw new Error(currentProfileError.message);
  }

  const duelScore = userDuelResult === 'win' ? 1 : userDuelResult === 'draw' ? 0.5 : 0;
  const eloDelta = calculateDuelEloDelta(currentProfile.elo_rating, opponentProfile.elo_rating, duelScore);
  return { invite: refreshedInvite, duelResult: userDuelResult, eloDelta };
}

async function maybeApplyChallengeRewards(params: {
  admin: ReturnType<typeof createAdminClient>;
  profile: {
    id: string;
    xp: number;
    coins: number;
    level: number;
    elo_rating: number;
    total_questions_answered: number;
    total_correct_answers: number;
  };
  totalAnswered: number;
  correctAnswers: number;
  duelResult: 'win' | 'loss' | 'draw';
  eloDelta: number;
}) {
  const { admin, profile, totalAnswered, correctAnswers, duelResult, eloDelta } = params;
  const xpEarned = duelResult === 'win' ? DUEL_CONFIG.winner_xp : 0;
  const coinsEarned = duelResult === 'win' ? DUEL_CONFIG.winner_coins : 0;
  const nextXp = profile.xp + xpEarned;
  const nextLevel = calculateLevel(nextXp).level;

  const { data: updatedProfile, error: updateProfileError } = await admin
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
    .eq('id', profile.id)
    .select('*')
    .single();

  if (updateProfileError) {
    throw new Error(updateProfileError.message);
  }

  return { updatedProfile, xpEarned, coinsEarned };
}

async function fetchChallengeInviteData(admin: ReturnType<typeof createAdminClient>, inviteId: string, userId: string) {
  const { data: invite, error: inviteError } = await admin
    .from('duel_invites')
    .select('*')
    .eq('id', inviteId)
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .single();

  if (inviteError) {
    throw new Error(inviteError.message);
  }

  return invite;
}

async function fetchChallengeOpponent(admin: ReturnType<typeof createAdminClient>, invite: Record<string, unknown>, userId: string) {
  const opponentId = invite.from_user_id === userId ? invite.to_user_id : invite.from_user_id;
  const { data: opponentProfile, error: opponentProfileError } = await admin
    .from('profiles')
    .select('id, username, elo_rating')
    .eq('id', opponentId)
    .single();

  if (opponentProfileError) {
    throw new Error(opponentProfileError.message);
  }

  return opponentProfile;
}

async function createDuelSession(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: session, error: sessionError } = await admin
    .from('game_sessions')
    .insert({ user_id: userId, mode: 'duel', league_scope: 'turkey' })
    .select('*')
    .single();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  return session;
}

async function spendDuelEnergy(admin: ReturnType<typeof createAdminClient>, profile: Record<string, unknown>, userId: string) {
  const nextEnergy = Math.max(0, Number(profile.energy) - ENERGY_CONFIG.cost_duel);
  const { data: updatedProfile, error: updateProfileError } = await admin
    .from('profiles')
    .update({ energy: nextEnergy, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('*')
    .single();

  if (updateProfileError) {
    throw new Error(updateProfileError.message);
  }

  return updatedProfile;
}

async function createStandardDuel(admin: ReturnType<typeof createAdminClient>, profile: Record<string, unknown>, userId: string) {
  const [{ data: updatedProfile, error: updateProfileError }, { data: session, error: sessionError }] = await Promise.all([
    admin
      .from('profiles')
      .update({ energy: Math.max(0, Number(profile.energy) - ENERGY_CONFIG.cost_duel), updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('*')
      .single(),
    admin
      .from('game_sessions')
      .insert({ user_id: userId, mode: 'duel', league_scope: 'turkey' })
      .select('*')
      .single(),
  ]);

  if (updateProfileError || sessionError) {
    throw new Error(updateProfileError?.message || sessionError?.message);
  }

  return { updatedProfile, session };
}

async function finalizeStandardDuel(params: {
  admin: ReturnType<typeof createAdminClient>;
  profile: Record<string, unknown>;
  sessionId: string;
  userId: string;
  result: 'win' | 'loss' | 'draw';
  score: number;
  correctAnswers: number;
  totalAnswered: number;
  opponentElo: number;
}) {
  const { admin, profile, sessionId, userId, result, score, correctAnswers, totalAnswered, opponentElo } = params;
  const duelScore = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
  const eloDelta = calculateDuelEloDelta(Number(profile.elo_rating), opponentElo, duelScore);
  const xpEarned = result === 'win' ? DUEL_CONFIG.winner_xp : 0;
  const coinsEarned = result === 'win' ? DUEL_CONFIG.winner_coins : 0;
  const nextXp = Number(profile.xp) + xpEarned;
  const nextLevel = calculateLevel(nextXp).level;

  const [{ data: updatedProfile, error: updateProfileError }, { data: updatedSession, error: updateSessionError }] = await Promise.all([
    admin
      .from('profiles')
      .update({
        xp: nextXp,
        coins: Number(profile.coins) + coinsEarned,
        level: nextLevel,
        elo_rating: Number(profile.elo_rating) + eloDelta,
        total_questions_answered: Number(profile.total_questions_answered) + totalAnswered,
        total_correct_answers: Number(profile.total_correct_answers) + correctAnswers,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
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
    throw new Error(updateProfileError?.message || updateSessionError?.message);
  }

  return { updatedProfile, updatedSession, xpEarned, coinsEarned, eloDelta };
}

async function updateDuelSession(admin: ReturnType<typeof createAdminClient>, sessionId: string, score: number, correctAnswers: number, totalAnswered: number, result: 'win' | 'loss' | 'draw') {
  const { data: updatedSession, error: updateSessionError } = await admin
    .from('game_sessions')
    .update({
      ended_at: new Date().toISOString(),
      score,
      questions_answered: totalAnswered,
      correct_answers: correctAnswers,
      result,
    })
    .eq('id', sessionId)
    .select('*')
    .single();

  if (updateSessionError) {
    throw new Error(updateSessionError.message);
  }

  return updatedSession;
}

async function fetchDuelSession(admin: ReturnType<typeof createAdminClient>, sessionId: string, userId: string) {
  const { data: session, error: sessionError } = await admin
    .from('game_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  return session;
}

async function fetchUserProfile(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return profile;
}

async function fetchChallengeQuestions(admin: ReturnType<typeof createAdminClient>, inviteId: string, userId: string) {
  const invite = await fetchChallengeInviteData(admin, inviteId, userId);
  const opponent = await fetchChallengeOpponent(admin, invite, userId);
  const questionIds = normalizeInviteQuestionIds(invite.question_ids);

  return { invite, opponent, questionIds };
}

async function buildChallengeStartPayload(admin: ReturnType<typeof createAdminClient>, userId: string, inviteId: string, profile: Record<string, unknown>) {
  const updatedProfile = await spendDuelEnergy(admin, profile, userId);
  const session = await createDuelSession(admin, userId);
  const { invite, opponent, questionIds } = await fetchChallengeQuestions(admin, inviteId, userId);

  return {
    profile: updatedProfile,
    sessionId: session.id,
    inviteId: invite.id,
    opponent,
    questionIds,
  };
}

async function buildChallengeFinalizePayload(params: {
  admin: ReturnType<typeof createAdminClient>;
  userId: string;
  inviteId: string;
  sessionId: string;
  profile: Record<string, unknown>;
  score: number;
  correctAnswers: number;
  totalAnswered: number;
  answerTimeMs: number;
}) {
  const { admin, userId, inviteId, sessionId, profile, score, correctAnswers, totalAnswered, answerTimeMs } = params;
  const { duelResult, eloDelta } = await finalizeChallengeInvite({
    admin,
    inviteId,
    userId,
    sessionId,
    score,
    correctAnswers,
    answerTimeMs,
  });

  if (!duelResult) {
    const session = await updateDuelSession(admin, sessionId, score, correctAnswers, totalAnswered, 'draw');
    return {
      profile,
      session,
      rewards: { xp: 0, coins: 0, eloDelta: 0 },
      inviteStatus: 'waiting' as const,
      duelResult: 'draw' as const,
    };
  }

  const { updatedProfile, xpEarned, coinsEarned } = await maybeApplyChallengeRewards({
    admin,
    profile: {
      id: String(profile.id),
      xp: Number(profile.xp),
      coins: Number(profile.coins),
      level: Number(profile.level),
      elo_rating: Number(profile.elo_rating),
      total_questions_answered: Number(profile.total_questions_answered),
      total_correct_answers: Number(profile.total_correct_answers),
    },
    totalAnswered,
    correctAnswers,
    duelResult,
    eloDelta,
  });

  const session = await updateDuelSession(admin, sessionId, score, correctAnswers, totalAnswered, duelResult);

  return {
    profile: updatedProfile,
    session,
    rewards: { xp: xpEarned, coins: coinsEarned, eloDelta },
    inviteStatus: 'completed' as const,
    duelResult,
  };
}

async function buildStandardStartPayload(admin: ReturnType<typeof createAdminClient>, profile: Record<string, unknown>, userId: string) {
  const { updatedProfile, session } = await createStandardDuel(admin, profile, userId);
  return { profile: updatedProfile, sessionId: session.id };
}

async function buildStandardFinalizePayload(params: {
  admin: ReturnType<typeof createAdminClient>;
  profile: Record<string, unknown>;
  sessionId: string;
  userId: string;
  result: 'win' | 'loss' | 'draw';
  score: number;
  correctAnswers: number;
  totalAnswered: number;
  opponentElo: number;
}) {
  return finalizeStandardDuel(params);
}

function isChallengeStartPayload(value: unknown): value is { inviteId: string } {
  return typeof value === 'object' && value !== null && typeof (value as { inviteId?: unknown }).inviteId === 'string';
}

function isChallengeFinalizePayload(value: unknown): value is { inviteId: string; answerTimeMs: number } {
  return typeof value === 'object' && value !== null && typeof (value as { inviteId?: unknown }).inviteId === 'string';
}

function getChallengeResult(result: 'win' | 'loss' | 'draw', inviteStatus: 'waiting' | 'completed') {
  return inviteStatus === 'waiting' ? 'draw' : result;
}

function getChallengeRewards(rewards: { xp: number; coins: number; eloDelta: number }, inviteStatus: 'waiting' | 'completed') {
  return inviteStatus === 'waiting' ? { xp: 0, coins: 0, eloDelta: 0 } : rewards;
}

function getChallengeOpponentPayload(opponent: { id: string; username: string; elo_rating: number }) {
  return {
    id: opponent.id,
    username: opponent.username,
    elo: opponent.elo_rating,
  };
}

function getChallengeQuestionIdsPayload(questionIds: string[]) {
  return questionIds;
}

function normalizeChallengeAnswerTimeMs(answerTimeMs: unknown) {
  return typeof answerTimeMs === 'number' && Number.isFinite(answerTimeMs) ? Math.max(0, Math.round(answerTimeMs)) : 0;
}

function normalizePatchResult(result: unknown): 'win' | 'loss' | 'draw' {
  return result === 'win' || result === 'loss' || result === 'draw' ? result : 'draw';
}

function normalizeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function normalizePatchPayload(payload: Record<string, unknown>) {
  return {
    sessionId: normalizeString(payload.sessionId),
    result: normalizePatchResult(payload.result),
    score: normalizeNumber(payload.score),
    correctAnswers: normalizeNumber(payload.correctAnswers),
    totalAnswered: normalizeNumber(payload.totalAnswered),
    opponentElo: normalizeNumber(payload.opponentElo),
    inviteId: typeof payload.inviteId === 'string' ? payload.inviteId : null,
    answerTimeMs: normalizeChallengeAnswerTimeMs(payload.answerTimeMs),
  };
}

function normalizeStartPayload(payload: unknown) {
  return typeof payload === 'object' && payload !== null ? payload as Record<string, unknown> : {};
}

function isSessionFinalized(session: Record<string, unknown>) {
  return Boolean(session.ended_at);
}

function hasEnoughEnergy(profile: Record<string, unknown>) {
  return Number(profile.energy) >= ENERGY_CONFIG.cost_duel;
}

function getProfileId(profile: Record<string, unknown>) {
  return String(profile.id);
}

function getProfileStats(profile: Record<string, unknown>) {
  return {
    xp: Number(profile.xp),
    coins: Number(profile.coins),
    level: Number(profile.level),
    elo_rating: Number(profile.elo_rating),
    total_questions_answered: Number(profile.total_questions_answered),
    total_correct_answers: Number(profile.total_correct_answers),
  };
}

function toErrorResponse(error: unknown) {
  return NextResponse.json({ error: error instanceof Error ? error.message : 'Düello işlemi başarısız oldu.' }, { status: 500 });
}

function toUnauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function toInsufficientEnergyResponse() {
  return NextResponse.json({ error: 'Insufficient energy' }, { status: 400 });
}

function toMissingPatchPayloadResponse() {
  return NextResponse.json({ error: 'Missing sessionId, result, or opponentElo' }, { status: 400 });
}

function toChallengeStartResponse(data: {
  profile: Record<string, unknown>;
  sessionId: string;
  inviteId: string;
  opponent: { id: string; username: string; elo_rating: number };
  questionIds: string[];
}) {
  return NextResponse.json({
    data: {
      profile: data.profile,
      sessionId: data.sessionId,
      inviteId: data.inviteId,
      opponent: getChallengeOpponentPayload(data.opponent),
      questionIds: getChallengeQuestionIdsPayload(data.questionIds),
    },
  });
}

function toStandardStartResponse(data: { profile: Record<string, unknown>; sessionId: string }) {
  return NextResponse.json({ data });
}

function toPatchResponse(data: {
  profile: Record<string, unknown>;
  session: Record<string, unknown>;
  rewards: { xp: number; coins: number; eloDelta: number };
  inviteStatus?: 'waiting' | 'completed';
  duelResult?: 'win' | 'loss' | 'draw';
}) {
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return toUnauthorizedResponse();
    }

    const body = normalizeStartPayload(await request.json().catch(() => ({})));
    const admin = createAdminClient();
    const profile = await fetchUserProfile(admin, user.id);

    if (!hasEnoughEnergy(profile)) {
      return toInsufficientEnergyResponse();
    }

    if (isChallengeStartPayload(body)) {
      const data = await buildChallengeStartPayload(admin, user.id, body.inviteId, profile);
      return toChallengeStartResponse(data);
    }

    const data = await buildStandardStartPayload(admin, profile, user.id);
    return toStandardStartResponse(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return toUnauthorizedResponse();
    }

    const payload = normalizePatchPayload(await request.json());
    if (!payload.sessionId) {
      return toMissingPatchPayloadResponse();
    }

    const admin = createAdminClient();
    const [profile, session] = await Promise.all([
      fetchUserProfile(admin, user.id),
      fetchDuelSession(admin, payload.sessionId, user.id),
    ]);

    if (isSessionFinalized(session)) {
      return NextResponse.json({ error: 'Session already finalized' }, { status: 400 });
    }

    if (payload.inviteId) {
      const data = await buildChallengeFinalizePayload({
        admin,
        userId: user.id,
        inviteId: payload.inviteId,
        sessionId: payload.sessionId,
        profile,
        score: payload.score,
        correctAnswers: payload.correctAnswers,
        totalAnswered: payload.totalAnswered,
        answerTimeMs: payload.answerTimeMs,
      });

      return toPatchResponse({
        profile: data.profile,
        session: data.session,
        rewards: getChallengeRewards(data.rewards, data.inviteStatus),
        inviteStatus: data.inviteStatus,
        duelResult: getChallengeResult(data.duelResult, data.inviteStatus),
      });
    }

    const data = await buildStandardFinalizePayload({
      admin,
      profile,
      sessionId: payload.sessionId,
      userId: user.id,
      result: payload.result,
      score: payload.score,
      correctAnswers: payload.correctAnswers,
      totalAnswered: payload.totalAnswered,
      opponentElo: payload.opponentElo,
    });

    return toPatchResponse({
      profile: data.updatedProfile,
      session: data.updatedSession,
      rewards: { xp: data.xpEarned, coins: data.coinsEarned, eloDelta: data.eloDelta },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

