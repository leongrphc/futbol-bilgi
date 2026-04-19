import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateLevel, getDailyRewardPreview } from '@/lib/utils/game';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { action, settings } = await request.json();
  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (action === 'claim_daily_reward') {
    const reward = getDailyRewardPreview(profile.last_daily_claim, profile.streak_days);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (profile.last_daily_claim) {
      const lastClaim = new Date(profile.last_daily_claim);
      lastClaim.setHours(0, 0, 0, 0);
      if (lastClaim.getTime() === today.getTime()) {
        return NextResponse.json({ error: 'Reward already claimed today' }, { status: 400 });
      }
    }

    const nextXp = profile.xp + reward.xp;
    const nextCoins = profile.coins + reward.coins;
    const nextLevel = calculateLevel(nextXp).level;

    const { data, error } = await admin
      .from('profiles')
      .update({
        xp: nextXp,
        coins: nextCoins,
        level: nextLevel,
        streak_days: reward.nextStreak,
        last_daily_claim: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, reward });
  }

  if (action === 'update_settings') {
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Missing settings' }, { status: 400 });
    }

    const { data, error } = await admin
      .from('profiles')
      .update({
        settings: { ...(profile.settings ?? {}), ...settings },
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
