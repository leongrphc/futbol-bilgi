'use client';

import Link from 'next/link';
import { Palette, Check, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/lib/stores/user-store';
import { THEME_DEFINITIONS, THEME_DEFINITION_MAP, type AppThemeKey } from '@/lib/themes';

const starterThemeIds: Record<AppThemeKey, string> = {
  dark: 'theme-dark',
  'champion-night': 'theme-champion-night',
  'emerald-flare': 'theme-emerald-flare',
  'midnight-gold': 'theme-midnight-gold',
};

export default function ThemesPage() {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  if (!user) {
    return null;
  }

  const inventory = user.inventory ?? [{ id: 'inventory-dark', user_id: user.id, item_id: starterThemeIds.dark, quantity: 1, is_equipped: true, purchased_at: new Date().toISOString() }];
  const ownedItemIds = new Set(inventory.map((item) => item.item_id));
  const equippedItem = inventory.find((item) => item.is_equipped);

  const equipTheme = (themeKey: AppThemeKey) => {
    const itemId = starterThemeIds[themeKey];
    const nextInventory = inventory.map((item) => ({
      ...item,
      is_equipped: item.item_id === itemId,
    }));

    if (!ownedItemIds.has(itemId)) {
      nextInventory.push({
        id: `inventory-${themeKey}`,
        user_id: user.id,
        item_id: itemId,
        quantity: 1,
        is_equipped: true,
        purchased_at: new Date().toISOString(),
      });
    }

    setUser({
      ...user,
      inventory: nextInventory,
      settings: {
        ...user.settings,
        theme: themeKey,
      },
    });
  };

  const buyTheme = (themeKey: AppThemeKey) => {
    const price = themeKey === 'dark' ? 0 : themeKey === 'champion-night' ? 250 : themeKey === 'emerald-flare' ? 180 : 120;
    if (user.coins < price) {
      return;
    }

    const itemId = starterThemeIds[themeKey];
    const nextInventory = [
      ...inventory,
      {
        id: `inventory-${themeKey}`,
        user_id: user.id,
        item_id: itemId,
        quantity: 1,
        is_equipped: false,
        purchased_at: new Date().toISOString(),
      },
    ];

    setUser({
      ...user,
      coins: user.coins - price,
      inventory: nextInventory,
    });
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

        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-text-primary">Mağaza</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {THEME_DEFINITIONS.map((theme) => {
              const itemId = starterThemeIds[theme.key];
              const owned = ownedItemIds.has(itemId);
              const equipped = equippedItem?.item_id === itemId;
              const price = theme.key === 'dark' ? 0 : theme.key === 'champion-night' ? 250 : theme.key === 'emerald-flare' ? 180 : 120;

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
                    <span className="text-sm font-medium text-secondary-500">{price === 0 ? 'Ücretsiz' : `${price} coin`}</span>
                    {owned ? (
                      <Button variant={equipped ? 'secondary' : 'primary'} onClick={() => equipTheme(theme.key)}>
                        <Check className="h-4 w-4" />
                        {equipped ? 'Aktif' : 'Kuşan'}
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={() => buyTheme(theme.key)} disabled={user.coins < price}>
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
