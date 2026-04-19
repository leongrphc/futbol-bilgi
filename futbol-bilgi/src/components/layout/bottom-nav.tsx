'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gamepad2, Trophy, User, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils/cn';

// ==========================================
// Bottom Navigation Component
// ==========================================

const navItems = [
  {
    label: 'Ana Sayfa',
    href: '/',
    icon: Home,
  },
  {
    label: 'Oyna',
    href: '/play',
    icon: Gamepad2,
  },
  {
    label: 'Sıralama',
    href: '/leaderboard',
    icon: Trophy,
  },
  {
    label: 'Profil',
    href: '/profile',
    icon: User,
  },
  {
    label: 'Admin',
    href: '/admin',
    icon: Shield,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-white/[0.08] pb-safe">
      <div className="mx-auto flex h-16 max-w-[480px] items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                trackEvent(ANALYTICS_EVENTS.NAV_CLICKED, {
                  from_path: pathname,
                  target_path: item.href,
                  label: item.label,
                });
              }}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors',
                isActive ? 'text-primary-500' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {/* Active indicator glow */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl bg-primary-500/10"
                  initial={false}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}

              {/* Icon with animation */}
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  opacity: isActive ? 1 : 0.7,
                }}
                transition={{ duration: 0.2 }}
                className="relative z-10"
              >
                <Icon
                  className={cn(
                    'h-6 w-6',
                    isActive && 'drop-shadow-[0_0_8px_rgba(46,125,50,0.6)]'
                  )}
                />
              </motion.div>

              {/* Label */}
              <span
                className={cn(
                  'relative z-10 text-xs font-medium',
                  isActive && 'font-semibold'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
