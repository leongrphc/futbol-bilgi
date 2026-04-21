'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Trophy,
  Globe,
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
  Settings,
  Users,
  UserPlus,
  Swords,
  Clock3,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useUserStore } from '@/lib/stores/user-store';
import { useSocialStore } from '@/lib/stores/social-store';
import { useLeagueStore } from '@/lib/stores/league-store';
import { calculateLevel, calculateAccuracy } from '@/lib/utils/game';
import { getLeagueZone } from '@/lib/league/ranking';
import { LEAGUE_TIER_CONFIG } from '@/lib/constants/game';
import { cn } from '@/lib/utils/cn';
import { FriendRow } from '@/components/social/friend-row';
import { FriendLeaderboard } from '@/components/social/friend-leaderboard';
import { ShareButton } from '@/components/social/share-button';
import { buildProfileShare } from '@/lib/utils/share';
import { SeasonSummaryCard } from '@/components/league/season-summary-card';
import { AchievementCard } from '@/components/achievement/achievement-card';
import { StreakCard } from '@/components/streak/streak-card';
import { ACHIEVEMENT_DEFINITIONS } from '@/lib/achievements/definitions';
import { useAchievementStore } from '@/lib/stores/achievement-store';
import { evaluateAchievementProgress } from '@/lib/achievements/evaluate';
import { AchievementStrip } from '@/components/achievement/achievement-strip';
import { updateAchievementStatsFromStores } from '@/lib/achievements/sync';
import { useNotifications } from '@/lib/hooks/use-notifications';
import { trackEvent } from '@/lib/analytics';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';

function getUnlockedTitles(keys: string[]) {
  return ACHIEVEMENT_DEFINITIONS.filter((achievement) => keys.includes(achievement.key)).map((achievement) => achievement.name);
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function ProfilePage() {
  const user = useUserStore((state) => state.user);
  const updateSettings = useUserStore((state) => state.updateSettings);
  const clearUser = useUserStore((state) => state.clearUser);

  const profiles = useSocialStore((state) => state.profiles);
  const friendships = useSocialStore((state) => state.friendships);
  const duelInvites = useSocialStore((state) => state.duelInvites);
  const currentSeason = useLeagueStore((state) => state.currentSeason);
  const currentSeasonLoaded = useLeagueStore((state) => state.currentSeasonLoaded);
  const leagueEntries = useLeagueStore((state) => state.entries);
  const fetchCurrentSeason = useLeagueStore((state) => state.fetchCurrentSeason);
  const fetchEntries = useLeagueStore((state) => state.fetchEntries);
  const ensurePlayerEntry = useLeagueStore((state) => state.ensurePlayerEntry);
  const achievementProgress = useAchievementStore((state) => state.progress);
  const unlockedAchievements = useAchievementStore((state) => state.unlocked);
  const newlyUnlocked = useAchievementStore((state) => state.newlyUnlocked);
  const updateAchievementStats = useAchievementStore((state) => state.updateStats);
  const evaluateAchievements = useAchievementStore((state) => state.evaluate);
  const clearNewlyUnlocked = useAchievementStore((state) => state.clearNewlyUnlocked);
  const { toggleSubscription, isSupported } = useNotifications();
  const setUser = useUserStore((state) => state.setUser);
  const [appliedAchievementKeys, setAppliedAchievementKeys] = useState<string[]>([]);
  const [achievementMessage, setAchievementMessage] = useState<string | null>(null);
  const hydrateSocial = useSocialStore((state) => state.hydrate);
  const syncCurrentUser = useSocialStore((state) => state.syncCurrentUser);
  const markUserActive = useSocialStore((state) => state.markUserActive);
  const sendFriendRequest = useSocialStore((state) => state.sendFriendRequest);
  const acceptFriendRequest = useSocialStore((state) => state.acceptFriendRequest);
  const rejectFriendRequest = useSocialStore((state) => state.rejectFriendRequest);
  const removeFriend = useSocialStore((state) => state.removeFriend);
  const sendDuelInvite = useSocialStore((state) => state.sendDuelInvite);
  const acceptDuelInvite = useSocialStore((state) => state.acceptDuelInvite);
  const rejectDuelInvite = useSocialStore((state) => state.rejectDuelInvite);

  const [friendUsername, setFriendUsername] = useState('');
  const [socialMessage, setSocialMessage] = useState<string | null>(null);
  const [globalRank, setGlobalRank] = useState<number | null>(null);
  const [globalTopCount, setGlobalTopCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    syncCurrentUser(user);
    void hydrateSocial(user);
    void markUserActive();
    fetchCurrentSeason();
  }, [user, syncCurrentUser, hydrateSocial, markUserActive, fetchCurrentSeason]);

  useEffect(() => {
    if (!currentSeason) return;
    fetchEntries(currentSeason.id);
  }, [currentSeason, fetchEntries]);

  const levelInfo = calculateLevel(user?.xp ?? 0);
  const accuracy = calculateAccuracy(user?.total_correct_answers ?? 0, user?.total_questions_answered ?? 0);
  const currentSeasonId = currentSeason?.id;

  useEffect(() => {
    if (!user || !currentSeasonId) return;

    const stats = updateAchievementStatsFromStores({
      user,
      social: { friendships },
      league: { entries: leagueEntries },
      currentSeasonId,
    });

    updateAchievementStats(stats);
  }, [user, friendships, leagueEntries, currentSeasonId, updateAchievementStats]);
  const currentEntry = user && currentSeasonId
    ? leagueEntries.find((entry) => entry.user_id === user.id && entry.season_id === currentSeasonId)
    : undefined;
  const currentSeasonTier = currentEntry?.tier_at_start ?? user?.league_tier ?? 'bronze';
  const leagueTier = LEAGUE_TIER_CONFIG[currentSeasonTier];
  const tierEntries = currentSeasonId
    ? leagueEntries.filter((entry) => entry.season_id === currentSeasonId && entry.tier_at_start === currentSeasonTier)
    : [];

  useEffect(() => {
    if (!user || !currentSeason || currentEntry) return;
    ensurePlayerEntry(user.id, user.league_tier);
  }, [currentSeason, currentEntry, ensurePlayerEntry, user]);

  const rankedTierEntries = [...tierEntries].sort((a, b) => b.season_score - a.season_score);
  const currentRank = user
    ? rankedTierEntries.findIndex((entry) => entry.user_id === user.id) + 1
    : 0;
  const seasonZone = currentRank > 0 ? getLeagueZone(currentRank, rankedTierEntries.length) : 'safe';

  const incomingRequests = useMemo(
    () => friendships.filter((friendship) => user && friendship.friend_id === user.id && friendship.status === 'pending'),
    [friendships, user],
  );

  const outgoingRequests = useMemo(
    () => friendships.filter((friendship) => user && friendship.user_id === user.id && friendship.status === 'pending'),
    [friendships, user],
  );

  const acceptedFriendships = useMemo(
    () => friendships.filter((friendship) => user && friendship.user_id === user.id && friendship.status === 'accepted'),
    [friendships, user],
  );

  const acceptedFriends = useMemo(
    () => acceptedFriendships
      .map((friendship) => profiles.find((profile) => profile.id === friendship.friend_id))
      .filter((friend): friend is NonNullable<typeof friend> => Boolean(friend)),
    [acceptedFriendships, profiles],
  );

  const friendLeaderboardEntries = useMemo(() => {
    const currentProfile = user ? profiles.find((profile) => profile.id === user.id) : null;
    return [currentProfile, ...acceptedFriends]
      .filter(Boolean)
      .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))
      .slice(0, 5)
      .map((profile) => ({
        id: profile!.id,
        username: profile!.username,
        avatar_url: profile!.avatar_url,
        avatar_frame: profile!.avatar_frame,
        league_tier: profile!.league_tier,
        score: profile!.score,
        isCurrentUser: profile!.id === user?.id,
      }));
  }, [profiles, acceptedFriends, user]);

  const friendRank = friendLeaderboardEntries.findIndex((entry) => entry.id === user?.id) + 1;

  const handleLogout = () => {
    trackEvent(ANALYTICS_EVENTS.PROFILE_ACTION, { action: 'logout_clicked' });
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      trackEvent(ANALYTICS_EVENTS.PROFILE_ACTION, { action: 'logout_confirmed' });
      clearUser();
    }
  };

  const handleAddFriend = async () => {
    if (!user || !friendUsername.trim()) return;
    const result = await sendFriendRequest(friendUsername);
    setSocialMessage(result.message);
    if (result.success) {
      setFriendUsername('');
    }
  };

  const handleDuelInvite = async (friendId: string) => {
    if (!user) return;
    const result = await sendDuelInvite(friendId);
    setSocialMessage(result.message);
  };

  const pendingDuelInvites = duelInvites.filter(
    (invite) => user && invite.to_user_id === user.id && invite.status === 'pending',
  );
  const acceptedDuelInvites = duelInvites.filter(
    (invite) => user && invite.status === 'accepted' && (invite.to_user_id === user.id || invite.from_user_id === user.id),
  );
  const completedDuelInvites = duelInvites.filter(
    (invite) => user && invite.status === 'completed' && (invite.to_user_id === user.id || invite.from_user_id === user.id),
  ).slice(0, 3);

  const getInviteOpponent = (invite: typeof duelInvites[number]) => {
    const opponentId = invite.from_user_id === user?.id ? invite.to_user_id : invite.from_user_id;
    return profiles.find((profile) => profile.id === opponentId) ?? null;
  };

  const handlePlayAcceptedInvite = (inviteId: string) => {
    window.location.href = `/play/duel?invite=${inviteId}`;
  };

  const getCompletedInviteLabel = (invite: typeof duelInvites[number]) => {
    if (!user) return 'Tamamlandı';
    if (!invite.winner_user_id) return 'Berabere bitti';
    return invite.winner_user_id === user.id ? 'Kazandın' : 'Kaybettin';
  };

  const getAcceptedInviteLabel = (invite: typeof duelInvites[number]) => {
    if (!user) return 'Hazır';
    const isCurrentUserSender = invite.from_user_id === user.id;
    const hasCurrentUserPlayed = isCurrentUserSender ? Boolean(invite.from_user_played_at) : Boolean(invite.to_user_played_at);
    const hasOpponentPlayed = isCurrentUserSender ? Boolean(invite.to_user_played_at) : Boolean(invite.from_user_played_at);

    if (hasCurrentUserPlayed && !hasOpponentPlayed) return 'Rakibini Bekliyor';
    if (!hasCurrentUserPlayed) return 'Şimdi Oyna';
    return 'Tamamlandı';
  };

  const hasPlayableAcceptedInvite = acceptedDuelInvites.some((invite) => {
    if (!user) return false;
    return invite.from_user_id === user.id ? !invite.from_user_played_at : !invite.to_user_played_at;
  });

  const pendingInviteCount = pendingDuelInvites.length;

  const handleAcceptDuelInvite = async (inviteId: string) => {
    const result = await acceptDuelInvite(inviteId);
    setSocialMessage(result.message);
  };

  const handleRejectDuelInvite = async (inviteId: string) => {
    const result = await rejectDuelInvite(inviteId);
    setSocialMessage(result.message);
  };

  const handleRemoveFriend = async (friendId: string) => {
    const result = await removeFriend(friendId);
    setSocialMessage(result.message);
  };

  const handleAcceptFriendRequest = async (requesterId: string) => {
    const result = await acceptFriendRequest(requesterId);
    setSocialMessage(result.message);
  };

  const handleRejectFriendRequest = async (requesterId: string) => {
    const result = await rejectFriendRequest(requesterId);
    setSocialMessage(result.message);
  };

  const evaluatedAchievements = user
    ? evaluateAchievementProgress(
      updateAchievementStatsFromStores({
        user,
        social: { friendships },
        league: { entries: leagueEntries },
        currentSeasonId,
      }),
    )
    : [];

  useEffect(() => {
    if (!user) return;

    const fetchGlobalRank = async () => {
      const response = await fetch('/api/leaderboard/overall?limit=200&period=all_time&mode=overall');
      const json = await response.json();
      if (!response.ok || !json.data) return;

      const rank = json.data.findIndex((entry: { id: string }) => entry.id === user.id) + 1;
      setGlobalRank(rank > 0 ? rank : null);
      setGlobalTopCount(json.data.length);
    };

    void fetchGlobalRank();
  }, [user]);

  useEffect(() => {
    if (!user || !currentSeasonId) return;

    const syncAchievements = async () => {
      const response = await fetch('/api/achievements/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueEntries,
          currentSeasonId,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.data) return;

      if (json.data.newlyUnlocked.length === 0) {
        return;
      }

      setUser({
        ...user,
        ...json.data.profile,
      });
      setAppliedAchievementKeys((prev) => [...prev, ...json.data.newlyUnlocked]);
      setAchievementMessage(`${json.data.newlyUnlocked.length} yeni başarım ödülü hesabına işlendi.`);
    };

    void syncAchievements();
  }, [friendships, leagueEntries, currentSeasonId, setUser, user]);

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

  if (!currentSeasonLoaded) {
    return (
      <div className="min-h-screen p-4 pb-24 flex items-center justify-center">
        <Card padding="lg" className="text-center">
          <User className="h-16 w-16 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary">Sezon bilgisi yükleniyor...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto space-y-4"
      >
        <motion.div variants={item}>
          <Card padding="lg" variant="elevated">
            <div className="flex items-center gap-4">
              <Avatar
                src={user.avatar_url}
                fallback={user.username}
                frame={user.avatar_frame}
                size="xl"
              />

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

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <ShareButton
                payload={buildProfileShare({
                  username: user.username,
                  accuracy,
                  totalQuestions: user.total_questions_answered,
                  leagueName: leagueTier.name,
                })}
                label="Profili Paylaş"
                variant="outline"
                size="sm"
                fullWidth
              />
              <div className="rounded-xl bg-bg-primary/60 px-4 py-3 text-sm text-text-secondary">
                <div className="flex items-center gap-2 text-text-primary">
                  <Globe className="h-4 w-4 text-primary-500" />
                  <span className="font-semibold">Global sıra</span>
                </div>
                <p className="mt-1 font-display text-lg font-bold text-text-primary">
                  {globalRank ? `#${globalRank}` : 'İlk 200 dışında'}
                </p>
                <p className="text-xs text-text-muted">
                  {friendRank > 0 ? `Arkadaşlar arasında #${friendRank}` : 'Arkadaş sıralaması bekleniyor'}
                  {globalTopCount > 0 ? ` · İlk ${globalTopCount}` : ''}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-text-secondary mb-1">
                <span>XP: {levelInfo.currentXP} / {levelInfo.nextLevelXP}</span>
                <span>{Math.round(levelInfo.progress * 100)}%</span>
              </div>
              <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${levelInfo.progress * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-primary-500/90 via-primary-400/75 to-secondary-500/85"
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {currentSeason && (
          <motion.div variants={item}>
            <SeasonSummaryCard
              tier={currentSeasonTier}
              rank={currentRank || null}
              totalPlayers={rankedTierEntries.length}
              seasonScore={currentEntry?.season_score ?? 0}
              endsAt={currentSeason.ends_at}
              zone={seasonZone}
            />
          </motion.div>
        )}

        {!currentSeason && (
          <motion.div variants={item}>
            <Card padding="md" className="text-center">
              <p className="font-display text-lg font-semibold text-text-primary">Aktif lig sezonu bulunmuyor</p>
              <p className="mt-2 text-sm text-text-secondary">Profil istatistiklerin görünmeye devam eder. Sezon kartı yeni sezon başladığında geri gelir.</p>
            </Card>
          </motion.div>
        )}

        <motion.div variants={item}>
          <StreakCard />
        </motion.div>

        <motion.div variants={item}>
          <div className="grid grid-cols-2 gap-3">
            <Card padding="md" variant="highlighted">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Altın</p>
                  <p className="font-display text-xl font-bold text-text-primary">{user.coins.toLocaleString()}</p>
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
                  <p className="font-display text-xl font-bold text-text-primary">{user.gems.toLocaleString()}</p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

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
                <p className="font-display text-2xl font-bold text-text-primary">{user.total_questions_answered}</p>
                <p className="text-xs text-text-secondary mt-1">Toplam Soru</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <p className="font-display text-2xl font-bold text-text-primary">{accuracy}%</p>
                <p className="text-xs text-text-secondary mt-1">Doğruluk</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-6 h-6 text-warning" />
                </div>
                <p className="font-display text-2xl font-bold text-text-primary">{user.streak_days}</p>
                <p className="text-xs text-text-secondary mt-1">Gün Serisi</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-secondary-500/20 flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-6 h-6 text-secondary-500" />
                </div>
                <p className="font-display text-2xl font-bold text-text-primary">{user.elo_rating}</p>
                <p className="text-xs text-text-secondary mt-1">ELO Puanı</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card padding="lg" variant="highlighted">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-500" />
                <h2 className="font-display text-lg font-semibold text-text-primary">Arkadaş Merkezi</h2>
              </div>
              <div className="text-xs text-text-secondary">
                {acceptedFriends.length} arkadaş · {pendingInviteCount} düello daveti
                {hasPlayableAcceptedInvite ? ' · oynanabilir challenge hazır' : ''}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                value={friendUsername}
                onChange={(event) => setFriendUsername(event.target.value)}
                placeholder="Kullanıcı adı ile arkadaş ekle"
                className="h-11 rounded-xl border border-white/[0.08] bg-bg-primary px-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary-500"
              />
              <Button onClick={handleAddFriend}>
                <UserPlus className="h-4 w-4" />
                Ekle
              </Button>
            </div>

            {socialMessage && (
              <p className="mt-3 text-sm text-text-secondary">{socialMessage}</p>
            )}
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card padding="lg">
            <div className="mb-4 flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-warning" />
              <h2 className="font-display text-lg font-semibold text-text-primary">Gelen İstekler</h2>
            </div>
            <div className="space-y-3">
              {incomingRequests.length === 0 ? (
                <p className="text-sm text-text-secondary">Şu anda bekleyen arkadaş isteğin yok.</p>
              ) : (
                incomingRequests.map((friendship) => {
                  const requester = profiles.find((profile) => profile.id === friendship.user_id);
                  if (!requester) return null;
                  return (
                    <FriendRow
                      key={friendship.id}
                      username={requester.username}
                      avatar={requester.avatar_url}
                      frame={requester.avatar_frame}
                      favoriteTeam={requester.favorite_team}
                      status="pending"
                      isOnline={Date.now() - new Date(requester.last_seen_at).getTime() < 1000 * 60 * 5}
                      primaryAction={{
                        label: 'Kabul Et',
                        onClick: () => {
                          void handleAcceptFriendRequest(requester.id);
                        },
                      }}
                      secondaryAction={{
                        label: 'Reddet',
                        variant: 'ghost',
                        onClick: () => {
                          void handleRejectFriendRequest(requester.id);
                        },
                      }}
                    />
                  );
                })
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card padding="lg">
            <div className="mb-4 flex items-center gap-2">
              <Swords className="h-5 w-5 text-secondary-500" />
              <h2 className="font-display text-lg font-semibold text-text-primary">Düello Davetleri</h2>
            </div>
            <div className="space-y-3">
              {pendingDuelInvites.length === 0 ? (
                <p className="text-sm text-text-secondary">Şu anda bekleyen düello davetin yok.</p>
              ) : (
                pendingDuelInvites.map((invite) => {
                  const sender = profiles.find((profile) => profile.id === invite.from_user_id);
                  if (!sender) return null;
                  return (
                    <FriendRow
                      key={invite.id}
                      username={sender.username}
                      avatar={sender.avatar_url}
                      frame={sender.avatar_frame}
                      favoriteTeam={sender.favorite_team}
                      status="pending"
                      isOnline={Date.now() - new Date(sender.last_seen_at).getTime() < 1000 * 60 * 5}
                      primaryAction={{
                        label: 'Kabul Et',
                        onClick: () => {
                          void handleAcceptDuelInvite(invite.id);
                        },
                      }}
                      secondaryAction={{
                        label: 'Reddet',
                        variant: 'ghost',
                        onClick: () => {
                          void handleRejectDuelInvite(invite.id);
                        },
                      }}
                    />
                  );
                })
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card padding="lg">
            <div className="mb-4 flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary-500" />
              <h2 className="font-display text-lg font-semibold text-text-primary">Aktif Challenge'lar</h2>
            </div>
            <div className="space-y-3">
              {acceptedDuelInvites.length === 0 ? (
                <p className="text-sm text-text-secondary">Kabul edilen challenge henüz yok.</p>
              ) : (
                acceptedDuelInvites.map((invite) => {
                  const opponent = getInviteOpponent(invite);
                  if (!opponent) return null;
                  const label = getAcceptedInviteLabel(invite);
                  const canPlay = label === 'Şimdi Oyna';
                  return (
                    <FriendRow
                      key={`accepted-${invite.id}`}
                      username={opponent.username}
                      avatar={opponent.avatar_url}
                      frame={opponent.avatar_frame}
                      favoriteTeam={opponent.favorite_team}
                      subtitle={label}
                      status="accepted"
                      isOnline={Date.now() - new Date(opponent.last_seen_at).getTime() < 1000 * 60 * 5}
                      primaryAction={canPlay ? {
                        label: 'Şimdi Oyna',
                        onClick: () => handlePlayAcceptedInvite(invite.id),
                      } : undefined}
                    />
                  );
                })
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card padding="lg">
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-secondary-500" />
              <h2 className="font-display text-lg font-semibold text-text-primary">Son Challenge Sonuçları</h2>
            </div>
            <div className="space-y-3">
              {completedDuelInvites.length === 0 ? (
                <p className="text-sm text-text-secondary">Tamamlanan friend challenge henüz yok.</p>
              ) : (
                completedDuelInvites.map((invite) => {
                  const opponent = getInviteOpponent(invite);
                  if (!opponent) return null;
                  return (
                    <FriendRow
                      key={`completed-${invite.id}`}
                      username={opponent.username}
                      avatar={opponent.avatar_url}
                      frame={opponent.avatar_frame}
                      favoriteTeam={opponent.favorite_team}
                      subtitle={`${getCompletedInviteLabel(invite)} · ${invite.from_user_score ?? 0} - ${invite.to_user_score ?? 0}`}
                      status="accepted"
                      isOnline={Date.now() - new Date(opponent.last_seen_at).getTime() < 1000 * 60 * 5}
                    />
                  );
                })
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card padding="lg">
            <div className="mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-info" />
              <h2 className="font-display text-lg font-semibold text-text-primary">Gönderilen İstekler</h2>
            </div>
            <div className="space-y-3">
              {outgoingRequests.length === 0 ? (
                <p className="text-sm text-text-secondary">Henüz bekleyen gönderilmiş isteğin yok.</p>
              ) : (
                outgoingRequests.map((friendship) => {
                  const target = profiles.find((profile) => profile.id === friendship.friend_id);
                  if (!target) return null;
                  return (
                    <FriendRow
                      key={friendship.id}
                      username={target.username}
                      avatar={target.avatar_url}
                      frame={target.avatar_frame}
                      favoriteTeam={target.favorite_team}
                      status="outgoing"
                      isOnline={Date.now() - new Date(target.last_seen_at).getTime() < 1000 * 60 * 5}
                      primaryAction={{
                        label: 'İsteği Geri Çek',
                        variant: 'ghost',
                        onClick: () => {
                          void handleRemoveFriend(target.id);
                        },
                      }}
                    />
                  );
                })
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card padding="lg">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-success" />
              <h2 className="font-display text-lg font-semibold text-text-primary">Arkadaş Listem</h2>
            </div>
            <div className="space-y-3">
              {acceptedFriends.length === 0 ? (
                <p className="text-sm text-text-secondary">İlk arkadaşını ekleyerek mini leaderboard ve düello davetlerini aç.</p>
              ) : (
                acceptedFriends.map((friend) => (
                  <FriendRow
                    key={friend.id}
                    username={friend.username}
                    avatar={friend.avatar_url}
                    frame={friend.avatar_frame}
                    favoriteTeam={friend.favorite_team}
                    status="accepted"
                    isOnline={Date.now() - new Date(friend.last_seen_at).getTime() < 1000 * 60 * 5}
                    primaryAction={{
                      label: 'Düello Gönder',
                      onClick: () => {
                        void handleDuelInvite(friend.id);
                      },
                    }}
                    secondaryAction={{
                      label: 'Kaldır',
                      variant: 'ghost',
                      onClick: () => {
                        void handleRemoveFriend(friend.id);
                      },
                    }}
                  />
                ))
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <FriendLeaderboard entries={friendLeaderboardEntries} />
        </motion.div>

        <motion.div variants={item}>
          <AchievementStrip titles={getUnlockedTitles(newlyUnlocked)} />
        </motion.div>

        {achievementMessage && (
          <motion.div variants={item}>
            <Card padding="md" variant="highlighted">
              <p className="text-sm text-text-secondary">{achievementMessage}</p>
            </Card>
          </motion.div>
        )}

        <motion.div variants={item}>
          <Card padding="lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-text-primary">Başarımlar</h2>
              <span className="text-xs text-text-secondary">{unlockedAchievements.length}/{ACHIEVEMENT_DEFINITIONS.length} açıldı</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {ACHIEVEMENT_DEFINITIONS.map((achievement) => {
                const progress = achievementProgress[achievement.key] ?? evaluatedAchievements.find((item) => item.key === achievement.key)?.progress ?? 0;
                const unlocked = unlockedAchievements.some((item) => item.key === achievement.key);
                return (
                  <AchievementCard
                    key={achievement.key}
                    name={achievement.name}
                    description={achievement.description}
                    tier={achievement.tier}
                    progress={progress}
                    target={achievement.target}
                    unlocked={unlocked}
                  />
                );
              })}
            </div>
          </Card>
        </motion.div>

        {user.favorite_team && (
          <motion.div variants={item}>
            <Card padding="md">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-danger" />
                <div>
                  <p className="text-xs text-text-secondary">Favori Takım</p>
                  <p className="font-display text-lg font-semibold text-text-primary">{user.favorite_team}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        <motion.div variants={item}>
          <Card padding="lg">
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-text-secondary" />
              Ayarlar
            </h2>
            <div className="space-y-3">
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
                <div className={cn('w-12 h-6 rounded-full transition-colors relative', user.settings.sound_enabled ? 'bg-primary-500' : 'bg-bg-elevated')}>
                  <div className={cn('absolute top-1 w-4 h-4 rounded-full bg-white transition-transform', user.settings.sound_enabled ? 'right-1' : 'left-1')} />
                </div>
              </button>

              <button
                onClick={() => updateSettings({ vibration_enabled: !user.settings.vibration_enabled })}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-bg-primary hover:bg-bg-elevated transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Vibrate className={cn('w-5 h-5', user.settings.vibration_enabled ? 'text-primary-500' : 'text-text-muted')} />
                  <span className="text-text-primary">Titreşim</span>
                </div>
                <div className={cn('w-12 h-6 rounded-full transition-colors relative', user.settings.vibration_enabled ? 'bg-primary-500' : 'bg-bg-elevated')}>
                  <div className={cn('absolute top-1 w-4 h-4 rounded-full bg-white transition-transform', user.settings.vibration_enabled ? 'right-1' : 'left-1')} />
                </div>
              </button>

              <Link href="/themes" className="w-full block">
                <div className="w-full flex items-center justify-between p-3 rounded-xl bg-bg-primary hover:bg-bg-elevated transition-colors">
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-primary-500" />
                    <span className="text-text-primary">Tema Mağazası</span>
                  </div>
                  <span className="text-sm text-text-secondary">Aç</span>
                </div>
              </Link>

              <button
                onClick={() => {
                  if (isSupported) {
                    toggleSubscription();
                  } else {
                    alert('Tarayıcınız bildirimleri desteklemiyor.');
                  }
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-bg-primary hover:bg-bg-elevated transition-colors"
              >
                <div className="flex items-center gap-3">
                  {user.settings.notifications_enabled ? (
                    <Bell className="w-5 h-5 text-primary-500" />
                  ) : (
                    <BellOff className="w-5 h-5 text-text-muted" />
                  )}
                  <span className="text-text-primary">Bildirimler {isSupported ? '' : '(Desteklenmiyor)'}</span>
                </div>
                <div className={cn('w-12 h-6 rounded-full transition-colors relative', user.settings.notifications_enabled ? 'bg-primary-500' : 'bg-bg-elevated')}>
                  <div className={cn('absolute top-1 w-4 h-4 rounded-full bg-white transition-transform', user.settings.notifications_enabled ? 'right-1' : 'left-1')} />
                </div>
              </button>
            </div>
          </Card>
        </motion.div>

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
