'use client';

import { BottomNav } from '@/components/layout/bottom-nav';

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
