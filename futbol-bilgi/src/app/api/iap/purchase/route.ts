import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const PRODUCT_CONFIG = {
  gems_small: { gems: 50, coins: 0, repeatable: true, label: 'Küçük Gem Paketi' },
  gems_medium: { gems: 200, coins: 0, repeatable: true, label: 'Orta Gem Paketi' },
  gems_large: { gems: 500, coins: 0, repeatable: true, label: 'Büyük Gem Paketi' },
  starter_pack: { gems: 100, coins: 5000, repeatable: false, label: 'Başlangıç Paketi' },
  premium_pass: { gems: 0, coins: 0, repeatable: false, label: 'Premium Pass' },
} as const;

type ProductId = keyof typeof PRODUCT_CONFIG;

function isProductId(value: unknown): value is ProductId {
  return typeof value === 'string' && value in PRODUCT_CONFIG;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = await request.json();

  if (!isProductId(productId)) {
    return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
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

  const product = PRODUCT_CONFIG[productId];
  const nextSettings = { ...(profile.settings ?? {}) } as Record<string, unknown>;
  const purchases = ((nextSettings.purchases as Record<string, boolean> | undefined) ?? {});

  if (productId === 'starter_pack' && purchases.starter_pack_claimed) {
    return NextResponse.json({ error: 'Starter pack already claimed' }, { status: 400 });
  }

  if (productId === 'premium_pass' && profile.is_premium) {
    return NextResponse.json({ error: 'Premium pass already active' }, { status: 400 });
  }

  if (productId === 'starter_pack') {
    nextSettings.purchases = {
      ...purchases,
      starter_pack_claimed: true,
    };
  }

  if (productId === 'premium_pass') {
    const premiumSettings = ((nextSettings.premium as Record<string, string> | undefined) ?? {});
    nextSettings.premium = {
      ...premiumSettings,
      pass_activated_at: new Date().toISOString(),
    };
  }

  const { data: updatedProfile, error: updateError } = await admin
    .from('profiles')
    .update({
      gems: profile.gems + product.gems,
      coins: profile.coins + product.coins,
      is_premium: productId === 'premium_pass' ? true : profile.is_premium,
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
      purchase: {
        productId,
        label: product.label,
        gems: product.gems,
        coins: product.coins,
      },
    },
  });
}
