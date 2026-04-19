'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/layout/bottom-nav';
import { useUserStore } from '@/lib/stores/user-store';

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useUserStore((state) => state.user);
  const isLoading = useUserStore((state) => state.isLoading);
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !isLoading && !user) {
      router.replace('/login');
    }
  }, [isHydrated, isLoading, user, router]);

  if (!isHydrated || isLoading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg-primary">
      {/* Main content area with bottom padding for nav */}
      <main className="mx-auto max-w-[480px] pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
