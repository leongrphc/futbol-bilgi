import type { User } from '@/types';

export const IAP_PRODUCT_CONFIG = {
  gems_small: { gems: 50, coins: 0, repeatable: true, label: 'Küçük Gem Paketi', entitlementType: 'consumable' },
  gems_medium: { gems: 200, coins: 0, repeatable: true, label: 'Orta Gem Paketi', entitlementType: 'consumable' },
  gems_large: { gems: 500, coins: 0, repeatable: true, label: 'Büyük Gem Paketi', entitlementType: 'consumable' },
  starter_pack: { gems: 100, coins: 5000, repeatable: false, label: 'Başlangıç Paketi', entitlementType: 'one_time' },
  premium_pass: { gems: 0, coins: 0, repeatable: false, label: 'Premium Pass', entitlementType: 'premium' },
} as const;

export type IapProductId = keyof typeof IAP_PRODUCT_CONFIG;

export function isIapProductId(value: unknown): value is IapProductId {
  return typeof value === 'string' && value in IAP_PRODUCT_CONFIG;
}

export function applyIapGrant(profile: Pick<User, 'coins' | 'gems' | 'is_premium' | 'settings'>, productId: IapProductId) {
  const product = IAP_PRODUCT_CONFIG[productId];
  const nextSettings = { ...(profile.settings ?? {}) } as Record<string, unknown>;
  const purchases = ((nextSettings.purchases as Record<string, boolean> | undefined) ?? {});

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

  return {
    coins: profile.coins + product.coins,
    gems: profile.gems + product.gems,
    is_premium: productId === 'premium_pass' ? true : profile.is_premium,
    settings: nextSettings,
    purchase: {
      productId,
      label: product.label,
      gems: product.gems,
      coins: product.coins,
    },
  };
}
