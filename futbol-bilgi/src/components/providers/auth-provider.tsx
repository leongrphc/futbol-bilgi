'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/stores/user-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const setLoading = useUserStore((state) => state.setLoading);

  const [isInitialized, setIsInitialized] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    // Load initial session
    const loadSession = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error.message);
          if (mounted) clearUser();
          return;
        }

        if (session?.user && mounted) {
          // Construct user object based on our User type
          // Normally we would fetch the full profile from a 'profiles' or 'users' table here
          // For now, we mock it based on what we have in auth
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'Oyuncu',
            avatar_url: null,
            avatar_frame: null,
            favorite_team: null,
            level: 1,
            xp: 0,
            coins: 100,
            gems: 10,
            energy: 5,
            energy_last_refill: new Date().toISOString(),
            league_tier: 'bronze',
            elo_rating: 1000,
            streak_days: 0,
            last_daily_claim: null,
            total_questions_answered: 0,
            total_correct_answers: 0,
            settings: {
              sound_enabled: true,
              music_enabled: true,
              vibration_enabled: true,
              notifications_enabled: true,
              language: 'tr',
              theme: 'dark'
            },
            is_premium: false,
            created_at: session.user.created_at,
            updated_at: session.user.updated_at || session.user.created_at
          });
        } else if (mounted) {
          clearUser();
        }
      } catch (err) {
        console.error('Error loading session:', err);
        if (mounted) clearUser();
      } finally {
        if (mounted) {
          setIsInitialized(true);
          setLoading(false);
        }
      }
    };

    loadSession();

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          // Re-populate store on sign in
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'Oyuncu',
            avatar_url: null,
            avatar_frame: null,
            favorite_team: null,
            level: 1,
            xp: 0,
            coins: 100,
            gems: 10,
            energy: 5,
            energy_last_refill: new Date().toISOString(),
            league_tier: 'bronze',
            elo_rating: 1000,
            streak_days: 0,
            last_daily_claim: null,
            total_questions_answered: 0,
            total_correct_answers: 0,
            settings: {
              sound_enabled: true,
              music_enabled: true,
              vibration_enabled: true,
              notifications_enabled: true,
              language: 'tr',
              theme: 'dark'
            },
            is_premium: false,
            created_at: session.user.created_at,
            updated_at: session.user.updated_at || session.user.created_at
          });
        } else if (event === 'SIGNED_OUT') {
          clearUser();
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, setUser, clearUser, setLoading]);

  return <>{children}</>;
}
