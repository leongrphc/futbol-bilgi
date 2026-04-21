import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ACHIEVEMENT_DEFINITIONS } from '@/lib/achievements/definitions';
import { evaluateAchievementProgress, type AchievementStats } from '@/lib/achievements/evaluate';
import { updateAchievementStatsFromStores } from '@/lib/achievements/sync';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { leagueEntries, currentSeasonId } = await request.json();
  const admin = createAdminClient();

  const [{ data: profile, error: profileError }, { data: achievements, error: achievementsError }, { data: userAchievements, error: userAchievementsError }, { data: friendships, error: friendshipsError }] = await Promise.all([
    admin.from('profiles').select('*').eq('id', user.id).single(),
    admin.from('achievements').select('*'),
    admin.from('user_achievements').select('*').eq('user_id', user.id),
    admin.from('friendships').select('id, user_id, friend_id, status, created_at, updated_at').or(`user_id.eq.${user.id},friend_id.eq.${user.id}`),
  ]);

  if (friendshipsError) {
    return NextResponse.json({ error: friendshipsError.message }, { status: 500 });
  }

  const normalizedFriendships = (friendships ?? []).map((friendship) => ({
    ...friendship,
    updated_at: friendship.updated_at ?? friendship.created_at,
  }));

  if (profileError || achievementsError || userAchievementsError) {
    return NextResponse.json({ error: profileError?.message || achievementsError?.message || userAchievementsError?.message }, { status: 500 });
  }

  const stats: AchievementStats = updateAchievementStatsFromStores({
    user: profile,
    social: { friendships: normalizedFriendships },
    league: { entries: leagueEntries ?? [] },
    currentSeasonId,
  });

  const evaluated = evaluateAchievementProgress(stats);
  const existingAchievementMap = new Map(userAchievements.map((item) => [item.achievement_id, item]));
  const definitionMap = new Map(ACHIEVEMENT_DEFINITIONS.map((definition) => [definition.key, definition]));

  let rewardCoins = 0;
  let rewardGems = 0;
  let rewardXp = 0;
  const newlyUnlocked: string[] = [];

  for (const item of evaluated) {
    const achievementRow = achievements.find((achievement) => achievement.code === item.key);
    if (!achievementRow) {
      continue;
    }

    const existing = existingAchievementMap.get(achievementRow.id);

    if (!existing) {
      await admin.from('user_achievements').insert({
        user_id: user.id,
        achievement_id: achievementRow.id,
        progress: item.progress,
        unlocked_at: item.unlocked ? new Date().toISOString() : null,
      });

      if (item.unlocked) {
        const definition = definitionMap.get(item.key);
        rewardCoins += definition?.rewardCoins ?? 0;
        rewardGems += definition?.rewardGems ?? 0;
        rewardXp += definition?.rewardXp ?? 0;
        newlyUnlocked.push(item.key);
      }

      continue;
    }

    const shouldUnlock = item.unlocked && !existing.unlocked_at;
    await admin
      .from('user_achievements')
      .update({
        progress: item.progress,
        unlocked_at: shouldUnlock ? new Date().toISOString() : existing.unlocked_at,
      })
      .eq('user_id', user.id)
      .eq('achievement_id', achievementRow.id);

    if (shouldUnlock) {
      const definition = definitionMap.get(item.key);
      rewardCoins += definition?.rewardCoins ?? 0;
      rewardGems += definition?.rewardGems ?? 0;
      rewardXp += definition?.rewardXp ?? 0;
      newlyUnlocked.push(item.key);
    }
  }

  const nextXp = profile.xp + rewardXp;
  const nextLevel = nextXp >= profile.xp ? profile.level : profile.level;
  const { data: updatedProfile, error: updateProfileError } = await admin
    .from('profiles')
    .update({
      coins: profile.coins + rewardCoins,
      gems: profile.gems + rewardGems,
      xp: nextXp,
      level: nextLevel,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select('*')
    .single();

  if (updateProfileError) {
    return NextResponse.json({ error: updateProfileError.message }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      profile: updatedProfile,
      newlyUnlocked,
      rewards: {
        coins: rewardCoins,
        gems: rewardGems,
        xp: rewardXp,
      },
    },
  });

}
