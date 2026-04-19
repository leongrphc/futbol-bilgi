"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import type { ShopItem, UserInventory } from "@/types";

interface ThemeShopResponse {
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

export default function ThemesPage() {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [purchasingKey, setPurchasingKey] = useState<string | null>(null);

  useEffect(() => {
    const loadThemes = async () => {
      const response = await fetch("/api/shop/themes");
      if (!response.ok || !user) {
        setIsLoading(false);
        return;
      }

      const json = await response.json();
      const data = (json.data ?? {
        shopItems: [],
        inventory: [],
      }) as ThemeShopResponse;
      const resolved = getResolvedThemeData(
        user.id,
        data.shopItems,
        data.inventory,
      );

      setUser({
        ...user,
        inventory: resolved.inventory,
        shop_items: resolved.shopItems,
      });
      setIsLoading(false);
    };

    void loadThemes();
  }, [user, setUser]);

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
  const equippedThemeKey = getDisplayThemeKey(user.settings);

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

    setUser({
      ...user,
      coins: json.data.profile.coins,
      gems: json.data.profile.gems,
      inventory: [...inventory, json.data.inventory],
      shop_items: shopItems,
    });
    setMessage(`${getThemeByKey(themeKey).label} satın alındı.`);
  };

  const equipTheme = async (themeKey: AppThemeKey) => {
    if (themeKey === "dark") {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { theme: "dark" } }),
      });

      if (!response.ok) {
        const json = await response.json();
        setMessage(json.error || "Tema kuşanılamadı.");
        return;
      }

      setUser({
        ...user,
        settings: {
          ...user.settings,
          theme: "dark",
        },
      });
      setMessage("Klasik Gece kuşanıldı.");
      return;
    }

    const item = getThemeItemByKey(themeKey, shopItems);
    if (!item) return;

    const response = await fetch("/api/shop/themes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id }),
    });

    if (!response.ok) {
      const json = await response.json();
      setMessage(json.error || "Tema kuşanılamadı.");
      return;
    }

    const nextInventory = inventory.map((entry) => ({
      ...entry,
      is_equipped: entry.item_id === item.id,
    }));

    await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: { theme: themeKey } }),
    });

    setUser({
      ...user,
      inventory: nextInventory,
      settings: {
        ...user.settings,
        theme: themeKey,
      },
      shop_items: shopItems,
    });
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

    setUser({
      ...user,
      ...json.data.profile,
    });
    setMessage("Satın alma tamamlandı.");
  };

  const collectionThemes = useMemo(
    () =>
      THEME_DEFINITIONS.filter((theme) => {
        const item = getThemeItemByKey(theme.key, shopItems);
        return item ? ownedItemIds.has(item.id) : theme.key === "dark";
      }),
    [ownedItemIds, shopItems],
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

        <section className="space-y-3">
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
        </section>

        <section className="space-y-3">
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
        </section>

        <section className="space-y-3">
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
                <Card key={theme.key} padding="lg" className="space-y-4">
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
                      {requiresPremium
                        ? "Premium Gerekli"
                        : getThemePriceLabel(item)}
                    </span>
                    {owned ? (
                      <Button
                        variant={equipped ? "secondary" : "primary"}
                        onClick={() => equipTheme(theme.key)}
                        disabled={!item && theme.key !== "dark"}
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
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Koleksiyonum
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
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
                    disabled={!item && theme.key !== "dark"}
                  >
                    <Check className="h-4 w-4" />
                    {equipped ? "Kuşanıldı" : "Kuşan"}
                  </Button>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
