'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Palette, Check, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/lib/stores/user-store';
import { THEME_DEFINITIONS, THEME_DEFINITION_MAP, type AppThemeKey } from '@/lib/themes';
import type { ShopItem, UserInventory } from '@/types';

interface ThemeShopResponse {
  shopItems: ShopItem[];
  inventory: UserInventory[];
}

export default function ThemesPage() {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadThemes = async () => {
      const response = await fetch('/api/shop/themes');
      if (!response.ok || !user) {
        setIsLoading(false);
        return;
      }

      const json = await response.json();
      const data = (json.data ?? { shopItems: [], inventory: [] }) as ThemeShopResponse;

      setUser({
        ...user,
        inventory: data.inventory,
        shop_items: data.shopItems,
      });
      setIsLoading(false);
    };

    loadThemes();
  }, [user, setUser]);

  const inventory = user?.inventory ?? [];
  const shopItems = user?.shop_items ?? [];
  const ownedItemIds = useMemo(() => new Set(inventory.map((item) => item.item_id)), [inventory]);
  const equippedItem = inventory.find((item) => item.is_equipped);

  const itemByThemeKey = useMemo(() => {
    const entries = shopItems
      .map((item) => {
        const themeKey = item.metadata?.themeKey;
        return typeof themeKey === 'string' ? [themeKey, item] : null;
      })
      .filter(Boolean) as Array<[string, ShopItem]>;

    return Object.fromEntries(entries) as Record<string, ShopItem>;
  }, [shopItems]);

  if (!user) {
    return null;
  }

  const equipTheme = async (themeKey: AppThemeKey) => {
    const item = itemByThemeKey[themeKey];
    if (!item) return;

    const response = await fetch('/api/shop/themes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: item.id }),
    });

    if (!response.ok) {
      const json = await response.json();
      setMessage(json.error || 'Tema kuşanılamadı.');
      return;
    }

    const nextInventory = inventory.map((entry) => ({
      ...entry,
      is_equipped: entry.item_id === item.id,
    }));

    setUser({
      ...user,
      inventory: nextInventory,
      settings: {
        ...user.settings,
        theme: themeKey,
      },
    });
    setMessage(`${THEME_DEFINITION_MAP[themeKey].label} kuşanıldı.`);
  };

  const buyTheme = async (themeKey: AppThemeKey) => {
    const item = itemByThemeKey[themeKey];
    if (!item) return;

    const response = await fetch('/api/shop/themes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: item.id }),
    });

    const json = await response.json();

    if (!response.ok) {
      setMessage(json.error || 'Tema satın alınamadı.');
      return;
    }

    const nextInventory = [...inventory, json.data.inventory];
    setUser({
      ...user,
      coins: json.data.profile.coins,
      gems: json.data.profile.gems,
      inventory: nextInventory,
    });
    setMessage(`${THEME_DEFINITION_MAP[themeKey].label} satın alındı.`);
  };

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">Tema Mağazası</h1>
            <p className="text-sm text-text-secondary">Sahip olduğun temaları kuşan veya yenilerini satın al.</p>
          </div>
          <Link href="/profile">
            <Button variant="ghost">Profile Dön</Button>
          </Link>
        </div>

        <Card padding="md" className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-primary-500" />
            <div>
              <p className="text-sm text-text-secondary">Aktif Tema</p>
              <p className="font-medium text-text-primary">
                {THEME_DEFINITION_MAP[(user.settings.theme as AppThemeKey) || 'dark']?.label ?? 'Klasik Gece'}
              </p>
            </div>
          </div>
          <div className="text-sm font-semibold text-secondary-500">{user.coins} coin</div>
        </Card>

        {message && (
          <Card padding="sm" className="text-sm text-text-secondary">{message}</Card>
        )}

        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-text-primary">Mağaza</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {THEME_DEFINITIONS.map((theme) => {
              const item = itemByThemeKey[theme.key];
              const owned = item ? ownedItemIds.has(item.id) : theme.key === 'dark';
              const equipped = !!item && equippedItem?.item_id === item.id;
              const priceLabel = item ? ((item.price_coins ?? 0) === 0 ? 'Ücretsiz' : `${item.price_coins} coin`) : 'Yakında';

              return (
                <Card key={theme.key} padding="lg" className="space-y-4">
                  <div className="h-24 rounded-2xl" style={{ background: `linear-gradient(135deg, ${theme.preview.background} 0%, ${theme.preview.primary} 55%, ${theme.preview.secondary} 100%)` }} />
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-lg font-semibold text-text-primary">{theme.label}</h3>
                      {equipped && <span className="text-xs font-semibold text-success">Kuşanıldı</span>}
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">{theme.description}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-secondary-500">{priceLabel}</span>
                    {owned ? (
                      <Button variant={equipped ? 'secondary' : 'primary'} onClick={() => equipTheme(theme.key)} disabled={!item}>
                        <Check className="h-4 w-4" />
                        {equipped ? 'Aktif' : 'Kuşan'}
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={() => buyTheme(theme.key)} disabled={!item || user.coins < (item.price_coins ?? 0) || isLoading}>
                        <Lock className="h-4 w-4" />
                        Satın Al
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
