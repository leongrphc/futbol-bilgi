'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/stores/user-store';
import type { ShopItem, User, UserInventory, UserSettings } from '@/types';

interface ThemeShopPayload {
  shopItems: ShopItem[];
  inventory: UserInventory[];
}

const defaultSettings: UserSettings = {
  sound_enabled: true,
  music_enabled: true,
  vibration_enabled: true,
  notifications_enabled: true,
  language: 'tr',
  theme: 'dark',
};

function buildUser(sessionUser: {
  id: string;
  email?: string;
  created_at: string;
  updated_at?: string;
  user_metadata?: { username?: string };
}, profile: Partial<User> | null, themeData: ThemeShopPayload): User {
  return {
    id: sessionUser.id,
    email: sessionUser.email || '',
    username: profile?.username || sessionUser.user_metadata?.username || sessionUser.email?.split('@')[0] || 'Oyuncu',
    avatar_url: profile?.avatar_url ?? null,
    avatar_frame: profile?.avatar_frame ?? null,
    favorite_team: profile?.favorite_team ?? null,
    level: profile?.level ?? 1,
    xp: profile?.xp ?? 0,
    coins: profile?.coins ?? 100,
    gems: profile?.gems ?? 10,
    energy: profile?.energy ?? 5,
    energy_last_refill: profile?.energy_last_refill ?? new Date().toISOString(),
    league_tier: profile?.league_tier ?? 'bronze',
    elo_rating: profile?.elo_rating ?? 1000,
    streak_days: profile?.streak_days ?? 0,
    last_daily_claim: profile?.last_daily_claim ?? null,
    total_questions_answered: profile?.total_questions_answered ?? 0,
    total_correct_answers: profile?.total_correct_answers ?? 0,
    settings: { ...defaultSettings, ...(profile?.settings ?? {}) },
    inventory: themeData.inventory,
    shop_items: themeData.shopItems,
    is_premium: profile?.is_premium ?? false,
    created_at: sessionUser.created_at,
    updated_at: profile?.updated_at ?? sessionUser.updated_at ?? sessionUser.created_at,
  };
}

async function fetchThemeData(): Promise<ThemeShopPayload> {
  const response = await fetch('/api/shop/themes');

  if (!response.ok) {
    return { shopItems: [], inventory: [] };
  }

  const json = await response.json();
  return json.data ?? { shopItems: [], inventory: [] };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const setLoading = useUserStore((state) => state.setLoading);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    const syncUser = async (sessionUser: {
      id: string;
      email?: string;
      created_at: string;
      updated_at?: string;
      user_metadata?: { username?: string };
    }) => {
      const [{ data: profile, error: profileError }, themeData] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', sessionUser.id).maybeSingle(),
        fetchThemeData(),
      ]);

      if (!mounted) {
        return;
      }

      if (profileError) {
        console.error('Profile error:', profileError.message);
      }

      setUser(buildUser(sessionUser, profile, themeData));
    };

    const loadSession = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error.message);
          if (mounted) clearUser();
          return;
        }

        if (session?.user) {
          await syncUser(session.user);
        } else if (mounted) {
          clearUser();
        }
      } catch (error) {
        console.error('Error loading session:', error);
        if (mounted) clearUser();
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        await syncUser(session.user);
        return;
      }

      if (event === 'SIGNED_OUT') {
        clearUser();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, setUser, clearUser, setLoading]);

  return <>{children}</>;
}
