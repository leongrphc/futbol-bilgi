'use client';

import { useEffect } from 'react';
import { useNotifications } from '@/lib/hooks/use-notifications';
import { useUserStore } from '@/lib/stores/user-store';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isSupported, permission, isSubscribed, subscribe, isLoading } = useNotifications();
  const notificationsEnabled = useUserStore((state) => state.user?.settings?.notifications_enabled);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !isSupported || permission !== 'granted' || !notificationsEnabled || isSubscribed) {
      return;
    }

    const timer = setTimeout(() => {
      subscribe().catch(console.error);
    }, 5000);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, isSupported, permission, notificationsEnabled, isSubscribed, subscribe]);

  return <>{children}</>;
}
