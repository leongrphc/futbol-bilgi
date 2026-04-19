'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { useEffect } from 'react';
import { useUserStore } from '@/lib/stores/user-store';
import { getEquippedThemeKey } from '@/lib/themes';

function ThemeSync() {
  const user = useUserStore((state) => state.user);
  const { setTheme } = useTheme();

  useEffect(() => {
    const themeKey = getEquippedThemeKey(user?.settings, user?.inventory, user?.shop_items);
    setTheme(themeKey);
  }, [user, setTheme]);

  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="data-theme" defaultTheme="dark" enableSystem={false}>
      <ThemeSync />
      {children}
    </NextThemesProvider>
  );
}
