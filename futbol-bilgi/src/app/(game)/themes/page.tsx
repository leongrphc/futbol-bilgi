"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";
import {
  Palette,
  Check,
  Lock,
  Sparkles,
  Copy,
  Phone,
  SkipForward,
  BatteryCharging,
  Percent,
  Users,
  Timer,
  Gem,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/lib/stores/user-store";
import {
  THEME_DEFINITION_MAP,
  THEME_DEFINITIONS,
  canAffordTheme,
  getDisplayThemeKey,
  getOwnedThemeItemIds,
  getResolvedThemeData,
  getThemeByKey,
  getThemeItemByKey,
  getThemePriceLabel,
  getThemePreviewStyle,
  type AppThemeKey,
} from "@/lib/themes";
import {
  FRAME_DEFINITION_MAP,
  FRAME_DEFINITIONS,
  canAffordFrame,
  getFrameItemByKey,
  getFramePriceLabel,
  getOwnedFrameItemIds,
  type AppFrameKey,
} from "@/lib/frames";
import { Avatar } from "@/components/ui/avatar";
import type { ShopItem, UserInventory } from "@/types";

interface ThemeShopResponse {
  shopItems: ShopItem[];
  inventory: UserInventory[];
}

interface FrameShopResponse {
  shopItems: ShopItem[];
  inventory: UserInventory[];
}

const utilityItems = [
  {
    key: "joker_fifty_fifty" as const,
    title: "%50 Joker",
    description: "İki yanlış şıkkı eler.",
    price: "50 coin",
    icon: Percent,
    stockKey: "fifty_fifty" as const,
  },
  {
    key: "joker_audience" as const,
    title: "Seyirci",
    description: "Seyirci dağılımını gösterir.",
    price: "75 coin",
    icon: Users,
    stockKey: "audience" as const,
  },
  {
    key: "joker_phone" as const,
    title: "Telefon Joker",
    description: "Tahmini doğru cevabı söyler.",
    price: "100 coin",
    icon: Phone,
    stockKey: "phone" as const,
  },
  {
    key: "joker_freeze_time" as const,
    title: "Süre Dondur",
    description: "Ek süre kazandırır.",
    price: "60 coin",
    icon: Timer,
    stockKey: "freeze_time" as const,
  },
  {
    key: "joker_skip" as const,
    title: "Pas Geç",
    description: "Soruyu değiştirir.",
    price: "120 coin",
    icon: SkipForward,
    stockKey: "skip" as const,
  },
  {
    key: "joker_double_answer" as const,
    title: "Çift Cevap",
    description: "Bir yanlış tahmin hakkı verir.",
    price: "80 coin",
    icon: Copy,
    stockKey: "double_answer" as const,
  },
  {
    key: "energy_refill_small" as const,
    title: "+1 Enerji",
    description: "Hemen 1 enerji doldurur.",
    price: "30 coin",
    icon: BatteryCharging,
    stockKey: null,
  },
];

const SHOP_TABS = {
  jokers: 'Jokerler',
  energy: 'Enerji',
  frames: 'Frame',
  themes: 'Temalar',
  collection: 'Koleksiyon',
} as const;

type ShopTab = keyof typeof SHOP_TABS;

export default function ThemesPage() {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const refreshUser = useUserStore((state) => state.refreshUser);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [purchasingKey, setPurchasingKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ShopTab>('themes');

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    const loadThemes = async () => {
      const [themeResponse, frameResponse] = await Promise.all([
        fetch("/api/shop/themes"),
        fetch("/api/shop/frames"),
      ]);

      if (!themeResponse.ok || !frameResponse.ok) {
        if (!isCancelled) {
          setIsLoading(false);
        }
        return;
      }

      const themeJson = await themeResponse.json();
      const frameJson = await frameResponse.json();
      const data = (themeJson.data ?? {
        shopItems: [],
        inventory: [],
      }) as ThemeShopResponse;
      const frameData = (frameJson.data ?? {
        shopItems: [],
        inventory: [],
      }) as FrameShopResponse;

      const resolved = getResolvedThemeData(
        user.id,
        data.shopItems,
        data.inventory,
      );

      const mergedInventory = [...resolved.inventory, ...frameData.inventory.filter((entry) => !resolved.inventory.some((themeEntry) => themeEntry.id === entry.id))];
      const mergedShopItems = [...resolved.shopItems, ...frameData.shopItems.filter((item) => !resolved.shopItems.some((themeItem) => themeItem.id === item.id))];

      if (!isCancelled) {
        setUser({
          ...user,
          inventory: mergedInventory,
          shop_items: mergedShopItems,
        });
        setIsLoading(false);
      }
    };

    void loadThemes();

    return () => {
      isCancelled = true;
    };
  }, [setUser, user?.id]);

  if (!user) {
    return null;
  }

  const resolvedThemeData = getResolvedThemeData(
    user.id,
    user.shop_items ?? [],
    user.inventory ?? [],
  );
  const shopItems = resolvedThemeData.shopItems;
  const inventory = resolvedThemeData.inventory;
  const ownedItemIds = getOwnedThemeItemIds(inventory);
  const ownedFrameItemIds = getOwnedFrameItemIds(inventory);
  const equippedThemeKey = getDisplayThemeKey(user.settings);
  const equippedFrameKey = (user.avatar_frame as AppFrameKey | null) ?? 'default';

  const buyTheme = async (themeKey: AppThemeKey) => {
    const item = getThemeItemByKey(themeKey, shopItems);
    if (!item) return;

    setPurchasingKey(themeKey);
    const response = await fetch("/api/shop/themes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id }),
    });

    const json = await response.json();
    setPurchasingKey(null);

    if (!response.ok) {
      setMessage(json.error || "Tema satın alınamadı.");
      return;
    }

    await refreshUser();
    setMessage(`${getThemeByKey(themeKey).label} satın alındı.`);
  };

  const equipTheme = async (themeKey: AppThemeKey) => {
    const item = getThemeItemByKey(themeKey, shopItems);
    const itemId = themeKey === "dark" ? "theme-dark-default" : item?.id;
    if (!itemId) return;

    setPurchasingKey(themeKey);
    const response = await fetch("/api/shop/themes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });

    const json = await response.json();
    setPurchasingKey(null);

    if (!response.ok) {
      setMessage(json.error || "Tema kuşanılamadı.");
      return;
    }

    await refreshUser();
    setMessage(`${THEME_DEFINITION_MAP[themeKey].label} kuşanıldı.`);
  };

  const handleUtilityPurchase = async (
    itemKey: (typeof utilityItems)[number]["key"],
  ) => {
    setPurchasingKey(itemKey);
    const response = await fetch("/api/shop/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemKey }),
    });

    const json = await response.json();
    setPurchasingKey(null);

    if (!response.ok) {
      setMessage(json.error || "Satın alma başarısız oldu.");
      return;
    }

    await refreshUser();
    setMessage("Satın alma tamamlandı.");
  };

  const buyFrame = async (frameKey: AppFrameKey) => {
    const item = getFrameItemByKey(frameKey, shopItems);
    if (!item) return;

    setPurchasingKey(`frame-${frameKey}`);
    const response = await fetch("/api/shop/frames", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id }),
    });

    const json = await response.json();
    setPurchasingKey(null);

    if (!response.ok) {
      setMessage(json.error || "Çerçeve satın alınamadı.");
      return;
    }

    await refreshUser();
    setMessage(`${FRAME_DEFINITION_MAP[frameKey].label} satın alındı.`);
  };

  const equipFrame = async (frameKey: AppFrameKey) => {
    setPurchasingKey(`frame-${frameKey}`);
    const response = await fetch("/api/shop/frames", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frameKey }),
    });

    const json = await response.json();
    setPurchasingKey(null);

    if (!response.ok) {
      setMessage(json.error || "Çerçeve kuşanılamadı.");
      return;
    }

    await refreshUser();
    setMessage(`${FRAME_DEFINITION_MAP[frameKey].label} kuşanıldı.`);
  };

  const collectionThemes = useMemo(
    () =>
      THEME_DEFINITIONS.filter((theme) => {
        const item = getThemeItemByKey(theme.key, shopItems);
        return item ? ownedItemIds.has(item.id) : theme.key === "dark";
      }),
    [ownedItemIds, shopItems],
  );

  const collectionFrames = useMemo(
    () =>
      FRAME_DEFINITIONS.filter((frame) => {
        if (frame.key === "default") return false;
        const item = getFrameItemByKey(frame.key, shopItems);
        return item ? ownedFrameItemIds.has(item.id) : false;
      }),
    [ownedFrameItemIds, shopItems],
  );

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">
              Mağaza
            </h1>
            <p className="text-sm text-text-secondary">
              Coin ile joker ve enerji al, gem ile premium ürünlere eriş.
            </p>
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
                {THEME_DEFINITION_MAP[equippedThemeKey].label}
              </p>
            </div>
          </div>
          <div className="text-right text-sm font-semibold text-secondary-500">
            <div>{user.coins} coin</div>
            <div>{user.gems} gem</div>
          </div>
        </Card>

        {message && (
          <Card padding="sm" className="text-sm text-text-secondary">
            {message}
          </Card>
        )}

        <Card padding="sm">
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 xl:grid-cols-5">
            {(Object.keys(SHOP_TABS) as ShopTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-semibold transition-all',
                  activeTab === tab
                    ? 'bg-primary-500 text-white'
                    : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
                )}
              >
                {SHOP_TABS[tab]}
              </button>
            ))}
          </div>
        </Card>

        {activeTab === 'jokers' && <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Jokerler
          </h2>
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
            {utilityItems
              .filter((item) => item.stockKey !== null)
              .map((item) => {
                const Icon = item.icon;
                const stock =
                  user.settings.jokers?.[item.stockKey ?? "fifty_fifty"] ?? 0;

                return (
                  <Card
                    key={item.key}
                    padding="lg"
                    className="flex h-full flex-col justify-between space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="rounded-xl bg-primary-500/10 p-3">
                        <Icon className="h-5 w-5 text-primary-500" />
                      </div>
                      <span className="text-xs font-semibold text-text-secondary">
                        Stok: {stock}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-text-primary">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-text-secondary">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-secondary-500">
                        {item.price}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUtilityPurchase(item.key)}
                        isLoading={purchasingKey === item.key}
                        disabled={user.coins < Number.parseInt(item.price, 10)}
                      >
                        Satın Al
                      </Button>
                    </div>
                  </Card>
                );
              })}
          </div>
        </section>}

        {activeTab === 'energy' && <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Enerji
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {utilityItems
              .filter((item) => item.stockKey === null)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.key}
                    padding="lg"
                    className="flex h-full flex-col justify-between space-y-4"
                  >
                    <div className="rounded-xl bg-warning/10 p-3 w-fit">
                      <Icon className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-text-primary">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-text-secondary">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-secondary-500">
                        {item.price}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUtilityPurchase(item.key)}
                        isLoading={purchasingKey === item.key}
                        disabled={
                          user.energy >= 5 ||
                          user.coins < Number.parseInt(item.price, 10)
                        }
                      >
                        {user.energy >= 5 ? "Dolu" : "Satın Al"}
                      </Button>
                    </div>
                  </Card>
                );
              })}
          </div>
        </section>}

        {activeTab === 'frames' && <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-secondary-500" />
            <h2 className="font-display text-lg font-semibold text-text-primary">
              Premium Kozmetikler
            </h2>
          </div>
          <p className="text-sm text-text-secondary">
            Gem ile alınan kozmetikler nadir kalır ve hesabına prestij katar.
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {FRAME_DEFINITIONS.filter((frame) => frame.key !== "default").map((frame) => {
              const item = getFrameItemByKey(frame.key, shopItems);
              const owned = item ? ownedFrameItemIds.has(item.id) : false;
              const equipped = equippedFrameKey === frame.key;
              const requiresPremium = Boolean(item?.metadata?.isPremium) && !user.is_premium;

              return (
                <motion.div key={frame.key} whileHover={{ y: -4, scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Card padding="lg" className="space-y-4 transition-shadow hover:shadow-xl hover:shadow-secondary-500/10">
                    <div className="flex items-center justify-center rounded-2xl bg-bg-elevated p-6">
                      <Avatar size="xl" fallback={user.username} frame={frame.key} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-lg font-semibold text-text-primary">{frame.label}</h3>
                        <span className="flex items-center gap-1 text-xs font-semibold text-secondary-500">
                          <Sparkles className="h-3 w-3" />
                          {frame.rarity}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-text-secondary">{frame.description}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-secondary-500">
                        {equipped
                          ? "Aktif"
                          : owned
                            ? "Sahip Olundu"
                            : requiresPremium
                              ? "Premium Gerekli"
                              : getFramePriceLabel(item)}
                      </span>
                      {owned ? (
                        <Button
                          variant={equipped ? "secondary" : "primary"}
                          onClick={() => equipFrame(frame.key)}
                          isLoading={purchasingKey === `frame-${frame.key}`}
                        >
                          <Check className="h-4 w-4" />
                          {equipped ? "Aktif" : "Kuşan"}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => buyFrame(frame.key)}
                          disabled={requiresPremium || !canAffordFrame(item, user.coins, user.gems) || isLoading || purchasingKey === `frame-${frame.key}`}
                          isLoading={purchasingKey === `frame-${frame.key}`}
                        >
                          {requiresPremium ? <Lock className="h-4 w-4" /> : null}
                          {requiresPremium ? "Premium Gerekli" : "Satın Al"}
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>}

        {activeTab === 'themes' && <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Temalar
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {THEME_DEFINITIONS.map((theme) => {
              const item = getThemeItemByKey(theme.key, shopItems);
              const owned = item
                ? ownedItemIds.has(item.id)
                : theme.key === "dark";
              const equipped = equippedThemeKey === theme.key;
              const isPremiumTheme = Boolean(item?.metadata?.isPremium);
              const requiresPremium = isPremiumTheme && !user.is_premium;

              return (
                <motion.div key={theme.key} whileHover={{ y: -4, scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Card padding="lg" className="space-y-4 transition-shadow hover:shadow-xl hover:shadow-primary-500/10">
                    <div
                      className="h-24 rounded-2xl"
                      style={getThemePreviewStyle(theme.key)}
                    />
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-lg font-semibold text-text-primary">
                          {theme.label}
                        </h3>
                        <div className="flex items-center gap-2">
                          {isPremiumTheme && (
                            <span className="rounded-full bg-secondary-500 px-2 py-0.5 text-[10px] font-bold text-bg-primary">
                              Premium
                            </span>
                          )}
                          {theme.rarity !== "common" && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-secondary-500">
                              <Sparkles className="h-3 w-3" />
                              {theme.rarity}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-text-secondary">
                        {theme.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-secondary-500">
                        {equipped
                          ? "Aktif"
                          : owned
                            ? "Sahip Olundu"
                            : requiresPremium
                              ? "Premium Gerekli"
                              : getThemePriceLabel(item)}
                      </span>
                      {owned ? (
                        <Button
                          variant={equipped ? "secondary" : "primary"}
                          onClick={() => equipTheme(theme.key)}
                          disabled={equipped || (!item && theme.key !== "dark")}
                          isLoading={purchasingKey === theme.key}
                        >
                          <Check className="h-4 w-4" />
                          {equipped ? "Aktif" : "Kuşan"}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => buyTheme(theme.key)}
                          disabled={
                            requiresPremium ||
                            !canAffordTheme(item, user.coins, user.gems) ||
                            isLoading ||
                            purchasingKey === theme.key
                          }
                          isLoading={purchasingKey === theme.key}
                        >
                          {requiresPremium ? <Lock className="h-4 w-4" /> : null}
                          {requiresPremium ? "Premium Gerekli" : "Satın Al"}
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>}

        {activeTab === 'collection' && <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Koleksiyonum
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {collectionThemes.map((theme) => {
              const equipped = equippedThemeKey === theme.key;
              const item = getThemeItemByKey(theme.key, shopItems);

              return (
                <Card
                  key={`owned-${theme.key}`}
                  padding="lg"
                  className="space-y-4"
                >
                  <div
                    className="h-20 rounded-2xl"
                    style={getThemePreviewStyle(theme.key)}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-text-primary">
                        {theme.label}
                      </h3>
                      <p className="mt-1 text-sm text-text-secondary">
                        {theme.description}
                      </p>
                    </div>
                    {equipped && (
                      <span className="text-xs font-semibold text-success">
                        Aktif
                      </span>
                    )}
                  </div>
                  <Button
                    variant={equipped ? "secondary" : "primary"}
                    onClick={() => equipTheme(theme.key)}
                    disabled={equipped || (!item && theme.key !== "dark")}
                    isLoading={purchasingKey === theme.key}
                  >
                    <Check className="h-4 w-4" />
                    {equipped ? "Kuşanıldı" : "Kuşan"}
                  </Button>
                </Card>
              );
            })}
          </div>

          {collectionFrames.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="font-display text-base font-semibold text-text-primary">Çerçeve Koleksiyonum</h3>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {collectionFrames.map((frame) => {
                  const equipped = equippedFrameKey === frame.key;

                  return (
                    <Card key={`owned-frame-${frame.key}`} padding="lg" className="space-y-4">
                      <div className="flex items-center justify-center rounded-2xl bg-bg-elevated p-6">
                        <Avatar size="xl" fallback={user.username} frame={frame.key} />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="font-display text-lg font-semibold text-text-primary">{frame.label}</h3>
                          <p className="mt-1 text-sm text-text-secondary">{frame.description}</p>
                        </div>
                        {equipped && (
                          <span className="text-xs font-semibold text-success">Aktif</span>
                        )}
                      </div>
                      <Button
                        variant={equipped ? "secondary" : "primary"}
                        onClick={() => equipFrame(frame.key)}
                        disabled={equipped}
                        isLoading={purchasingKey === `frame-${frame.key}`}
                      >
                        <Check className="h-4 w-4" />
                        {equipped ? "Kuşanıldı" : "Kuşan"}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </section>}
      </div>
    </div>
  );
}
