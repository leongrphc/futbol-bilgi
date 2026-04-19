'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { BottomNav } from '@/components/layout/bottom-nav';
import { useUserStore } from '@/lib/stores/user-store';

const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransitionConfig = {
  duration: 0.2,
  ease: 'easeOut' as const,
};

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useUserStore((state) => state.user);
  const isLoading = useUserStore((state) => state.isLoading);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg-primary">
      <main className="mx-auto max-w-[480px] pb-20">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={pageTransition.initial}
            animate={pageTransition.animate}
            exit={pageTransition.exit}
            transition={pageTransitionConfig}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}
