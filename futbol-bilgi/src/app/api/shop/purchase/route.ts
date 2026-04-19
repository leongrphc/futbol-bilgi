import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { JokerType } from '@/types';
import { JOKER_COSTS } from '@/lib/constants/game';

const SHOP_CATALOG = {
  joker_fifty_fifty: { kind: 'joker', jokerType: 'fifty_fifty', priceCoins: JOKER_COSTS.fifty_fifty, priceGems: 0 },
  joker_audience: { kind: 'joker', jokerType: 'audience', priceCoins: JOKER_COSTS.audience, priceGems: 0 },
  joker_phone: { kind: 'joker', jokerType: 'phone', priceCoins: JOKER_COSTS.phone, priceGems: 0 },
  joker_freeze_time: { kind: 'joker', jokerType: 'freeze_time', priceCoins: JOKER_COSTS.freeze_time, priceGems: 0 },
  joker_skip: { kind: 'joker', jokerType: 'skip', priceCoins: JOKER_COSTS.skip, priceGems: 0 },
  joker_double_answer: { kind: 'joker', jokerType: 'double_answer', priceCoins: JOKER_COSTS.double_answer, priceGems: 0 },
  energy_refill_small: { kind: 'energy', energyAmount: 1, priceCoins: 30, priceGems: 0 },
} as const;

type ShopItemKey = keyof typeof SHOP_CATALOG;

function isShopItemKey(value: unknown): value is ShopItemKey {
  return typeof value === 'string' && value in SHOP_CATALOG;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { itemKey } = await request.json();

  if (!isShopItemKey(itemKey)) {
    return NextResponse.json({ error: 'Invalid shop item' }, { status: 400 });
  }

  const item = SHOP_CATALOG[itemKey];
  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (profile.coins < item.priceCoins || profile.gems < item.priceGems) {
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
  }

  const nextSettings = { ...(profile.settings ?? {}) } as Record<string, unknown>;
  const updates: Record<string, unknown> = {
    coins: profile.coins - item.priceCoins,
    gems: profile.gems - item.priceGems,
    updated_at: new Date().toISOString(),
  };

  if (item.kind === 'joker') {
    const jokers = ((nextSettings.jokers as Partial<Record<JokerType, number>> | undefined) ?? {});
    nextSettings.jokers = {
      ...jokers,
      [item.jokerType]: (jokers[item.jokerType] ?? 0) + 1,
    };
    updates.settings = nextSettings;
  }

  if (item.kind === 'energy') {
    updates.energy = Math.min(5, profile.energy + item.energyAmount);
  }

  const { data: updatedProfile, error: updateError } = await admin
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      profile: updatedProfile,
      purchase: item,
    },
  });
}
