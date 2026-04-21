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

  const [{ data: friendships, error: friendshipsError }, { data: duelInvites, error: invitesError }, { data: currentUser, error: currentUserError }] = await Promise.all([
    admin
      .from('friendships')
      .select('id, user_id, friend_id, status, created_at, updated_at')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`),
    admin
      .from('duel_invites')
      .select('id, from_user_id, to_user_id, status, created_at, updated_at, responded_at')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false }),
    admin
      .from('profiles')
      .select('id, username, avatar_url, avatar_frame, favorite_team, league_tier, elo_rating, xp, last_seen_at')
      .eq('id', userId)
      .single(),
  ]);

  if (friendshipsError || invitesError || currentUserError) {
    throw new Error(friendshipsError?.message || invitesError?.message || currentUserError?.message || 'Sosyal veriler alınamadı.');
  }

  const profileIds = new Set<string>([userId]);
  for (const friendship of friendships ?? []) {
    profileIds.add(friendship.user_id);
    profileIds.add(friendship.friend_id);
  }
  for (const invite of duelInvites ?? []) {
    profileIds.add(invite.from_user_id);
    profileIds.add(invite.to_user_id);
  }

  const ids = [...profileIds];
  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id, username, avatar_url, avatar_frame, favorite_team, league_tier, elo_rating, xp, last_seen_at')
    .in('id', ids);

  if (profilesError) {
    throw new Error(profilesError.message);
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
      last_seen_at: profile.last_seen_at ?? currentUser.last_seen_at,
    })),
    friendships: (friendships ?? []) as Friendship[],
    duelInvites: (duelInvites ?? []) as DuelInvite[],
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getSocialSnapshot(user.id);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sosyal veriler alınamadı.' },
      { status: 500 },
    );
  }
}
