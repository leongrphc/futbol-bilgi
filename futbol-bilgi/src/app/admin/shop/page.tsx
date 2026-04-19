import { refresh } from 'next/cache';
import { requireAdmin } from '@/lib/admin/guard';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ShopItemAdmin } from '@/lib/admin/types';
import { createAdminClient } from '@/lib/supabase/admin';
import { getThemeKeyFromShopItemName } from '@/lib/themes';

function getThemeCatalogHint(item: ShopItemAdmin) {
  if (item.item_type !== 'theme') {
    return null;
  }

  return getThemeKeyFromShopItemName(item.name);
}

function getAvailabilityText(item: ShopItemAdmin) {
  if (!item.is_active) {
    return 'Pasif';
  }

  if (item.is_premium) {
    return 'Premium';
  }

  return 'Aktif';
}

function getPriceText(item: ShopItemAdmin) {
  if ((item.price_coins ?? 0) > 0) {
    return `${item.price_coins} coin`;
  }

  if ((item.price_gems ?? 0) > 0) {
    return `${item.price_gems} gem`;
  }

  return 'Ücretsiz';
}

function getPreviewUrlText(item: ShopItemAdmin) {
  return item.preview_url || 'Yok';
}

function getScopeText(item: ShopItemAdmin) {
  return item.league_scope || 'global';
}

function getDescriptionText(item: ShopItemAdmin) {
  return item.description || 'Açıklama yok';
}

function getCatalogStatusText(item: ShopItemAdmin) {
  const themeKey = getThemeCatalogHint(item);
  if (item.item_type !== 'theme') {
    return null;
  }

  return themeKey ? `Tema anahtarı: ${themeKey}` : 'Tema eşlemesi eksik';
}

function getCatalogStatusClass(item: ShopItemAdmin) {
  const themeKey = getThemeCatalogHint(item);
  return themeKey ? 'text-success' : 'text-warning';
}

function renderCatalogStatus(item: ShopItemAdmin) {
  const status = getCatalogStatusText(item);
  if (!status) {
    return null;
  }

  return <p className={`text-xs ${getCatalogStatusClass(item)}`}>{status}</p>;
}

function renderMeta(item: ShopItemAdmin) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-text-secondary">{item.item_type}</p>
      <p className="text-xs text-text-secondary">{getDescriptionText(item)}</p>
      <p className="text-xs text-text-secondary">Fiyat: {getPriceText(item)}</p>
      <p className="text-xs text-text-secondary">Kapsam: {getScopeText(item)}</p>
      <p className="text-xs text-text-secondary">Önizleme: {getPreviewUrlText(item)}</p>
      {renderCatalogStatus(item)}
    </div>
  );
}

function renderStatus(item: ShopItemAdmin) {
  return <span className="text-xs text-text-secondary">{getAvailabilityText(item)}</span>;
}

function renderHeader(item: ShopItemAdmin) {
  return (
    <div>
      <p className="font-medium text-text-primary">{item.name}</p>
      {renderMeta(item)}
    </div>
  );
}

function getHeaderContent(item: ShopItemAdmin) {
  return renderHeader(item);
}

function getStatusContent(item: ShopItemAdmin) {
  return renderStatus(item);
}

function getHeaderBlock(item: ShopItemAdmin) {
  return getHeaderContent(item);
}

function getStatusBlock(item: ShopItemAdmin) {
  return getStatusContent(item);
}

function renderItemSummary(item: ShopItemAdmin) {
  return getHeaderBlock(item);
}

function renderItemStatus(item: ShopItemAdmin) {
  return getStatusBlock(item);
}

function getThemeBlock(item: ShopItemAdmin) {
  return renderItemSummary(item);
}

function getThemeStatus(item: ShopItemAdmin) {
  return renderItemStatus(item);
}

function renderShopItemInfo(item: ShopItemAdmin) {
  return getThemeBlock(item);
}

function renderShopItemBadge(item: ShopItemAdmin) {
  return getThemeStatus(item);
}

function getShopItemInfo(item: ShopItemAdmin) {
  return renderShopItemInfo(item);
}

function getShopItemBadge(item: ShopItemAdmin) {
  return renderShopItemBadge(item);
}

function renderAdminShopHeader(item: ShopItemAdmin) {
  return getShopItemInfo(item);
}

function renderAdminShopStatus(item: ShopItemAdmin) {
  return getShopItemBadge(item);
}

function getAdminShopHeader(item: ShopItemAdmin) {
  return renderAdminShopHeader(item);
}

function getAdminShopStatus(item: ShopItemAdmin) {
  return renderAdminShopStatus(item);
}

function renderCatalogAwareHeader(item: ShopItemAdmin) {
  return getAdminShopHeader(item);
}

function renderCatalogAwareStatus(item: ShopItemAdmin) {
  return getAdminShopStatus(item);
}

function getCatalogAwareHeader(item: ShopItemAdmin) {
  return renderCatalogAwareHeader(item);
}

function getCatalogAwareStatus(item: ShopItemAdmin) {
  return renderCatalogAwareStatus(item);
}

function renderShopCardHeader(item: ShopItemAdmin) {
  return getCatalogAwareHeader(item);
}

function renderShopCardStatus(item: ShopItemAdmin) {
  return getCatalogAwareStatus(item);
}

function getShopCardHeader(item: ShopItemAdmin) {
  return renderShopCardHeader(item);
}

function getShopCardStatus(item: ShopItemAdmin) {
  return renderShopCardStatus(item);
}

function renderItemHeader(item: ShopItemAdmin) {
  return getShopCardHeader(item);
}

function renderItemBadge(item: ShopItemAdmin) {
  return getShopCardStatus(item);
}

function getItemHeader(item: ShopItemAdmin) {
  return renderItemHeader(item);
}

function getItemBadge(item: ShopItemAdmin) {
  return renderItemBadge(item);
}

function renderSummary(item: ShopItemAdmin) {
  return getItemHeader(item);
}

function renderBadge(item: ShopItemAdmin) {
  return getItemBadge(item);
}

function getSummary(item: ShopItemAdmin) {
  return renderSummary(item);
}

function getBadge(item: ShopItemAdmin) {
  return renderBadge(item);
}

function renderItemTitle(item: ShopItemAdmin) {
  return getSummary(item);
}

function renderItemState(item: ShopItemAdmin) {
  return getBadge(item);
}

function getTitle(item: ShopItemAdmin) {
  return renderItemTitle(item);
}

function getState(item: ShopItemAdmin) {
  return renderItemState(item);
}

function renderContent(item: ShopItemAdmin) {
  return getTitle(item);
}

function renderState(item: ShopItemAdmin) {
  return getState(item);
}

function getContent(item: ShopItemAdmin) {
  return renderContent(item);
}

function getStateText(item: ShopItemAdmin) {
  return renderState(item);
}

function renderCardTitle(item: ShopItemAdmin) {
  return getContent(item);
}

function renderCardStatus(item: ShopItemAdmin) {
  return getStateText(item);
}

function getCardTitle(item: ShopItemAdmin) {
  return renderCardTitle(item);
}

function getCardStatus(item: ShopItemAdmin) {
  return renderCardStatus(item);
}

function renderAdminItem(item: ShopItemAdmin) {
  return getCardTitle(item);
}

function renderAdminStatus(item: ShopItemAdmin) {
  return getCardStatus(item);
}

function getAdminItem(item: ShopItemAdmin) {
  return renderAdminItem(item);
}

function getAdminStatus(item: ShopItemAdmin) {
  return renderAdminStatus(item);
}

function renderShopHeader(item: ShopItemAdmin) {
  return getAdminItem(item);
}

function renderShopStatus(item: ShopItemAdmin) {
  return getAdminStatus(item);
}

async function fetchShopItems() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('shop_items').select('*').order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as ShopItemAdmin[];
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
        {items.map((item) => (
          <Card key={item.id} padding="md" className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              {renderShopHeader(item)}
              {renderShopStatus(item)}
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
        ))}
      </div>
    </div>
  );
}
