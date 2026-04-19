import type { ShopItem, UserInventory, UserSettings } from '@/types';

export type AppThemeKey = 'dark' | 'green-grass' | 'golden-cup' | 'retro-pitch';

interface RawThemeShopItem {
  id: string;
  item_type: string;
  name: string;
  description: string | null;
  preview_url: string | null;
  price_coins: number | null;
  price_gems: number | null;
  is_active: boolean;
  created_at: string;
}

export interface ThemeDefinition {
  key: AppThemeKey;
  label: string;
  description: string;
  rarity: ShopItem['rarity'];
  preview: {
    primary: string;
    secondary: string;
    background: string;
  };
}

const defaultSettings: UserSettings = {
  sound_enabled: true,
  music_enabled: true,
  vibration_enabled: true,
  notifications_enabled: true,
  language: 'tr',
  theme: 'dark',
};

const SHOP_THEME_KEY_MAP: Record<string, AppThemeKey> = {
  'Stadyum Gecesi': 'dark',
  'Yeşil Çim': 'green-grass',
  'Altın Kupa': 'golden-cup',
  Retro: 'retro-pitch',
};

export const THEME_DEFINITIONS: ThemeDefinition[] = [
  {
    key: 'dark',
    label: 'Klasik Gece',
    description: 'Varsayılan koyu tema.',
    rarity: 'common',
    preview: {
      primary: '#2e7d32',
      secondary: '#ffc107',
      background: '#0d1117',
    },
  },
  {
    key: 'green-grass',
    label: 'Yeşil Çim',
    description: 'Taze çim hissi veren canlı yeşil tema.',
    rarity: 'rare',
    preview: {
      primary: '#00c853',
      secondary: '#69f0ae',
      background: '#081510',
    },
  },
  {
    key: 'golden-cup',
    label: 'Altın Kupa',
    description: 'Şampiyonluk vurgulu altın premium tema.',
    rarity: 'epic',
    preview: {
      primary: '#ffca28',
      secondary: '#ffe082',
      background: '#101323',
    },
  },
  {
    key: 'retro-pitch',
    label: 'Retro Saha',
    description: 'Nostaljik futbol akşamlarını çağrıştıran tema.',
    rarity: 'legendary',
    preview: {
      primary: '#ffb300',
      secondary: '#58a6ff',
      background: '#0b1320',
    },
  },
];

export const THEME_DEFINITION_MAP = Object.fromEntries(
  THEME_DEFINITIONS.map((theme) => [theme.key, theme])
) as Record<AppThemeKey, ThemeDefinition>;

export function getThemeKeyFromShopItemName(name: string): AppThemeKey | null {
  return SHOP_THEME_KEY_MAP[name] ?? null;
}

export function getThemeKeyFromShopItem(item: Pick<RawThemeShopItem, 'name'>): AppThemeKey | null {
  return getThemeKeyFromShopItemName(item.name);
}

export function mapThemeShopItem(item: RawThemeShopItem): ShopItem | null {
  const themeKey = getThemeKeyFromShopItem(item);

  if (!themeKey) {
    return null;
  }

  return {
    id: item.id,
    name: item.name,
    description: item.description ?? '',
    type: 'theme',
    sub_type: null,
    price_coins: item.price_coins,
    price_gems: item.price_gems,
    image_url: item.preview_url,
    rarity: THEME_DEFINITION_MAP[themeKey].rarity,
    is_available: item.is_active,
    metadata: { themeKey },
    created_at: item.created_at,
  };
}

export function getDefaultThemeShopItem(): ShopItem {
  return {
    id: 'theme-dark-default',
    name: 'Stadyum Gecesi',
    description: 'Varsayılan koyu tema.',
    type: 'theme',
    sub_type: null,
    price_coins: 0,
    price_gems: 0,
    image_url: null,
    rarity: 'common',
    is_available: true,
    metadata: { themeKey: 'dark' },
    created_at: new Date().toISOString(),
  };
}

export function getDefaultThemeInventory(userId: string): UserInventory[] {
  return [
    {
      id: 'inventory-dark',
      user_id: userId,
      item_id: 'theme-dark-default',
      quantity: 1,
      is_equipped: true,
      purchased_at: new Date().toISOString(),
    },
  ];
}

export function ensureDefaultThemeCatalog(shopItems: ShopItem[]) {
  return shopItems.some((item) => item.id === 'theme-dark-default')
    ? shopItems
    : [getDefaultThemeShopItem(), ...shopItems];
}

export function ensureDefaultThemeInventory(userId: string, inventory: UserInventory[]) {
  return inventory.length > 0 ? inventory : getDefaultThemeInventory(userId);
}

export function getResolvedThemeData(userId: string, shopItems: ShopItem[], inventory: UserInventory[]) {
  return {
    shopItems: ensureDefaultThemeCatalog(shopItems),
    inventory: ensureDefaultThemeInventory(userId, inventory),
  };
}

export function getThemeMetadataKey(item: ShopItem | undefined) {
  const themeKey = item?.metadata?.themeKey;
  return typeof themeKey === 'string' ? (themeKey as AppThemeKey) : null;
}

export function getThemeItemByKey(themeKey: AppThemeKey, shopItems: ShopItem[]) {
  return shopItems.find((item) => getThemeMetadataKey(item) === themeKey);
}

export function getOwnedThemeItemIds(inventory: UserInventory[] = []) {
  return new Set(inventory.map((item) => item.item_id));
}

export function getDisplayThemeKey(settings: UserSettings | null | undefined) {
  if (!settings) return 'dark';
  if (settings.theme === 'light' || settings.theme === 'system') return 'dark';
  return settings.theme in THEME_DEFINITION_MAP ? (settings.theme as AppThemeKey) : 'dark';
}

export function getEquippedThemeKey(
  settings: UserSettings | null | undefined,
  inventory: UserInventory[] = [],
  shopItems: ShopItem[] = []
): AppThemeKey {
  const equippedEntry = inventory.find((entry) => entry.is_equipped);
  if (equippedEntry) {
    const item = shopItems.find((shopItem) => shopItem.id === equippedEntry.item_id);
    const themeKey = getThemeMetadataKey(item);
    if (themeKey) {
      return themeKey;
    }
  }

  return getDisplayThemeKey(settings);
}

export function getThemeByKey(themeKey: AppThemeKey) {
  return THEME_DEFINITION_MAP[themeKey];
}

export function getThemePreviewStyle(themeKey: AppThemeKey) {
  const preview = THEME_DEFINITION_MAP[themeKey].preview;
  return {
    background: `linear-gradient(135deg, ${preview.background} 0%, ${preview.primary} 55%, ${preview.secondary} 100%)`,
  };
}

export function getThemePriceLabel(item: ShopItem | undefined) {
  if (!item) return 'Yakında';
  if ((item.price_coins ?? 0) > 0) return `${item.price_coins} coin`;
  if ((item.price_gems ?? 0) > 0) return `${item.price_gems} gem`;
  return 'Ücretsiz';
}

export function canAffordTheme(item: ShopItem | undefined, coins: number, gems: number) {
  if (!item) return false;
  return coins >= (item.price_coins ?? 0) && gems >= (item.price_gems ?? 0);
}

export function normalizeThemeSettings(settings: UserSettings | null | undefined) {
  return { ...defaultSettings, ...(settings ?? {}) };
}
