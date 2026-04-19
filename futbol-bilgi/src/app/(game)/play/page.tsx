'use client';

import { motion } from 'framer-motion';
import { Crown, Zap, Swords, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useUserStore } from '@/lib/stores/user-store';
import { getStreakStatus, getStreakMilestoneProgress } from '@/lib/utils/game';
import { cn } from '@/lib/utils/cn';

// ==========================================
// Animation Variants
// ==========================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

// ==========================================
// Game Mode Details
// ==========================================

const gameModeDetails = [
  {
    id: 'millionaire',
    title: 'Milyoner Yarışması',
    description: 'Kim Milyoner Olmak İster formatında 15 soru',
    icon: Crown,
    gradient: 'from-primary-600 to-primary-400',
    href: '/play/millionaire',
    energyCost: 1,
    rules: [
      '15 soru, artan zorluk',
      '2 güvenli nokta (5. ve 10. soru)',
      '3 joker hakkı',
      'Yanlış cevapta güvenli noktaya düşersin',
    ],
    rewards: '1M puana kadar kazanç',
  },
  {
    id: 'quick',
    title: 'Hızlı Maç',
    description: 'Zamana karşı 10 soruluk hızlı yarış',
    icon: Zap,
    gradient: 'from-blue-600 to-blue-400',
    href: '/play/quick',
    energyCost: 0,
    rules: [
      '10 soru, 120 saniye',
      'Her doğru cevap +100 puan',
      'Yanlış cevap ceza yok',
      'Süre bitince oyun biter',
    ],
    rewards: 'Ücretsiz XP ve coin kazanımı',
  },
  {
    id: 'duel',
    title: 'Düello',
    description: 'Mock rakibe karşı 5 soruluk 1v1 bilgi yarışı',
    icon: Swords,
    gradient: 'from-orange-600 to-orange-400',
    href: '/play/duel',
    energyCost: 1,
    rules: [
      'Aynı 5 soru, 2 oyuncu',
      'Doğru cevap + hız bonusu puan getirir',
      'Beraberlikte toplam süre belirleyici olur',
      'Kazanana XP, coin ve ELO ödülü verilir',
    ],
    rewards: 'Kazanan +200 XP ve +50 coin alır',
  },
  {
    id: 'daily',
    title: 'Günlük Meydan Okuma',
    description: 'Her gün yeni 5 özel soru',
    icon: Calendar,
    gradient: 'from-purple-600 to-purple-400',
    href: '/play/daily',
    energyCost: 0,
    rules: [
      'Günde 1 kez oynanabilir',
      '5 özel seçilmiş soru',
      'Streak bonusu',
      'Tüm sorular aynı zorlukta',
    ],
    rewards: 'Günlük bonus + streak çarpanı',
  },
];

// ==========================================
// Play Mode Selection Page
// ==========================================

export default function PlayPage() {
  const user = useUserStore((state) => state.user);

  if (!user) {
    return null;
  }

  const { activeStreak, canClaimToday } = getStreakStatus(user.last_daily_claim, user.streak_days);
  const { next: nextMilestone } = getStreakMilestoneProgress(activeStreak);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen p-4 pb-24"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Oyun Modları
          </h1>
          <p className="text-sm text-text-secondary">
            Enerji: {user.energy}/5 ⚡
          </p>
        </div>
      </motion.div>

      {/* Game Mode Cards */}
      <div className="space-y-4">
        {gameModeDetails.map((mode) => {
          const Icon = mode.icon;
          const hasEnergy = user.energy >= mode.energyCost;
          const canPlay = mode.energyCost === 0 || hasEnergy;

          return (
            <motion.div key={mode.id} variants={itemVariants}>
              <Card variant="elevated" padding="none" className="overflow-hidden">
                {/* Header with gradient */}
                <div
                  className={cn(
                    'relative p-6 bg-gradient-to-br',
                    mode.gradient
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h2 className="font-display text-xl font-bold text-white">
                          {mode.title}
                        </h2>
                        <p className="mt-1 text-sm text-white/80">
                          {mode.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-6">
                  {/* Rules */}
                  <div className="mb-4">
                    <h3 className="mb-2 text-sm font-semibold text-text-primary">
                      Kurallar:
                    </h3>
                    <ul className="space-y-1">
                      {mode.rules.map((rule, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-text-secondary"
                        >
                          <span className="text-primary-500">•</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Rewards */}
                  <div className="rounded-lg bg-bg-elevated p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏆</span>
                      <span className="text-sm text-text-secondary">
                        {mode.rewards}
                      </span>
                    </div>
                  </div>

                  {/* Daily Streak Info */}
                  {mode.id === 'daily' && (
                    <div className="mt-4 rounded-lg border border-accent-500/20 bg-accent-500/10 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🔥</span>
                          <span className="text-sm font-bold text-accent-500">
                            {activeStreak > 0 ? `Seri: ${activeStreak} Gün` : 'Seri Yok'}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-accent-500/80">
                          Hedef: {nextMilestone}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-text-secondary">
                        {canClaimToday
                          ? 'Bugün giriş yapıldı, ödül bekliyor!'
                          : 'Bugünün serisi korundu.'}
                      </p>
                    </div>
                  )}
                </CardContent>

                {/* Footer */}
                <CardFooter className="flex items-center justify-between border-t border-white/[0.08] p-6">
                  <div className="flex items-center gap-2">
                    {mode.energyCost > 0 ? (
                      <span
                        className={cn(
                          'text-sm font-medium',
                          hasEnergy ? 'text-warning' : 'text-danger'
                        )}
                      >
                        {mode.energyCost} ⚡ Enerji
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-success">
                        Ücretsiz
                      </span>
                    )}
                  </div>

                  <Link href={mode.href}>
                    <Button
                      variant="primary"
                      size="md"
                      disabled={!canPlay}
                    >
                      {mode.id === 'duel' ? 'Eşleş' : 'Oyna'}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Energy Info */}
      {user.energy < 5 && (
        <motion.div variants={itemVariants} className="mt-6">
          <Card padding="md" variant="highlighted">
            <div className="text-center">
              <p className="text-sm text-text-secondary">
                Enerji her 30 dakikada 1 yenilenir veya gem ile doldurabilirsin
              </p>
              <Button variant="secondary" size="sm" className="mt-3">
                Enerji Satın Al
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
