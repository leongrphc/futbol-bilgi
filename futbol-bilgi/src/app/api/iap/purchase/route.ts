import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyIapGrant, isIapProductId } from '@/lib/iap/products';
import { isMockVerificationEnabled } from '@/lib/iap/verification';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = await request.json();

  if (!isIapProductId(productId)) {
    return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
  }

  if (!isMockVerificationEnabled()) {
    return NextResponse.json(
      { error: 'Direct IAP purchase is disabled. Use /api/iap/verify after store validation.' },
      { status: 410 }
    );
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const purchases = profile.settings?.purchases ?? {};

  if (productId === 'starter_pack' && purchases.starter_pack_claimed) {
    return NextResponse.json({ error: 'Starter pack already claimed' }, { status: 400 });
  }

  if (productId === 'premium_pass' && profile.is_premium) {
    return NextResponse.json({ error: 'Premium pass already active' }, { status: 400 });
  }

  const grant = applyIapGrant(profile, productId);

  const { data: updatedProfile, error: updateError } = await admin
    .from('profiles')
    .update({
      gems: grant.gems,
      coins: grant.coins,
      is_premium: grant.is_premium,
      settings: grant.settings,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const transactionId = `mock-${productId}-${Date.now()}`;
  const { error: transactionError } = await admin
    .from('iap_transactions')
    .insert({
      user_id: user.id,
      platform: 'ios',
      product_id: productId,
      transaction_id: transactionId,
      status: 'verified',
      provider_response: { provider: 'mock', source: 'direct_purchase' },
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (transactionError) {
    return NextResponse.json({ error: transactionError.message }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      profile: updatedProfile,
      purchase: grant.purchase,
      mock: true,
      transactionId,
    },
  });
}
