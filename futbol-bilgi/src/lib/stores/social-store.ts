import { create } from 'zustand';
import type { DuelInvite, Friendship, User } from '@/types';

export interface SocialProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  avatar_frame: string | null;
  favorite_team: string | null;
  league_tier: User['league_tier'];
  elo_rating: number;
  score: number;
  last_seen_at: string;
}

interface SocialSnapshot {
  profiles: SocialProfile[];
  friendships: Friendship[];
  duelInvites: DuelInvite[];
}

interface SocialState extends SocialSnapshot {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  lastPresencePingAt: number | null;
}

interface SocialActionResult {
  success: boolean;
  message: string;
}

interface SocialActions {
  hydrate: (user: User) => Promise<void>;
  refresh: () => Promise<void>;
  syncCurrentUser: (user: User) => void;
  markUserActive: () => Promise<void>;
  sendFriendRequest: (targetUsername: string) => Promise<SocialActionResult>;
  acceptFriendRequest: (requesterId: string) => Promise<SocialActionResult>;
  rejectFriendRequest: (requesterId: string) => Promise<SocialActionResult>;
  removeFriend: (friendId: string) => Promise<SocialActionResult>;
  sendDuelInvite: (toUserId: string) => Promise<SocialActionResult>;
  acceptDuelInvite: (inviteId: string) => Promise<SocialActionResult>;
  rejectDuelInvite: (inviteId: string) => Promise<SocialActionResult>;
}

export type SocialStore = SocialState & SocialActions;

const initialState: SocialState = {
  profiles: [],
  friendships: [],
  duelInvites: [],
  isLoaded: false,
  isLoading: false,
  error: null,
  lastPresencePingAt: null,
};

function buildCurrentUserProfile(user: User): SocialProfile {
  return {
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
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<{ ok: boolean; data: T | null; error: string | null }> {
  const response = await fetch(input, init);
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      ok: false,
      data: null,
      error: json?.error ?? 'İşlem başarısız oldu.',
    };
  }

  return {
    ok: true,
    data: (json?.data ?? null) as T | null,
    error: null,
  };
}

export const useSocialStore = create<SocialStore>()((set, get) => ({
  ...initialState,

  syncCurrentUser: (user) => {
    const currentProfile = buildCurrentUserProfile(user);

    set((state) => ({
      profiles: state.profiles.some((profile) => profile.id === user.id)
        ? state.profiles.map((profile) => (profile.id === user.id ? { ...profile, ...currentProfile } : profile))
        : [currentProfile, ...state.profiles],
    }));
  },

  hydrate: async (user) => {
    get().syncCurrentUser(user);
    set({ isLoading: true, error: null });

    const result = await fetchJson<SocialSnapshot>('/api/social');
    if (!result.ok || !result.data) {
      set({ isLoading: false, isLoaded: true, error: result.error ?? 'Sosyal veriler yüklenemedi.' });
      return;
    }

    const snapshot = result.data;

    set((state) => ({
      profiles: snapshot.profiles.some((profile) => profile.id === user.id)
        ? snapshot.profiles
        : [buildCurrentUserProfile(user), ...snapshot.profiles],
      friendships: snapshot.friendships,
      duelInvites: snapshot.duelInvites,
      isLoading: false,
      isLoaded: true,
      error: null,
      lastPresencePingAt: state.lastPresencePingAt,
    }));
  },

  refresh: async () => {
    const userProfile = get().profiles[0];
    set({ isLoading: true, error: null });

    const result = await fetchJson<SocialSnapshot>('/api/social');
    if (!result.ok || !result.data) {
      set({ isLoading: false, error: result.error ?? 'Sosyal veriler yenilenemedi.' });
      return;
    }

    const snapshot = result.data;

    set((state) => ({
      profiles: userProfile && !snapshot.profiles.some((profile) => profile.id === userProfile.id)
        ? [userProfile, ...snapshot.profiles]
        : snapshot.profiles,
      friendships: snapshot.friendships,
      duelInvites: snapshot.duelInvites,
      isLoading: false,
      isLoaded: true,
      error: null,
      lastPresencePingAt: state.lastPresencePingAt,
    }));
  },

  markUserActive: async () => {
    const { lastPresencePingAt } = get();
    const now = Date.now();

    if (lastPresencePingAt && now - lastPresencePingAt < 60_000) {
      return;
    }

    set((state) => ({
      profiles: state.profiles.map((profile, index) => (index === 0 ? { ...profile, last_seen_at: new Date().toISOString() } : profile)),
      lastPresencePingAt: now,
    }));

    await fetchJson('/api/social/presence', { method: 'POST' });
  },

  sendFriendRequest: async (targetUsername) => {
    const result = await fetchJson<SocialSnapshot>('/api/social/friendships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: targetUsername }),
    });

    if (!result.ok || !result.data) {
      return { success: false, message: result.error ?? 'Arkadaş isteği gönderilemedi.' };
    }

    set((state) => ({ ...state, ...result.data, isLoaded: true, error: null }));
    return { success: true, message: 'Arkadaş isteği gönderildi.' };
  },

  acceptFriendRequest: async (requesterId) => {
    const result = await fetchJson<SocialSnapshot>('/api/social/friendships', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept', requesterId }),
    });

    if (!result.ok || !result.data) {
      return { success: false, message: result.error ?? 'Arkadaş isteği kabul edilemedi.' };
    }

    set((state) => ({ ...state, ...result.data, isLoaded: true, error: null }));
    return { success: true, message: 'Arkadaş isteği kabul edildi.' };
  },

  rejectFriendRequest: async (requesterId) => {
    const result = await fetchJson<SocialSnapshot>('/api/social/friendships', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', requesterId }),
    });

    if (!result.ok || !result.data) {
      return { success: false, message: result.error ?? 'Arkadaş isteği reddedilemedi.' };
    }

    set((state) => ({ ...state, ...result.data, isLoaded: true, error: null }));
    return { success: true, message: 'Arkadaş isteği reddedildi.' };
  },

  removeFriend: async (friendId) => {
    const result = await fetchJson<SocialSnapshot>('/api/social/friendships', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendId }),
    });

    if (!result.ok || !result.data) {
      return { success: false, message: result.error ?? 'Arkadaş kaldırılamadı.' };
    }

    set((state) => ({ ...state, ...result.data, isLoaded: true, error: null }));
    return { success: true, message: 'Arkadaş listenden kaldırıldı.' };
  },

  sendDuelInvite: async (toUserId) => {
    const result = await fetchJson<SocialSnapshot>('/api/social/duel-invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toUserId }),
    });

    if (!result.ok || !result.data) {
      return { success: false, message: result.error ?? 'Düello daveti gönderilemedi.' };
    }

    set((state) => ({ ...state, ...result.data, isLoaded: true, error: null }));
    return { success: true, message: 'Düello daveti gönderildi.' };
  },

  acceptDuelInvite: async (inviteId) => {
    const result = await fetchJson<SocialSnapshot>('/api/social/duel-invites', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteId, action: 'accept' }),
    });

    if (!result.ok || !result.data) {
      return { success: false, message: result.error ?? 'Düello daveti kabul edilemedi.' };
    }

    set((state) => ({ ...state, ...result.data, isLoaded: true, error: null }));
    return { success: true, message: 'Düello daveti kabul edildi.' };
  },

  rejectDuelInvite: async (inviteId) => {
    const result = await fetchJson<SocialSnapshot>('/api/social/duel-invites', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteId, action: 'reject' }),
    });

    if (!result.ok || !result.data) {
      return { success: false, message: result.error ?? 'Düello daveti reddedilemedi.' };
    }

    set((state) => ({ ...state, ...result.data, isLoaded: true, error: null }));
    return { success: true, message: 'Düello daveti reddedildi.' };
  },
}));
