import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/supabase/request-auth';

const DAILY_PREMIUM_GEMS = 20;

export async function POST(request: Request) {
  const { user } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const [{ data: profile, error: profileError }, { data: premiumTransaction, error: premiumTransactionError }] = await Promise.all([
    admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    admin
      .from('iap_transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', 'premium_pass')
      .eq('status', 'verified')
      .maybeSingle(),
  ]);

  if (profileError || premiumTransactionError) {
    return NextResponse.json({ error: profileError?.message ?? premiumTransactionError?.message }, { status: 500 });
  }

  if (!profile.is_premium || !premiumTransaction) {
    return NextResponse.json({ error: 'Verified premium pass required' }, { status: 400 });
  }

  const nextSettings = { ...(profile.settings ?? {}) } as Record<string, unknown>;
  const premiumSettings = ((nextSettings.premium as Record<string, string> | undefined) ?? {});
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (premiumSettings.claimed_daily_gems_at) {
    const claimedAt = new Date(premiumSettings.claimed_daily_gems_at);
    claimedAt.setHours(0, 0, 0, 0);
    if (claimedAt.getTime() === today.getTime()) {
      return NextResponse.json({ error: 'Premium gems already claimed today' }, { status: 400 });
    }
  }

  nextSettings.premium = {
    ...premiumSettings,
    claimed_daily_gems_at: new Date().toISOString(),
  };

  const { data: updatedProfile, error: updateError } = await admin
    .from('profiles')
    .update({
      gems: profile.gems + DAILY_PREMIUM_GEMS,
      settings: nextSettings,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      profile: updatedProfile,
      reward: {
        gems: DAILY_PREMIUM_GEMS,
      },
    },
  });
}
