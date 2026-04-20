import { refresh } from 'next/cache';
import { requireAdmin } from '@/lib/admin/guard';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ShopItemAdmin } from '@/lib/admin/types';
import { createAdminClient } from '@/lib/supabase/admin';
import { getThemeByKey, getThemeKeyFromShopItemName, getThemePreviewStyle } from '@/lib/themes';
import { FRAME_DEFINITION_MAP, getFrameKeyFromShopItemName } from '@/lib/frames';
import { Avatar } from '@/components/ui/avatar';

async function fetchShopItems() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('shop_items').select('*').order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as ShopItemAdmin[];
}

function getPriceText(item: ShopItemAdmin) {
  const coinPrice = item.price_coins ?? 0;
  const gemPrice = item.price_gems ?? 0;

  if (coinPrice > 0 && gemPrice > 0) return `${coinPrice} coin + ${gemPrice} gem`;
  if (coinPrice > 0) return `${coinPrice} coin`;
  if (gemPrice > 0) return `${gemPrice} gem`;
  return 'Ücretsiz';
}

function getStatusText(item: ShopItemAdmin) {
  if (!item.is_active) return 'Pasif';
  if (item.is_premium) return 'Premium';
  return 'Aktif';
}

function getThemeSummary(item: ShopItemAdmin) {
  if (item.item_type !== 'theme') {
    return null;
  }

  const themeKey = getThemeKeyFromShopItemName(item.name);
  if (!themeKey) {
    return {
      label: 'Eşleşme yok',
      description: 'Oyuncu mağazasında görünmesi için tema adı katalogla eşleşmeli.',
      style: undefined,
      tone: 'text-warning',
    };
  }

  const theme = getThemeByKey(themeKey);
  return {
    label: theme.label,
    description: theme.description,
    style: getThemePreviewStyle(themeKey),
    tone: 'text-success',
  };
}

function getFrameSummary(item: ShopItemAdmin) {
  if (item.item_type !== 'avatar_frame') {
    return null;
  }

  const frameKey = getFrameKeyFromShopItemName(item.name);
  if (!frameKey) {
    return {
      label: 'Eşleşme yok',
      description: 'Frame adı katalogla eşleşmeli.',
      frameKey: 'default',
      tone: 'text-warning',
    };
  }

  const frame = FRAME_DEFINITION_MAP[frameKey];
  return {
    label: frame.label,
    description: frame.description,
    frameKey,
    tone: 'text-success',
  };
}

export default async function AdminShopPage() {
  await requireAdmin();
  const items = await fetchShopItems();

  return (
    <div className="space-y-4">
      <Card padding="lg">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Mağaza</h2>
          <span className="text-sm text-text-secondary">{items.length} ürün</span>
        </div>
      </Card>

      <div className="space-y-3">
        {items.map((item) => {
          const themeSummary = getThemeSummary(item);
          const frameSummary = getFrameSummary(item);
          const currencyVariant = (item.price_gems ?? 0) > 0 ? 'secondary' : 'default';

          return (
            <Card key={item.id} padding="md" className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div>
                    <p className="font-medium text-text-primary">{item.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="info" size="sm">{item.item_type}</Badge>
                      <Badge variant={currencyVariant} size="sm">{getPriceText(item)}</Badge>
                      {item.is_premium && <Badge variant="warning" size="sm">Premium</Badge>}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-text-secondary">
                    <p>{item.description || 'Açıklama yok'}</p>
                    <p>Kapsam: {item.league_scope || 'global'}</p>
                    <p>Önizleme URL: {item.preview_url || 'Yok'}</p>
                    {themeSummary && <p className={themeSummary.tone}>{themeSummary.label} — {themeSummary.description}</p>}
                    {frameSummary && <p className={frameSummary.tone}>{frameSummary.label} — {frameSummary.description}</p>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-text-secondary">{getStatusText(item)}</span>
                  {themeSummary?.style && <div className="h-16 w-24 rounded-xl border border-white/10" style={themeSummary.style} />}
                  {frameSummary && (
                    <div className="rounded-xl border border-white/10 bg-bg-elevated p-3">
                      <Avatar fallback="FB" frame={frameSummary.frameKey} />
                    </div>
                  )}
                </div>
              </div>

              <form
                action={async (formData) => {
                  'use server';
                  await requireAdmin();

                  const payload = {
                    id: item.id,
                    price_coins: formData.get('price_coins') ? Number(formData.get('price_coins')) : null,
                    price_gems: formData.get('price_gems') ? Number(formData.get('price_gems')) : null,
                    is_active: formData.get('is_active') === 'on',
                    is_premium: formData.get('is_premium') === 'on',
                  };

                  const supabase = createAdminClient();
                  const { error } = await supabase.from('shop_items').update(payload).eq('id', item.id);

                  if (error) {
                    throw new Error(error.message);
                  }

                  refresh();
                }}
                className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
              >
                <Input name="price_coins" label="Coin" type="number" defaultValue={item.price_coins ?? ''} />
                <Input name="price_gems" label="Gem" type="number" defaultValue={item.price_gems ?? ''} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="is_active" defaultChecked={item.is_active} />
                  Aktif
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="is_premium" defaultChecked={item.is_premium} />
                  Premium
                </label>
                <Button type="submit" className="sm:col-span-2 lg:col-span-4">Güncelle</Button>
              </form>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
