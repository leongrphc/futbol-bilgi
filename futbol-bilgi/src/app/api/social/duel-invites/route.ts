import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDuelChallengeQuestionIds } from '@/lib/data/mock-questions';
import type { DuelInvite, Friendship, User } from '@/types';
import type { SocialProfile } from '@/lib/stores/social-store';

interface SocialSnapshot {
  profiles: SocialProfile[];
  friendships: Friendship[];
  duelInvites: DuelInvite[];
}

async function getSocialSnapshot(userId: string): Promise<SocialSnapshot> {
  const admin = createAdminClient();
  const [{ data: friendships }, { data: duelInvites }] = await Promise.all([
    admin.from('friendships').select('id, user_id, friend_id, status, created_at, updated_at').or(`user_id.eq.${userId},friend_id.eq.${userId}`),
    admin.from('duel_invites').select('id, from_user_id, to_user_id, status, question_ids, from_user_score, to_user_score, from_user_correct_answers, to_user_correct_answers, from_user_answer_time_ms, to_user_answer_time_ms, from_user_played_at, to_user_played_at, from_user_session_id, to_user_session_id, winner_user_id, completed_at, created_at, updated_at, responded_at').or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`).order('created_at', { ascending: false }),
  ]);

  const profileIds = new Set<string>([userId]);
  for (const friendship of friendships ?? []) {
    profileIds.add(friendship.user_id);
    profileIds.add(friendship.friend_id);
  }
  for (const invite of duelInvites ?? []) {
    profileIds.add(invite.from_user_id);
    profileIds.add(invite.to_user_id);
  }

  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, username, avatar_url, avatar_frame, favorite_team, league_tier, elo_rating, xp, last_seen_at')
    .in('id', [...profileIds]);

  if (error) {
    throw new Error(error.message);
  }

  return {
    profiles: (profiles ?? []).map((profile) => ({
      id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      avatar_frame: profile.avatar_frame,
      favorite_team: profile.favorite_team,
      league_tier: profile.league_tier as User['league_tier'],
      elo_rating: profile.elo_rating,
      score: profile.xp,
      last_seen_at: profile.last_seen_at,
    })),
    friendships: (friendships ?? []) as Friendship[],
    duelInvites: (duelInvites ?? []) as DuelInvite[],
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { toUserId } = await request.json();
  if (typeof toUserId !== 'string') {
    return NextResponse.json({ error: 'Hedef kullanıcı gerekli.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: friendships, error: friendshipsError } = await admin
    .from('friendships')
    .select('user_id, friend_id, status')
    .eq('user_id', user.id)
    .eq('friend_id', toUserId)
    .eq('status', 'accepted');

  if (friendshipsError) {
    return NextResponse.json({ error: friendshipsError.message }, { status: 500 });
  }

  if (!friendships || friendships.length === 0) {
    return NextResponse.json({ error: 'Sadece arkadaşlarına düello daveti gönderebilirsin.' }, { status: 400 });
  }

  const { data: existingInvite, error: existingInviteError } = await admin
    .from('duel_invites')
    .select('id')
    .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${toUserId},status.eq.pending),and(from_user_id.eq.${toUserId},to_user_id.eq.${user.id},status.eq.pending)`)
    .maybeSingle();

  if (existingInviteError) {
    return NextResponse.json({ error: existingInviteError.message }, { status: 500 });
  }

  if (existingInvite) {
    return NextResponse.json({ error: 'Bu arkadaşın için zaten bekleyen bir düello daveti var.' }, { status: 400 });
  }

  const { error: insertError } = await admin
    .from('duel_invites')
    .insert({
      from_user_id: user.id,
      to_user_id: toUserId,
      status: 'pending',
      question_ids: getDuelChallengeQuestionIds(),
    });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ data: await getSocialSnapshot(user.id) });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { inviteId, action } = await request.json();
  if (typeof inviteId !== 'string' || !['accept', 'reject', 'cancel'].includes(action)) {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: invite, error: inviteError } = await admin
    .from('duel_invites')
    .select('*')
    .eq('id', inviteId)
    .single();

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  const isRecipientAction = action === 'accept' || action === 'reject';
  if (isRecipientAction && invite.to_user_id !== user.id) {
    return NextResponse.json({ error: 'Bu daveti yalnızca alıcı yanıtlayabilir.' }, { status: 403 });
  }

  if (action === 'cancel' && invite.from_user_id !== user.id) {
    return NextResponse.json({ error: 'Bu daveti yalnızca gönderen iptal edebilir.' }, { status: 403 });
  }

  const nextStatus = action === 'accept' ? 'accepted' : action === 'reject' ? 'declined' : 'cancelled';
  const { error: updateError } = await admin
    .from('duel_invites')
    .update({ status: nextStatus, responded_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', inviteId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ data: await getSocialSnapshot(user.id) });
}
