'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { identifyUser, initAnalytics, resetAnalytics, trackPageView } from '@/lib/analytics';
import { useUserStore } from '@/lib/stores/user-store';

function getRouteGroup(pathname: string) {
  if (pathname === '/login' || pathname === '/register') {
    return 'auth';
  }

  if (pathname.startsWith('/admin')) {
    return 'admin';
  }

  if (pathname === '/' || pathname.startsWith('/play') || pathname.startsWith('/leaderboard') || pathname.startsWith('/profile')) {
    return 'game';
  }

  return 'root';
}

function getScreenName(pathname: string) {
  if (pathname === '/') return 'home';
  if (pathname === '/login') return 'login';
  if (pathname === '/register') return 'register';
  if (pathname === '/play') return 'play_hub';
  if (pathname === '/play/millionaire') return 'millionaire';
  if (pathname === '/play/quick') return 'quick';
  if (pathname === '/play/duel') return 'duel';
  if (pathname === '/play/daily') return 'daily';
  if (pathname === '/leaderboard') return 'leaderboard';
  if (pathname === '/profile') return 'profile';
  if (pathname === '/admin') return 'admin_dashboard';
  return pathname.replace(/\//g, '_').replace(/^_+/, '') || 'unknown';
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useUserStore((state) => state.user);
  const identifiedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(getScreenName(pathname), {
      path: pathname,
      route_group: getRouteGroup(pathname),
      screen_name: getScreenName(pathname),
    });
  }, [pathname]);

  useEffect(() => {
    if (user?.id) {
      identifiedUserIdRef.current = user.id;
      identifyUser(user.id, {
        username: user.username,
        league_tier: user.league_tier,
        is_premium: user.is_premium,
      });
      return;
    }

    if (identifiedUserIdRef.current) {
      identifiedUserIdRef.current = null;
      resetAnalytics();
    }
  }, [user]);

  return <>{children}</>;
}
