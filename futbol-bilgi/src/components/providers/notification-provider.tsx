'use client';

import { useEffect, useState } from 'react';
import { useNotifications } from '@/lib/hooks/use-notifications';
import { useUserStore } from '@/lib/stores/user-store';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isSupported, permission, isSubscribed, subscribe } = useNotifications();
  const notificationsEnabled = useUserStore((state) => state.user?.settings?.notifications_enabled);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Automatically attempt to subscribe if they have enabled notifications in settings
  // but are not currently subscribed on this device
  useEffect(() => {
    if (mounted && isAuthenticated && isSupported && permission === 'granted' && notificationsEnabled && !isSubscribed) {
      // Small timeout to not block rendering
      const timer = setTimeout(() => {
        subscribe().catch(console.error);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [mounted, isAuthenticated, isSupported, permission, notificationsEnabled, isSubscribed, subscribe]);

  return <>{children}</>;
}
