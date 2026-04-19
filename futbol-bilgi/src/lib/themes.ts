import type { ShopItem, UserInventory, UserSettings } from '@/types';

export type AppThemeKey = 'dark' | 'champion-night' | 'emerald-flare' | 'midnight-gold';

export interface ThemeDefinition {
  key: AppThemeKey;
  label: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  preview: {
    primary: string;
    secondary: string;
    background: string;
  };
}

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
    key: 'champion-night',
    label: 'Şampiyon Gecesi',
    description: 'Altın ışıltılı premium gece teması.',
    rarity: 'legendary',
    preview: {
      primary: '#ffca28',
      secondary: '#ffe082',
      background: '#101323',
    },
  },
  {
    key: 'emerald-flare',
    label: 'Zümrüt Alevi',
    description: 'Parlak yeşil vurgulu modern tema.',
    rarity: 'epic',
    preview: {
      primary: '#00c853',
      secondary: '#69f0ae',
      background: '#081510',
    },
  },
  {
    key: 'midnight-gold',
    label: 'Gece Altını',
    description: 'Gece mavisi ve altın kombinasyonu.',
    rarity: 'rare',
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

export function getEquippedThemeKey(
  settings: UserSettings | null | undefined,
  inventory: UserInventory[] = [],
  shopItems: ShopItem[] = []
): AppThemeKey {
  const equippedThemeItem = inventory.find((entry) => entry.is_equipped);

  if (equippedThemeItem) {
    const item = shopItems.find((shopItem) => shopItem.id === equippedThemeItem.item_id);
    const themeKey = item?.metadata?.themeKey;

    if (typeof themeKey === 'string' && themeKey in THEME_DEFINITION_MAP) {
      return themeKey as AppThemeKey;
    }
  }

  if (settings?.theme === 'light' || settings?.theme === 'system') {
    return 'dark';
  }

  if (settings?.theme && settings.theme in THEME_DEFINITION_MAP) {
    return settings.theme as AppThemeKey;
  }

  return 'dark';
}
