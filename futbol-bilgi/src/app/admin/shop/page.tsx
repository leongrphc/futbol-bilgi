import { refresh } from 'next/cache';
import { requireAdmin } from '@/lib/admin/guard';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ShopItemAdmin } from '@/lib/admin/types';
import { createAdminClient } from '@/lib/supabase/admin';

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
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">{item.name}</p>
                <p className="text-xs text-text-secondary">{item.item_type}</p>
              </div>
              <span className="text-xs text-text-secondary">{item.is_active ? 'Aktif' : 'Pasif'}</span>
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
