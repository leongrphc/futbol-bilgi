import { useState, useEffect } from 'react';
import { useUserStore } from '../stores/user-store';
import { registerServiceWorker, requestNotificationPermission, urlBase64ToUint8Array } from '../utils/notifications';

const isPushSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

export function useNotifications() {
  const [isSupported, setIsSupported] = useState(isPushSupported);
  const [permission, setPermission] = useState<NotificationPermission>(typeof window !== 'undefined' ? Notification.permission : 'default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(isPushSupported);

  const notificationsEnabled = useUserStore((state) => state.user?.settings?.notifications_enabled);
  const updateSettings = useUserStore((state) => state.updateSettings);

  useEffect(() => {
    if (!isPushSupported) {
      return;
    }

    registerServiceWorker().finally(() => {
      checkSubscription();
    });
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);

      // Update store state to match reality if they drifted
      if (!!subscription !== notificationsEnabled) {
        updateSettings({ notifications_enabled: !!subscription });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async () => {
    if (!isSupported) return false;

    setIsLoading(true);

    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        console.error('VAPID public key not found');
        return false;
      }

      // Request permission if not already granted
      const currentPermission = await requestNotificationPermission();
      setPermission(currentPermission as NotificationPermission);

      if (currentPermission !== 'granted') {
        throw new Error('Permission not granted for Notification');
      }

      const registration = await registerServiceWorker();
      if (!registration) {
        throw new Error('Service Worker registration failed');
      }

      // Wait for SW to be active
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Parse keys
      const p256dh = subscription.getKey('p256dh');
      const auth = subscription.getKey('auth');

      if (!p256dh || !auth) {
        throw new Error('Missing keys in subscription');
      }

      // Save to backend
      const result = await fetch('/api/notifications/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dh)))),
            auth: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(auth)))),
          },
        }),
      });

      if (!result.ok) {
        const errorData = await result.json();
        throw new Error(errorData.error || 'Failed to save subscription');
      }

      setIsSubscribed(true);
      updateSettings({ notifications_enabled: true });
      return true;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!isSupported) return false;

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;

        // Unsubscribe from browser
        const successful = await subscription.unsubscribe();

        if (successful) {
          // Remove from backend
          await fetch('/api/notifications/subscription', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ endpoint }),
          });

          setIsSubscribed(false);
          updateSettings({ notifications_enabled: false });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubscription = async () => {
    if (isSubscribed) {
      return await unsubscribe();
    } else {
      return await subscribe();
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    toggleSubscription,
  };
}
