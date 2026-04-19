'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useUserStore } from '@/lib/stores/user-store';
import { LEAGUE_TIER_CONFIG } from '@/lib/constants/game';
import { cn } from '@/lib/utils/cn';
import type { LeagueTier, GameMode } from '@/types';

// Mock leaderboard data
const MOCK_LEADERBOARD = [
  { id: '1', username: 'FutbolKrali', avatar: 'F', league_tier: 'champion' as LeagueTier, score: 125000 },
  { id: '2', username: 'GalatasarayFan', avatar: 'G', league_tier: 'champion' as LeagueTier, score: 118000 },
  { id: '3', username: 'BesiktasAski', avatar: 'B', league_tier: 'diamond' as LeagueTier, score: 112000 },
  { id: '4', username: 'FenerliYildiz', avatar: 'F', league_tier: 'diamond' as LeagueTier, score: 105000 },
  { id: '5', username: 'TrabzonGucu', avatar: 'T', league_tier: 'diamond' as LeagueTier, score: 98000 },
  { id: '6', username: 'AnkaraSpor', avatar: 'A', league_tier: 'gold' as LeagueTier, score: 92000 },
  { id: '7', username: 'IzmirAslan', avatar: 'I', league_tier: 'gold' as LeagueTier, score: 87000 },
  { id: '8', username: 'BursaYesil', avatar: 'B', league_tier: 'gold' as LeagueTier, score: 81000 },
  { id: '9', username: 'KonyaKaplan', avatar: 'K', league_tier: 'gold' as LeagueTier, score: 76000 },
  { id: '10', username: 'AdanaGuru', avatar: 'A', league_tier: 'silver' as LeagueTier, score: 71000 },
  { id: '11', username: 'GaziantepPro', avatar: 'G', league_tier: 'silver' as LeagueTier, score: 67000 },
  { id: '12', username: 'SamsunYildiz', avatar: 'S', league_tier: 'silver' as LeagueTier, score: 63000 },
  { id: '13', username: 'KayseriFan', avatar: 'K', league_tier: 'silver' as LeagueTier, score: 59000 },
  { id: '14', username: 'DenizliSpor', avatar: 'D', league_tier: 'silver' as LeagueTier, score: 55000 },
  { id: '15', username: 'EskisehirLi', avatar: 'E', league_tier: 'bronze' as LeagueTier, score: 51000 },
  { id: '16', username: 'ManisaGuru', avatar: 'M', league_tier: 'bronze' as LeagueTier, score: 48000 },
  { id: '17', username: 'BalikesirFan', avatar: 'B', league_tier: 'bronze' as LeagueTier, score: 45000 },
  { id: '18', username: 'TekirDagPro', avatar: 'T', league_tier: 'bronze' as LeagueTier, score: 42000 },
  { id: '19', username: 'EdirneSpor', avatar: 'E', league_tier: 'bronze' as LeagueTier, score: 39000 },
  { id: '20', username: 'CanakkaleAski', avatar: 'C', league_tier: 'bronze' as LeagueTier, score: 36000 },
];

type Period = 'daily' | 'weekly' | 'monthly' | 'all_time';
type Mode = 'overall' | 'millionaire' | 'duel';

const PERIOD_LABELS: Record<Period, string> = {
  daily: 'Günlük',
  weekly: 'Haftalık',
  monthly: 'Aylık',
  all_time: 'Tüm Zamanlar',
};

const MODE_LABELS: Record<Mode, string> = {
  overall: 'Genel',
  millionaire: 'Milyoner',
  duel: 'Düello',
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
};

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>('weekly');
  const [mode, setMode] = useState<Mode>('overall');
  const user = useUserStore((state) => state.user);

  const topThree = MOCK_LEADERBOARD.slice(0, 3);
  const remaining = MOCK_LEADERBOARD.slice(3);

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-8 h-8 text-secondary-500" />
            <h1 className="font-display text-3xl font-bold text-text-primary">
              Sıralama
            </h1>
          </div>
          <p className="text-text-secondary text-sm">
            En iyi oyuncular arasında yerinizi alın
          </p>
        </motion.div>

        {/* Period Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card padding="sm">
            <div className="grid grid-cols-4 gap-1">
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "py-2 px-3 rounded-lg text-sm font-semibold transition-all",
                    period === p
                      ? "bg-primary-500 text-white"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                  )}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Mode Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card padding="sm">
            <div className="grid grid-cols-3 gap-1">
              {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "py-2 px-3 rounded-lg text-sm font-semibold transition-all",
                    mode === m
                      ? "bg-secondary-500 text-white"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                  )}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Top 3 Podium */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card padding="lg" variant="elevated">
            <div className="flex items-end justify-center gap-4">
              {/* 2nd Place */}
              <div className="flex-1 text-center">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="relative"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-2xl font-display font-bold text-white mb-2 border-4 border-gray-400/30">
                    {topThree[1].avatar}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                  <p className="font-display font-semibold text-text-primary text-sm truncate">
                    {topThree[1].username}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    {LEAGUE_TIER_CONFIG[topThree[1].league_tier].icon}
                  </p>
                  <p className="font-mono text-lg font-bold text-secondary-500 mt-1">
                    {topThree[1].score.toLocaleString()}
                  </p>
                </motion.div>
                <div className="h-20 bg-gradient-to-t from-gray-400/20 to-gray-400/10 rounded-t-xl mt-3 border-t-4 border-gray-400" />
              </div>

              {/* 1st Place */}
              <div className="flex-1 text-center">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="relative"
                >
                  <Crown className="w-8 h-8 text-warning mx-auto mb-1" />
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-warning to-yellow-600 flex items-center justify-center text-3xl font-display font-bold text-white mb-2 border-4 border-warning/30 shadow-lg shadow-warning/50">
                    {topThree[0].avatar}
                  </div>
                  <div className="absolute top-8 -right-2 w-8 h-8 rounded-full bg-warning flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                  <p className="font-display font-semibold text-text-primary truncate">
                    {topThree[0].username}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    {LEAGUE_TIER_CONFIG[topThree[0].league_tier].icon}
                  </p>
                  <p className="font-mono text-xl font-bold text-warning mt-1">
                    {topThree[0].score.toLocaleString()}
                  </p>
                </motion.div>
                <div className="h-28 bg-gradient-to-t from-warning/20 to-warning/10 rounded-t-xl mt-3 border-t-4 border-warning" />
              </div>

              {/* 3rd Place */}
              <div className="flex-1 text-center">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="relative"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center text-2xl font-display font-bold text-white mb-2 border-4 border-orange-600/30">
                    {topThree[2].avatar}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                  <p className="font-display font-semibold text-text-primary text-sm truncate">
                    {topThree[2].username}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    {LEAGUE_TIER_CONFIG[topThree[2].league_tier].icon}
                  </p>
                  <p className="font-mono text-lg font-bold text-accent-500 mt-1">
                    {topThree[2].score.toLocaleString()}
                  </p>
                </motion.div>
                <div className="h-16 bg-gradient-to-t from-orange-600/20 to-orange-600/10 rounded-t-xl mt-3 border-t-4 border-orange-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Remaining Players */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          {remaining.map((player, index) => {
            const rank = index + 4;
            const isCurrentUser = user && player.username === user.username;

            return (
              <motion.div key={player.id} variants={item}>
                <Card
                  padding="md"
                  variant={isCurrentUser ? 'highlighted' : 'default'}
                  hoverable={!isCurrentUser}
                  className={cn(
                    "transition-all",
                    isCurrentUser && "ring-2 ring-primary-500/50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-8 text-center">
                      <span className={cn(
                        "font-display text-lg font-bold",
                        isCurrentUser ? "text-primary-500" : "text-text-secondary"
                      )}>
                        {rank}
                      </span>
                    </div>

                    {/* Avatar */}
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-lg font-display font-bold",
                      isCurrentUser
                        ? "bg-gradient-to-br from-primary-500 to-secondary-500"
                        : "bg-gradient-to-br from-bg-elevated to-bg-card"
                    )}>
                      {player.avatar}
                    </div>

                    {/* Username & League */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-display font-semibold truncate",
                        isCurrentUser ? "text-primary-500" : "text-text-primary"
                      )}>
                        {player.username}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-primary-500">(Sen)</span>
                        )}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {LEAGUE_TIER_CONFIG[player.league_tier].icon} {LEAGUE_TIER_CONFIG[player.league_tier].name}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <p className={cn(
                        "font-mono text-lg font-bold",
                        isCurrentUser ? "text-primary-500" : "text-text-primary"
                      )}>
                        {player.score.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
