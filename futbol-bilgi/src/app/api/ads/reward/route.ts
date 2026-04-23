import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/supabase/request-auth';

const REWARD_CONFIG = {
  energy_refill: { limit: 5, rewardValue: 1 },
  coins_small: { limit: 10, rewardValue: 50 },
  double_answer_joker: { limit: 3, rewardValue: 1 },
} as const;

type RewardType = keyof typeof REWARD_CONFIG;

function isRewardType(value: unknown): value is RewardType {
  return typeof value === 'string' && value in REWARD_CONFIG;
}

export async function POST(request: Request) {
  const { user } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { rewardType } = await request.json();

  if (!isRewardType(rewardType)) {
    return NextResponse.json({ error: 'Invalid reward type' }, { status: 400 });
  }

  const admin = createAdminClient();
  const config = REWARD_CONFIG[rewardType];

  const [{ data: profile, error: profileError }, { count, error: countError }] = await Promise.all([
    admin.from('profiles').select('*').eq('id', user.id).single(),
    admin
      .from('ad_reward_claims')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('reward_type', rewardType)
      .eq('claim_date', new Date().toISOString().slice(0, 10)),
  ]);

  if (profileError || countError) {
    return NextResponse.json({ error: profileError?.message || countError?.message }, { status: 500 });
  }

  if ((count ?? 0) >= config.limit) {
    return NextResponse.json({ error: 'Daily reward limit reached' }, { status: 400 });
  }

  const nextSettings = { ...(profile.settings ?? {}) } as Record<string, unknown>;
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  let rewardSummary: { type: RewardType; energy?: number; coins?: number; joker?: string; amount: number };

  if (rewardType === 'energy_refill') {
    if (profile.energy >= 5) {
      return NextResponse.json({ error: 'Energy is already full' }, { status: 400 });
    }

    updates.energy = Math.min(5, profile.energy + config.rewardValue);
    rewardSummary = { type: rewardType, energy: config.rewardValue, amount: config.rewardValue };
  } else if (rewardType === 'coins_small') {
    updates.coins = profile.coins + config.rewardValue;
    rewardSummary = { type: rewardType, coins: config.rewardValue, amount: config.rewardValue };
  } else {
    const jokers = ((nextSettings.jokers as Record<string, number> | undefined) ?? {});
    nextSettings.jokers = {
      ...jokers,
      double_answer: (jokers.double_answer ?? 0) + config.rewardValue,
    };
    updates.settings = nextSettings;
    rewardSummary = { type: rewardType, joker: 'double_answer', amount: config.rewardValue };
  }

  const [{ data: updatedProfile, error: updateError }, { error: insertError }] = await Promise.all([
    admin.from('profiles').update(updates).eq('id', user.id).select('*').single(),
    admin.from('ad_reward_claims').insert({
      user_id: user.id,
      reward_type: rewardType,
      reward_value: config.rewardValue,
    }),
  ]);

  if (updateError || insertError) {
    return NextResponse.json({ error: updateError?.message || insertError?.message }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      profile: updatedProfile,
      reward: rewardSummary,
      remainingToday: Math.max(0, config.limit - ((count ?? 0) + 1)),
    },
  });
}
