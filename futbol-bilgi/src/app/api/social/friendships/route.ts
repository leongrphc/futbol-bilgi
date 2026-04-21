import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { DuelInvite, Friendship, User } from '@/types';
import type { SocialProfile } from '@/lib/stores/social-store';

interface SocialSnapshot {
  profiles: SocialProfile[];
  friendships: Friendship[];
  duelInvites: DuelInvite[];
}

async function getSocialSnapshot(userId: string): Promise<SocialSnapshot> {
  const admin = createAdminClient();
  const [{ data: friendships }, { data: duelInvites }, { data: profiles }] = await Promise.all([
    admin.from('friendships').select('id, user_id, friend_id, status, created_at, updated_at').or(`user_id.eq.${userId},friend_id.eq.${userId}`),
    admin.from('duel_invites').select('id, from_user_id, to_user_id, status, question_ids, from_user_score, to_user_score, from_user_correct_answers, to_user_correct_answers, from_user_answer_time_ms, to_user_answer_time_ms, from_user_played_at, to_user_played_at, from_user_session_id, to_user_session_id, winner_user_id, completed_at, created_at, updated_at, responded_at').or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`).order('created_at', { ascending: false }),
    admin.from('profiles').select('id, username, avatar_url, avatar_frame, favorite_team, league_tier, elo_rating, xp, last_seen_at').or(`id.eq.${userId}`),
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

  const { data: fullProfiles, error } = await admin
    .from('profiles')
    .select('id, username, avatar_url, avatar_frame, favorite_team, league_tier, elo_rating, xp, last_seen_at')
    .in('id', [...profileIds]);

  if (error) {
    throw new Error(error.message);
  }

  return {
    profiles: (fullProfiles ?? []).map((profile) => ({
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

  const { username } = await request.json();
  if (typeof username !== 'string' || !username.trim()) {
    return NextResponse.json({ error: 'Kullanıcı adı gerekli.' }, { status: 400 });
  }

  const normalized = username.trim().toLowerCase();
  const admin = createAdminClient();
  const { data: target, error: targetError } = await admin
    .from('profiles')
    .select('id, username')
    .ilike('username', normalized)
    .limit(1)
    .maybeSingle();

  if (targetError) {
    return NextResponse.json({ error: targetError.message }, { status: 500 });
  }

  if (!target) {
    return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
  }

  if (target.id === user.id) {
    return NextResponse.json({ error: 'Kendine arkadaş isteği gönderemezsin.' }, { status: 400 });
  }

  const { data: existing, error: existingError } = await admin
    .from('friendships')
    .select('id, status')
    .or(`and(user_id.eq.${user.id},friend_id.eq.${target.id}),and(user_id.eq.${target.id},friend_id.eq.${user.id})`);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if ((existing ?? []).some((friendship) => friendship.status === 'accepted')) {
    return NextResponse.json({ error: 'Bu kullanıcı zaten arkadaş listende.' }, { status: 400 });
  }

  if ((existing ?? []).some((friendship) => friendship.status === 'pending')) {
    return NextResponse.json({ error: 'Bu kullanıcı için zaten bekleyen bir istek var.' }, { status: 400 });
  }

  if ((existing ?? []).some((friendship) => friendship.status === 'blocked')) {
    return NextResponse.json({ error: 'Bu kullanıcıyla işlem yapılamıyor.' }, { status: 400 });
  }

  const { error: insertError } = await admin
    .from('friendships')
    .insert({ user_id: user.id, friend_id: target.id, status: 'pending' });

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

  const { action, requesterId } = await request.json();
  if ((action !== 'accept' && action !== 'reject') || typeof requesterId !== 'string') {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  const admin = createAdminClient();

  if (action === 'reject') {
    const { error } = await admin
      .from('friendships')
      .delete()
      .eq('user_id', requesterId)
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: await getSocialSnapshot(user.id) });
  }

  const { error: updateError } = await admin
    .from('friendships')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('user_id', requesterId)
    .eq('friend_id', user.id)
    .eq('status', 'pending');

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { data: reciprocal, error: reciprocalError } = await admin
    .from('friendships')
    .select('id')
    .eq('user_id', user.id)
    .eq('friend_id', requesterId)
    .maybeSingle();

  if (reciprocalError) {
    return NextResponse.json({ error: reciprocalError.message }, { status: 500 });
  }

  if (!reciprocal) {
    const { error: insertError } = await admin
      .from('friendships')
      .insert({ user_id: user.id, friend_id: requesterId, status: 'accepted' });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  } else {
    const { error: reciprocalUpdateError } = await admin
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', reciprocal.id);

    if (reciprocalUpdateError) {
      return NextResponse.json({ error: reciprocalUpdateError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ data: await getSocialSnapshot(user.id) });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { friendId } = await request.json();
  if (typeof friendId !== 'string') {
    return NextResponse.json({ error: 'Arkadaş bilgisi gerekli.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const [{ error: deleteFriendshipsError }, { error: cancelInvitesError }] = await Promise.all([
    admin
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`),
    admin
      .from('duel_invites')
      .update({ status: 'cancelled', responded_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${friendId},status.eq.pending),and(from_user_id.eq.${friendId},to_user_id.eq.${user.id},status.eq.pending)`),
  ]);

  if (deleteFriendshipsError || cancelInvitesError) {
    return NextResponse.json({ error: deleteFriendshipsError?.message || cancelInvitesError?.message }, { status: 500 });
  }

  return NextResponse.json({ data: await getSocialSnapshot(user.id) });
}
