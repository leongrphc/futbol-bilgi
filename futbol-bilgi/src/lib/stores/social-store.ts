import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Friendship, FriendshipStatus, User } from '@/types';
import { MOCK_SOCIAL_PLAYERS } from '@/lib/data/mock-social';

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

export interface DuelInvite {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

interface SocialState {
  profiles: SocialProfile[];
  friendships: Friendship[];
  duelInvites: DuelInvite[];
}

interface SocialActions {
  ensureCurrentUserProfile: (user: User) => void;
  markUserActive: (userId: string) => void;
  sendFriendRequest: (userId: string, targetUsername: string) => { success: boolean; message: string };
  acceptFriendRequest: (userId: string, requesterId: string) => void;
  rejectFriendRequest: (userId: string, requesterId: string) => void;
  removeFriend: (userId: string, friendId: string) => void;
  sendDuelInvite: (fromUserId: string, toUserId: string) => { success: boolean; message: string };
  acceptDuelInvite: (inviteId: string) => void;
  rejectDuelInvite: (inviteId: string) => void;
}

export type SocialStore = SocialState & SocialActions;

const initialProfiles: SocialProfile[] = MOCK_SOCIAL_PLAYERS.map((player, index) => ({
  id: player.id,
  username: player.username,
  avatar_url: null,
  avatar_frame: null,
  favorite_team: player.favorite_team,
  league_tier: player.league_tier,
  elo_rating: player.elo_rating,
  score: player.score,
  last_seen_at: new Date(Date.now() - index * 1000 * 60 * 4).toISOString(),
}));

function createFriendship(userId: string, friendId: string, status: FriendshipStatus): Friendship {
  const now = new Date().toISOString();
  return {
    id: `${userId}_${friendId}`,
    user_id: userId,
    friend_id: friendId,
    status,
    created_at: now,
    updated_at: now,
  };
}

export const useSocialStore = create<SocialStore>()(
  persist(
    (set, get) => ({
      profiles: initialProfiles,
      friendships: [],
      duelInvites: [],

      ensureCurrentUserProfile: (user) => {
        const now = new Date().toISOString();
        const state = get();
        const existingProfile = state.profiles.find((profile) => profile.id === user.id);
        const hasExistingRelations = state.friendships.some(
          (friendship) => friendship.user_id === user.id || friendship.friend_id === user.id,
        );

        const currentProfile: SocialProfile = {
          id: user.id,
          username: user.username,
          avatar_url: user.avatar_url,
          avatar_frame: user.avatar_frame,
          favorite_team: user.favorite_team,
          league_tier: user.league_tier,
          elo_rating: user.elo_rating,
          score: user.xp,
          last_seen_at: now,
        };

        const profiles = existingProfile
          ? state.profiles.map((profile) => (profile.id === user.id ? currentProfile : profile))
          : [currentProfile, ...state.profiles];

        let friendships = state.friendships;
        let duelInvites = state.duelInvites;

        if (!hasExistingRelations) {
          const acceptedFriend = state.profiles.find((profile) => profile.username === 'GalatasarayFan');
          const incomingRequest = state.profiles.find((profile) => profile.username === 'FenerliYildiz');
          const outgoingRequest = state.profiles.find((profile) => profile.username === 'TrabzonGucu');

          friendships = [...state.friendships];
          if (acceptedFriend) {
            friendships.push(
              createFriendship(user.id, acceptedFriend.id, 'accepted'),
              createFriendship(acceptedFriend.id, user.id, 'accepted'),
            );
            duelInvites = [
              ...state.duelInvites,
              {
                id: `invite_${acceptedFriend.id}_${user.id}`,
                from_user_id: acceptedFriend.id,
                to_user_id: user.id,
                status: 'pending',
                created_at: now,
              },
            ];
          }
          if (incomingRequest) {
            friendships.push(createFriendship(incomingRequest.id, user.id, 'pending'));
          }
          if (outgoingRequest) {
            friendships.push(createFriendship(user.id, outgoingRequest.id, 'pending'));
          }
        }

        set({ profiles, friendships, duelInvites });
      },

      markUserActive: (userId) => {
        const now = new Date().toISOString();
        set((state) => ({
          profiles: state.profiles.map((profile) =>
            profile.id === userId ? { ...profile, last_seen_at: now } : profile,
          ),
        }));
      },

      sendFriendRequest: (userId, targetUsername) => {
        const state = get();
        const normalized = targetUsername.trim().toLowerCase();
        const sender = state.profiles.find((profile) => profile.id === userId);
        const target = state.profiles.find((profile) => profile.username.toLowerCase() === normalized);

        if (!sender || !target) {
          return { success: false, message: 'Kullanıcı bulunamadı.' };
        }
        if (sender.id === target.id) {
          return { success: false, message: 'Kendine arkadaş isteği gönderemezsin.' };
        }

        const existing = state.friendships.find(
          (friendship) =>
            (friendship.user_id === sender.id && friendship.friend_id === target.id) ||
            (friendship.user_id === target.id && friendship.friend_id === sender.id),
        );

        if (existing?.status === 'accepted') {
          return { success: false, message: 'Bu kullanıcı zaten arkadaş listende.' };
        }
        if (existing?.status === 'pending') {
          return { success: false, message: 'Bu kullanıcı için zaten bekleyen bir istek var.' };
        }
        if (existing?.status === 'blocked') {
          return { success: false, message: 'Bu kullanıcıyla işlem yapılamıyor.' };
        }

        set((current) => ({
          friendships: [...current.friendships, createFriendship(sender.id, target.id, 'pending')],
        }));

        return { success: true, message: `${target.username} kullanıcısına arkadaş isteği gönderildi.` };
      },

      acceptFriendRequest: (userId, requesterId) => {
        set((state) => {
          const updated: Friendship[] = state.friendships.map((friendship) =>
            friendship.user_id === requesterId && friendship.friend_id === userId && friendship.status === 'pending'
              ? { ...friendship, status: 'accepted' as FriendshipStatus, updated_at: new Date().toISOString() }
              : friendship,
          );

          const hasReciprocal = updated.some(
            (friendship) => friendship.user_id === userId && friendship.friend_id === requesterId,
          );

          return {
            friendships: hasReciprocal
              ? updated
              : [...updated, createFriendship(userId, requesterId, 'accepted')],
          };
        });
      },

      rejectFriendRequest: (userId, requesterId) => {
        set((state) => ({
          friendships: state.friendships.filter(
            (friendship) => !(friendship.user_id === requesterId && friendship.friend_id === userId && friendship.status === 'pending'),
          ),
        }));
      },

      removeFriend: (userId, friendId) => {
        set((state) => ({
          friendships: state.friendships.filter(
            (friendship) =>
              !(
                (friendship.user_id === userId && friendship.friend_id === friendId) ||
                (friendship.user_id === friendId && friendship.friend_id === userId)
              ),
          ),
          duelInvites: state.duelInvites.filter(
            (invite) =>
              !(
                (invite.from_user_id === userId && invite.to_user_id === friendId) ||
                (invite.from_user_id === friendId && invite.to_user_id === userId)
              ),
          ),
        }));
      },

      sendDuelInvite: (fromUserId, toUserId) => {
        const state = get();
        const areFriends = state.friendships.some(
          (friendship) =>
            friendship.user_id === fromUserId &&
            friendship.friend_id === toUserId &&
            friendship.status === 'accepted',
        );

        if (!areFriends) {
          return { success: false, message: 'Sadece arkadaşlarına düello daveti gönderebilirsin.' };
        }

        const existingInvite = state.duelInvites.find(
          (invite) => invite.from_user_id === fromUserId && invite.to_user_id === toUserId && invite.status === 'pending',
        );

        if (existingInvite) {
          return { success: false, message: 'Bu arkadaşın için zaten bekleyen bir düello daveti var.' };
        }

        set((current) => ({
          duelInvites: [
            ...current.duelInvites,
            {
              id: `invite_${fromUserId}_${toUserId}_${Date.now()}`,
              from_user_id: fromUserId,
              to_user_id: toUserId,
              status: 'pending',
              created_at: new Date().toISOString(),
            },
          ],
        }));

        return { success: true, message: 'Düello daveti gönderildi.' };
      },

      acceptDuelInvite: (inviteId) => {
        set((state) => ({
          duelInvites: state.duelInvites.map((invite) =>
            invite.id === inviteId ? { ...invite, status: 'accepted' } : invite,
          ),
        }));
      },

      rejectDuelInvite: (inviteId) => {
        set((state) => ({
          duelInvites: state.duelInvites.map((invite) =>
            invite.id === inviteId ? { ...invite, status: 'declined' } : invite,
          ),
        }));
      },
    }),
    {
      name: 'futbol-bilgi-social',
      partialize: (state) => ({
        profiles: state.profiles,
        friendships: state.friendships,
        duelInvites: state.duelInvites,
      }),
    },
  ),
);
