'use client';

import { motion } from 'framer-motion';
import {
  User,
  Trophy,
  Target,
  TrendingUp,
  Coins,
  Gem,
  Heart,
  Volume2,
  VolumeX,
  Vibrate,
  Bell,
  BellOff,
  LogOut,
  Settings
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useUserStore } from '@/lib/stores/user-store';
import { calculateLevel, calculateAccuracy } from '@/lib/utils/game';
import { LEAGUE_TIER_CONFIG } from '@/lib/constants/game';
import { cn } from '@/lib/utils/cn';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function ProfilePage() {
  const user = useUserStore((state) => state.user);
  const updateSettings = useUserStore((state) => state.updateSettings);
  const clearUser = useUserStore((state) => state.clearUser);

  if (!user) {
    return (
      <div className="min-h-screen p-4 pb-24 flex items-center justify-center">
        <Card padding="lg" className="text-center">
          <User className="h-16 w-16 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary">Kullanıcı bilgisi yükleniyor...</p>
        </Card>
      </div>
    );
  }

  const levelInfo = calculateLevel(user.xp);
  const accuracy = calculateAccuracy(user.total_correct_answers, user.total_questions_answered);
  const leagueTier = LEAGUE_TIER_CONFIG[user.league_tier];

  const handleLogout = () => {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      clearUser();
    }
  };

  return (
    <div className="min-h-screen p-4 pb-24">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto space-y-4"
      >
        {/* Header - Avatar & Basic Info */}
        <motion.div variants={item}>
          <Card padding="lg" variant="elevated">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center text-3xl font-display font-bold",
                  "bg-gradient-to-br from-primary-500 to-secondary-500"
                )}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                {user.avatar_frame && (
                  <div className="absolute inset-0 rounded-full border-4 border-accent-500" />
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h1 className="font-display text-2xl font-bold text-text-primary">
                  {user.username}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-text-secondary">Seviye {levelInfo.level}</span>
                  <span className="text-text-muted">•</span>
                  <span className="text-sm text-text-secondary">
                    {leagueTier.icon} {leagueTier.name}
                  </span>
                </div>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-text-secondary mb-1">
                <span>XP: {levelInfo.currentXP} / {levelInfo.nextLevelXP}</span>
                <span>{Math.round(levelInfo.progress * 100)}%</span>
              </div>
              <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${levelInfo.progress * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Currency */}
        <motion.div variants={item}>
          <div className="grid grid-cols-2 gap-3">
            <Card padding="md" variant="highlighted">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Altın</p>
                  <p className="font-display text-xl font-bold text-text-primary">
                    {user.coins.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card padding="md" variant="highlighted">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center">
                  <Gem className="w-5 h-5 text-accent-500" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Elmas</p>
                  <p className="font-display text-xl font-bold text-text-primary">
                    {user.gems.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={item}>
          <Card padding="lg">
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-secondary-500" />
              İstatistikler
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-2">
                  <Target className="w-6 h-6 text-primary-500" />
                </div>
                <p className="font-display text-2xl font-bold text-text-primary">
                  {user.total_questions_answered}
                </p>
                <p className="text-xs text-text-secondary mt-1">Toplam Soru</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <p className="font-display text-2xl font-bold text-text-primary">
                  {accuracy}%
                </p>
                <p className="text-xs text-text-secondary mt-1">Doğruluk</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-6 h-6 text-warning" />
                </div>
                <p className="font-display text-2xl font-bold text-text-primary">
                  {user.streak_days}
                </p>
                <p className="text-xs text-text-secondary mt-1">Gün Serisi</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-secondary-500/20 flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-6 h-6 text-secondary-500" />
                </div>
                <p className="font-display text-2xl font-bold text-text-primary">
                  {user.elo_rating}
                </p>
                <p className="text-xs text-text-secondary mt-1">ELO Puanı</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Favorite Team */}
        {user.favorite_team && (
          <motion.div variants={item}>
            <Card padding="md">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-danger" />
                <div>
                  <p className="text-xs text-text-secondary">Favori Takım</p>
                  <p className="font-display text-lg font-semibold text-text-primary">
                    {user.favorite_team}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Settings */}
        <motion.div variants={item}>
          <Card padding="lg">
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-text-secondary" />
              Ayarlar
            </h2>
            <div className="space-y-3">
              {/* Sound */}
              <button
                onClick={() => updateSettings({ sound_enabled: !user.settings.sound_enabled })}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-bg-primary hover:bg-bg-elevated transition-colors"
              >
                <div className="flex items-center gap-3">
                  {user.settings.sound_enabled ? (
                    <Volume2 className="w-5 h-5 text-primary-500" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-text-muted" />
                  )}
                  <span className="text-text-primary">Ses Efektleri</span>
                </div>
                <div className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  user.settings.sound_enabled ? "bg-primary-500" : "bg-bg-elevated"
                )}>
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                    user.settings.sound_enabled ? "right-1" : "left-1"
                  )} />
                </div>
              </button>

              {/* Vibration */}
              <button
                onClick={() => updateSettings({ vibration_enabled: !user.settings.vibration_enabled })}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-bg-primary hover:bg-bg-elevated transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Vibrate className={cn(
                    "w-5 h-5",
                    user.settings.vibration_enabled ? "text-primary-500" : "text-text-muted"
                  )} />
                  <span className="text-text-primary">Titreşim</span>
                </div>
                <div className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  user.settings.vibration_enabled ? "bg-primary-500" : "bg-bg-elevated"
                )}>
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                    user.settings.vibration_enabled ? "right-1" : "left-1"
                  )} />
                </div>
              </button>

              {/* Notifications */}
              <button
                onClick={() => updateSettings({ notifications_enabled: !user.settings.notifications_enabled })}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-bg-primary hover:bg-bg-elevated transition-colors"
              >
                <div className="flex items-center gap-3">
                  {user.settings.notifications_enabled ? (
                    <Bell className="w-5 h-5 text-primary-500" />
                  ) : (
                    <BellOff className="w-5 h-5 text-text-muted" />
                  )}
                  <span className="text-text-primary">Bildirimler</span>
                </div>
                <div className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  user.settings.notifications_enabled ? "bg-primary-500" : "bg-bg-elevated"
                )}>
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                    user.settings.notifications_enabled ? "right-1" : "left-1"
                  )} />
                </div>
              </button>
            </div>
          </Card>
        </motion.div>

        {/* Logout Button */}
        <motion.div variants={item}>
          <button
            onClick={handleLogout}
            className="w-full p-4 rounded-xl bg-danger/10 hover:bg-danger/20 transition-colors flex items-center justify-center gap-2 text-danger font-semibold"
          >
            <LogOut className="w-5 h-5" />
            Çıkış Yap
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
