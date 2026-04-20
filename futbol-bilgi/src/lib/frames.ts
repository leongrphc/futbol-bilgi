import type { ShopItem, UserInventory } from '@/types';

export type AppFrameKey = 'default' | 'silver' | 'gold' | 'diamond' | 'champion';

interface RawFrameShopItem {
  id: string;
  item_type: string;
  name: string;
  description: string | null;
  preview_url: string | null;
  price_coins: number | null;
  price_gems: number | null;
  is_active: boolean;
  is_premium: boolean;
  created_at: string;
}

export interface FrameDefinition {
  key: AppFrameKey;
  label: string;
  description: string;
  rarity: ShopItem['rarity'];
}

const SHOP_FRAME_KEY_MAP: Record<string, AppFrameKey> = {
  'Bronz Çerçeve': 'default',
  'Gümüş Çerçeve': 'silver',
  'Altın Çerçeve': 'gold',
  'Elmas Çerçeve': 'diamond',
  'Şampiyon Çerçeve': 'champion',
};

export const FRAME_DEFINITIONS: FrameDefinition[] = [
  { key: 'default', label: 'Klasik Çerçeve', description: 'Varsayılan avatar çerçevesi.', rarity: 'common' },
  { key: 'silver', label: 'Gümüş Çerçeve', description: 'Parlak ve temiz gümüş görünüm.', rarity: 'rare' },
  { key: 'gold', label: 'Altın Çerçeve', description: 'Daha prestijli altın görünüm.', rarity: 'epic' },
  { key: 'diamond', label: 'Elmas Çerçeve', description: 'Gem ile alınan premium elmas çerçeve.', rarity: 'legendary' },
  { key: 'champion', label: 'Şampiyon Çerçeve', description: 'En üst seviye premium şampiyon çerçevesi.', rarity: 'legendary' },
];

export const FRAME_DEFINITION_MAP = Object.fromEntries(
  FRAME_DEFINITIONS.map((frame) => [frame.key, frame])
) as Record<AppFrameKey, FrameDefinition>;

export function getFrameKeyFromShopItemName(name: string): AppFrameKey | null {
  return SHOP_FRAME_KEY_MAP[name] ?? null;
}

export function mapFrameShopItem(item: RawFrameShopItem): ShopItem | null {
  const frameKey = getFrameKeyFromShopItemName(item.name);

  if (!frameKey) {
    return null;
  }

  return {
    id: item.id,
    name: item.name,
    description: item.description ?? '',
    type: 'avatar',
    sub_type: 'avatar_frame',
    price_coins: item.price_coins,
    price_gems: item.price_gems,
    image_url: item.preview_url,
    rarity: FRAME_DEFINITION_MAP[frameKey].rarity,
    is_available: item.is_active,
    metadata: { frameKey, isPremium: item.is_premium },
    created_at: item.created_at,
  };
}

export function getFrameMetadataKey(item: ShopItem | undefined) {
  const frameKey = item?.metadata?.frameKey;
  return typeof frameKey === 'string' ? (frameKey as AppFrameKey) : null;
}

export function getFrameItemByKey(frameKey: AppFrameKey, shopItems: ShopItem[]) {
  return shopItems.find((item) => getFrameMetadataKey(item) === frameKey);
}

export function getOwnedFrameItemIds(inventory: UserInventory[] = []) {
  return new Set(inventory.map((item) => item.item_id));
}

export function getFramePriceLabel(item: ShopItem | undefined) {
  if (!item) return 'Yakında';
  if ((item.price_gems ?? 0) > 0) return `${item.price_gems} gem`;
  if ((item.price_coins ?? 0) > 0) return `${item.price_coins} coin`;
  return 'Ücretsiz';
}

export function canAffordFrame(item: ShopItem | undefined, coins: number, gems: number) {
  if (!item) return false;
  return coins >= (item.price_coins ?? 0) && gems >= (item.price_gems ?? 0);
}
