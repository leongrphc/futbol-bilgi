import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getFrameKeyFromShopItemName, mapFrameShopItem } from '@/lib/frames';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const [{ data: rawShopItems, error: shopError }, { data: rawInventory, error: inventoryError }] = await Promise.all([
    admin.from('shop_items').select('*').eq('item_type', 'avatar_frame').eq('is_active', true).order('created_at', { ascending: true }),
    admin.from('user_inventory').select('*').eq('user_id', user.id),
  ]);

  if (shopError || inventoryError) {
    return NextResponse.json({ error: shopError?.message || inventoryError?.message }, { status: 500 });
  }

  const shopItems = (rawShopItems ?? [])
    .map(mapFrameShopItem)
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return NextResponse.json({ data: { shopItems, inventory: rawInventory ?? [] } });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { itemId } = await request.json();
  if (!itemId) {
    return NextResponse.json({ error: 'Missing itemId' }, { status: 400 });
  }

  const admin = createAdminClient();
  const [{ data: item, error: itemError }, { data: profile, error: profileError }, { data: existingInventory, error: inventoryError }] = await Promise.all([
    admin.from('shop_items').select('*').eq('id', itemId).eq('item_type', 'avatar_frame').eq('is_active', true).single(),
    admin.from('profiles').select('*').eq('id', user.id).single(),
    admin.from('user_inventory').select('*').eq('user_id', user.id).eq('item_id', itemId).maybeSingle(),
  ]);

  if (itemError || profileError || inventoryError) {
    return NextResponse.json({ error: itemError?.message || profileError?.message || inventoryError?.message }, { status: 500 });
  }

  if (existingInventory) {
    return NextResponse.json({ error: 'Item already owned' }, { status: 400 });
  }

  const nextCoins = profile.coins - (item.price_coins ?? 0);
  const nextGems = profile.gems - (item.price_gems ?? 0);

  if (nextCoins < 0 || nextGems < 0) {
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
  }

  const { error: updateProfileError } = await admin
    .from('profiles')
    .update({ coins: nextCoins, gems: nextGems, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateProfileError) {
    return NextResponse.json({ error: updateProfileError.message }, { status: 500 });
  }

  const { data: insertedInventory, error: insertInventoryError } = await admin
    .from('user_inventory')
    .insert({ user_id: user.id, item_id: itemId, is_equipped: false })
    .select('*')
    .single();

  if (insertInventoryError) {
    return NextResponse.json({ error: insertInventoryError.message }, { status: 500 });
  }

  return NextResponse.json({ data: { inventory: insertedInventory, profile: { ...profile, coins: nextCoins, gems: nextGems } } });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { frameKey } = await request.json();
  if (!frameKey) {
    return NextResponse.json({ error: 'Missing frameKey' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: rawFrameItems, error: frameItemsError } = await admin
    .from('shop_items')
    .select('id, name')
    .eq('item_type', 'avatar_frame')
    .eq('is_active', true);

  if (frameItemsError) {
    return NextResponse.json({ error: frameItemsError.message }, { status: 500 });
  }

  const frameItemIds = (rawFrameItems ?? []).map((item) => item.id);
  if (frameItemIds.length > 0) {
    const { error: clearEquippedError } = await admin
      .from('user_inventory')
      .update({ is_equipped: false })
      .eq('user_id', user.id)
      .in('item_id', frameItemIds);

    if (clearEquippedError) {
      return NextResponse.json({ error: clearEquippedError.message }, { status: 500 });
    }
  }

  if (frameKey === 'default') {
    const { data: profile, error } = await admin
      .from('profiles')
      .update({ avatar_frame: null, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: profile });
  }

  const selectedFrame = (rawFrameItems ?? []).find((item) => getFrameKeyFromShopItemName(item.name) === frameKey);
  if (!selectedFrame) {
    return NextResponse.json({ error: 'Frame not found' }, { status: 404 });
  }

  const { data: inventoryItem, error: inventoryError } = await admin
    .from('user_inventory')
    .select('*')
    .eq('user_id', user.id)
    .eq('item_id', selectedFrame.id)
    .maybeSingle();

  if (inventoryError) {
    return NextResponse.json({ error: inventoryError.message }, { status: 500 });
  }

  if (!inventoryItem) {
    return NextResponse.json({ error: 'Çerçeve hesabında bulunmuyor.' }, { status: 400 });
  }

  const [{ error: equipError }, { data: profile, error: profileError }] = await Promise.all([
    admin
      .from('user_inventory')
      .update({ is_equipped: true })
      .eq('id', inventoryItem.id),
    admin
      .from('profiles')
      .update({ avatar_frame: frameKey, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('*')
      .single(),
  ]);

  if (equipError || profileError) {
    return NextResponse.json({ error: equipError?.message || profileError?.message }, { status: 500 });
  }

  return NextResponse.json({ data: profile });
}
