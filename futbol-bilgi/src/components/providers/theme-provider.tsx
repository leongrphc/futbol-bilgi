'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { useEffect } from 'react';
import { useUserStore } from '@/lib/stores/user-store';
import { getEquippedThemeKey } from '@/lib/themes';

const APP_THEMES = [
  'dark',
  'green-grass',
  'golden-cup',
  'retro-pitch',
  'champion-night',
  'emerald-flare',
  'midnight-gold',
] as const;

function ThemeSync() {
  const user = useUserStore((state) => state.user);
  const { setTheme } = useTheme();

  useEffect(() => {
    const themeKey = getEquippedThemeKey(user?.settings, user?.inventory, user?.shop_items);
    setTheme(APP_THEMES.includes(themeKey) ? themeKey : 'dark');
  }, [user, setTheme]);

  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="data-theme" defaultTheme="dark" enableSystem={false} themes={[...APP_THEMES]}>
      <ThemeSync />
      {children}
    </NextThemesProvider>
  );
}
