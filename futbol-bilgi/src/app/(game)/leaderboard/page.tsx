'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, UserPlus, Swords } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/lib/stores/user-store';
import { useSocialStore } from '@/lib/stores/social-store';
import { useLeagueStore } from '@/lib/stores/league-store';
import { LEAGUE_TIER_CONFIG } from '@/lib/constants/game';
import { getLeagueZone } from '@/lib/league/ranking';
import { SeasonalLeaderboard } from '@/components/league/seasonal-leaderboard';
import { ShareButton } from '@/components/social/share-button';
import { buildFriendLeaderboardShare } from '@/lib/utils/share';
import { trackEvent } from '@/lib/analytics';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import { cn } from '@/lib/utils/cn';
import type { LeagueTier } from '@/types';

interface OverallPlayer {
  id: string;
  username: string;
  avatar_url: string | null;
  avatar_frame: string | null;
  league_tier: LeagueTier;
  score: number;
}

type Period = 'daily' | 'weekly' | 'monthly' | 'all_time';
type Mode = 'overall' | 'millionaire' | 'duel';
type Scope = 'all' | 'friends';

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

const SCOPE_LABELS: Record<Scope, string> = {
  all: 'Genel',
  friends: 'Arkadaşlar',
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>('weekly');
  const [mode, setMode] = useState<Mode>('overall');
  const [scope, setScope] = useState<Scope>('all');
  const [message, setMessage] = useState<string | null>(null);
  const [isFinalizingSeason, setIsFinalizingSeason] = useState(false);
  const [overallPlayers, setOverallPlayers] = useState<OverallPlayer[]>([]);

  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const profiles = useSocialStore((state) => state.profiles);
  const friendships = useSocialStore((state) => state.friendships);
  const currentSeason = useLeagueStore((state) => state.currentSeason);
  const leagueEntries = useLeagueStore((state) => state.entries);
  const fetchCurrentSeason = useLeagueStore((state) => state.fetchCurrentSeason);
  const fetchEntries = useLeagueStore((state) => state.fetchEntries);
  const ensurePlayerEntry = useLeagueStore((state) => state.ensurePlayerEntry);
  const finalizeSeasonForTier = useLeagueStore((state) => state.finalizeSeasonForTier);
  const ensureCurrentUserProfile = useSocialStore((state) => state.ensureCurrentUserProfile);
  const markUserActive = useSocialStore((state) => state.markUserActive);
  const sendFriendRequest = useSocialStore((state) => state.sendFriendRequest);
  const sendDuelInvite = useSocialStore((state) => state.sendDuelInvite);

  useEffect(() => {
    if (!user) return;
    ensureCurrentUserProfile(user);
    markUserActive(user.id);
    fetchCurrentSeason();
    ensurePlayerEntry(user.id, user.league_tier);
  }, [user, ensureCurrentUserProfile, markUserActive, fetchCurrentSeason, ensurePlayerEntry]);

  useEffect(() => {
    if (!currentSeason) return;
    fetchEntries(currentSeason.id);
  }, [currentSeason, fetchEntries]);

  useEffect(() => {
    const fetchOverall = async () => {
      try {
        const response = await fetch('/api/leaderboard/overall?limit=200');
        const json = await response.json();
        if (json.data) {
          setOverallPlayers(
            json.data.map((player: { xp: number }) => ({
              ...player,
              score: player.xp,
            })),
          );
        }
      } catch (error) {
        console.error('Failed to fetch overall leaderboard:', error);
      }
    };

    void fetchOverall();
  }, []);

  const currentUserProfile = useMemo(() => {
    if (!user) return null;
    return profiles.find((profile) => profile.id === user.id) ?? {
      id: user.id,
      username: user.username,
      avatar_url: user.avatar_url,
      avatar_frame: user.avatar_frame,
      favorite_team: user.favorite_team,
      league_tier: user.league_tier,
      elo_rating: user.elo_rating,
      score: user.xp,
      last_seen_at: new Date().toISOString(),
    };
  }, [profiles, user]);

  const allPlayers = useMemo(() => {
    const merged = [...overallPlayers];

    if (currentUserProfile && !merged.some((player) => player.id === currentUserProfile.id)) {
      merged.push({
        id: currentUserProfile.id,
        username: currentUserProfile.username,
        avatar_url: currentUserProfile.avatar_url,
        avatar_frame: currentUserProfile.avatar_frame,
        league_tier: currentUserProfile.league_tier,
        score: currentUserProfile.score,
      });
    }

    return merged.sort((a, b) => b.score - a.score);
  }, [overallPlayers, currentUserProfile]);

  const friendIds = useMemo(
    () => friendships
      .filter((friendship) => user && friendship.user_id === user.id && friendship.status === 'accepted')
      .map((friendship) => friendship.friend_id),
    [friendships, user],
  );

  const visiblePlayers = useMemo(() => {
    if (!user) return allPlayers;
    if (scope === 'friends') {
      return allPlayers.filter((player) => player.id === user.id || friendIds.includes(player.id));
    }
    return allPlayers;
  }, [allPlayers, scope, user, friendIds]);

  const rankedPlayers = visiblePlayers.map((player, index) => ({ ...player, rank: index + 1 }));
  const topThree = rankedPlayers.slice(0, 3);
  const remaining = rankedPlayers.slice(3);

  const currentEntry = user && currentSeason
    ? leagueEntries.find((entry) => entry.user_id === user.id && entry.season_id === currentSeason.id)
    : undefined;
  const currentSeasonTier = currentEntry?.tier_at_start ?? user?.league_tier;
  const currentTierEntries = currentSeasonTier && currentSeason
    ? leagueEntries.filter((entry) => entry.season_id === currentSeason.id && entry.tier_at_start === currentSeasonTier)
    : [];

  if (user && !currentSeason) {
    return (
      <div className="min-h-screen p-4 pb-24 flex items-center justify-center">
        <Card padding="lg" className="text-center">
          <p className="text-text-secondary">Sezon bilgisi yükleniyor...</p>
        </Card>
      </div>
    );
  }

  const rankedSeasonEntries = [...currentTierEntries]
    .sort((a, b) => {
      if (b.season_score !== a.season_score) return b.season_score - a.season_score;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
      zone: getLeagueZone(index + 1, currentTierEntries.length),
      username: profiles.find((profile) => profile.id === entry.user_id)?.username ?? user?.username ?? 'Oyuncu',
    }));

  const friendshipStatusFor = (playerId: string) => {
    if (!user) return 'none';
    const relation = friendships.find(
      (friendship) =>
        (friendship.user_id === user.id && friendship.friend_id === playerId) ||
        (friendship.user_id === playerId && friendship.friend_id === user.id),
    );

    if (!relation) return 'none';
    if (relation.status === 'accepted') return 'accepted';
    if (relation.user_id === user.id) return 'outgoing';
    return 'incoming';
  };

  const handleFriendAction = (username: string) => {
    if (!user) return;
    const result = sendFriendRequest(user.id, username);
    setMessage(result.message);
  };

  const handleInviteAction = (playerId: string) => {
    if (!user) return;
    const result = sendDuelInvite(user.id, playerId);
    setMessage(result.message);
  };

  const handleFinalizeSeason = async () => {
    if (!user || isFinalizingSeason) return;

    try {
      setIsFinalizingSeason(true);
      const result = await finalizeSeasonForTier(currentSeasonTier ?? user.league_tier);
      setUser(result.profile);
      setMessage('Bu lig için sezon sonuçları kaydedildi.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sezon sonuçları kaydedilemedi.');
    } finally {
      setIsFinalizingSeason(false);
    }
  };

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-8 h-8 text-secondary-500" />
            <h1 className="font-display text-3xl font-bold text-text-primary">Sıralama</h1>
          </div>
          <p className="text-text-secondary text-sm">En iyi oyuncular arasında yerinizi alın</p>
          <div className="mt-3 flex justify-center">
            <ShareButton
              payload={buildFriendLeaderboardShare({
                title: scope === 'friends' ? 'Arkadaş Sıralamam' : 'Genel Sıralamam',
                leaderName: rankedPlayers[0]?.username ?? user?.username ?? 'Oyuncu',
                leaderScore: rankedPlayers[0]?.score ?? 0,
                playerCount: rankedPlayers.length,
              })}
              label="Sıralamayı Paylaş"
              variant="outline"
              size="sm"
            />
          </div>
          {message && <p className="mt-3 text-sm text-text-secondary">{message}</p>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card padding="sm">
            <div className="grid grid-cols-4 gap-1">
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPeriod(p);
                    trackEvent(ANALYTICS_EVENTS.LEADERBOARD_FILTER_CHANGED, {
                      filter: 'period',
                      value: p,
                    });
                  }}
                  className={cn(
                    'py-2 px-3 rounded-lg text-sm font-semibold transition-all',
                    period === p
                      ? 'bg-primary-500 text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
                  )}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card padding="sm">
            <div className="grid grid-cols-3 gap-1">
              {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    trackEvent(ANALYTICS_EVENTS.LEADERBOARD_FILTER_CHANGED, {
                      filter: 'mode',
                      value: m,
                    });
                  }}
                  className={cn(
                    'py-2 px-3 rounded-lg text-sm font-semibold transition-all',
                    mode === m
                      ? 'bg-secondary-500 text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
                  )}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card padding="sm">
            <div className="grid grid-cols-2 gap-1">
              {(Object.keys(SCOPE_LABELS) as Scope[]).map((value) => (
                <button
                  key={value}
                  onClick={() => {
                    setScope(value);
                    trackEvent(ANALYTICS_EVENTS.LEADERBOARD_FILTER_CHANGED, {
                      filter: 'scope',
                      value,
                    });
                  }}
                  className={cn(
                    'py-2 px-3 rounded-lg text-sm font-semibold transition-all',
                    scope === value
                      ? 'bg-info text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
                  )}
                >
                  {SCOPE_LABELS[value]}
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {user && rankedSeasonEntries.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <SeasonalLeaderboard
              rows={rankedSeasonEntries.map((entry) => ({
                userId: entry.user_id,
                username: entry.username,
                tier: entry.tier_at_start,
                rank: entry.rank,
                seasonScore: entry.season_score,
                zone: entry.zone,
                isCurrentUser: entry.user_id === user.id,
              }))}
            />
          </motion.div>
        )}

        {topThree.length > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}>
            <Card padding="lg" variant="elevated">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold text-text-primary">Genel Klasman</h3>
                  <p className="text-xs text-text-secondary">Arkadaş ve genel skor görünümü</p>
                </div>
                {user && (
                  <Button size="sm" variant="ghost" onClick={handleFinalizeSeason} disabled={isFinalizingSeason}>
                    {isFinalizingSeason ? 'Hesaplanıyor...' : 'Sezonu Hesapla'}
                  </Button>
                )}
              </div>
              <div className="flex items-end justify-center gap-4">
                {topThree[1] && <PodiumPlayer player={topThree[1]} position={2} />}
                {topThree[0] && <PodiumPlayer player={topThree[0]} position={1} />}
                {topThree[2] && <PodiumPlayer player={topThree[2]} position={3} />}
              </div>
            </Card>
          </motion.div>
        )}

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
          {remaining.map((player) => {
            const isCurrentUser = user && player.id === user.id;
            const friendshipStatus = friendshipStatusFor(player.id);

            return (
              <motion.div key={player.id} variants={item}>
                <Card
                  padding="md"
                  variant={isCurrentUser ? 'highlighted' : 'default'}
                  hoverable={!isCurrentUser}
                  className={cn('transition-all', isCurrentUser && 'ring-2 ring-primary-500/50')}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 text-center">
                      <span className={cn('font-display text-lg font-bold', isCurrentUser ? 'text-primary-500' : 'text-text-secondary')}>
                        {player.rank}
                      </span>
                    </div>

                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center text-lg font-display font-bold',
                      isCurrentUser ? 'bg-gradient-to-br from-primary-500 to-secondary-500' : 'bg-gradient-to-br from-bg-elevated to-bg-card',
                    )}>
                      {player.username.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={cn('font-display font-semibold truncate', isCurrentUser ? 'text-primary-500' : 'text-text-primary')}>
                        {player.username}
                        {isCurrentUser && <span className="ml-2 text-xs text-primary-500">(Sen)</span>}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {LEAGUE_TIER_CONFIG[player.league_tier as LeagueTier].icon} {LEAGUE_TIER_CONFIG[player.league_tier as LeagueTier].name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isCurrentUser && friendshipStatus === 'none' && (
                        <Button size="sm" variant="ghost" onClick={() => handleFriendAction(player.username)}>
                          <UserPlus className="h-4 w-4" /> Ekle
                        </Button>
                      )}
                      {!isCurrentUser && friendshipStatus === 'incoming' && (
                        <Button size="sm" variant="secondary" onClick={() => handleFriendAction(player.username)}>
                          Kabul Et
                        </Button>
                      )}
                      {!isCurrentUser && friendshipStatus === 'accepted' && (
                        <Button size="sm" variant="primary" onClick={() => handleInviteAction(player.id)}>
                          <Swords className="h-4 w-4" /> Düello
                        </Button>
                      )}
                      {!isCurrentUser && friendshipStatus === 'outgoing' && (
                        <span className="rounded-full bg-info/20 px-3 py-1 text-xs font-medium text-info">Gönderildi</span>
                      )}

                      <div className="text-right">
                        <p className={cn('font-mono text-lg font-bold', isCurrentUser ? 'text-primary-500' : 'text-text-primary')}>
                          {player.score.toLocaleString()}
                        </p>
                      </div>
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

function PodiumPlayer({ player, position }: { player: { username: string; score: number; league_tier: LeagueTier }; position: 1 | 2 | 3 }) {
  const sizeClass = position === 1 ? 'w-20 h-20 text-3xl' : 'w-16 h-16 text-2xl';
  const borderClass = position === 1 ? 'border-warning/30' : position === 2 ? 'border-gray-400/30' : 'border-orange-600/30';
  const badgeClass = position === 1 ? 'bg-warning' : position === 2 ? 'bg-gray-400' : 'bg-orange-600';
  const scoreClass = position === 1 ? 'text-warning text-xl' : position === 2 ? 'text-secondary-500 text-lg' : 'text-accent-500 text-lg';
  const columnHeight = position === 1 ? 'h-28 border-warning from-warning/20 to-warning/10' : position === 2 ? 'h-20 border-gray-400 from-gray-400/20 to-gray-400/10' : 'h-16 border-orange-600 from-orange-600/20 to-orange-600/10';

  return (
    <div className="flex-1 text-center">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative">
        {position === 1 && <Crown className="w-8 h-8 text-warning mx-auto mb-1" />}
        <div className={cn('mx-auto mb-2 rounded-full border-4 flex items-center justify-center font-display font-bold text-white bg-gradient-to-br', sizeClass, borderClass, position === 1 ? 'from-warning to-yellow-600' : position === 2 ? 'from-gray-400 to-gray-600' : 'from-orange-600 to-orange-800')}>
          {player.username.charAt(0).toUpperCase()}
        </div>
        <div className={cn('absolute rounded-full flex items-center justify-center text-white font-bold text-sm w-8 h-8', badgeClass, position === 1 ? 'top-8 -right-2' : '-top-2 -right-2')}>
          {position}
        </div>
        <p className="font-display font-semibold text-text-primary truncate">{player.username}</p>
        <p className="text-xs text-text-secondary mt-1">{LEAGUE_TIER_CONFIG[player.league_tier].icon}</p>
        <p className={cn('font-mono font-bold mt-1', scoreClass)}>{player.score.toLocaleString()}</p>
      </motion.div>
      <div className={cn('mt-3 rounded-t-xl border-t-4 bg-gradient-to-t', columnHeight)} />
    </div>
  );
}
