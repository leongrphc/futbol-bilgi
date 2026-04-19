'use client';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import type { FriendshipStatus } from '@/types';

interface FriendRowProps {
  username: string;
  subtitle?: string;
  avatar?: string | null;
  frame?: string | null;
  favoriteTeam?: string | null;
  isOnline?: boolean;
  status?: FriendshipStatus | 'outgoing';
  primaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    disabled?: boolean;
  };
}

const statusLabelMap: Record<FriendshipStatus | 'outgoing', string> = {
  pending: 'Gelen İstek',
  accepted: 'Arkadaş',
  blocked: 'Engelli',
  outgoing: 'Gönderildi',
};

const statusVariantMap: Record<FriendshipStatus | 'outgoing', 'warning' | 'success' | 'danger' | 'info'> = {
  pending: 'warning',
  accepted: 'success',
  blocked: 'danger',
  outgoing: 'info',
};

export function FriendRow({
  username,
  subtitle,
  avatar,
  frame,
  favoriteTeam,
  isOnline = false,
  status,
  primaryAction,
  secondaryAction,
}: FriendRowProps) {
  return (
    <Card padding="md" className="space-y-3">
      <div className="flex items-center gap-3">
        <Avatar
          src={avatar}
          fallback={username}
          frame={frame}
          showOnline
          isOnline={isOnline}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-display text-base font-bold text-text-primary">{username}</p>
            {status && <Badge variant={statusVariantMap[status]} size="sm">{statusLabelMap[status]}</Badge>}
          </div>
          <p className="truncate text-sm text-text-secondary">
            {subtitle ?? (isOnline ? 'Çevrimiçi' : 'Yakın zamanda aktif')}
          </p>
          {favoriteTeam && (
            <p className="mt-1 text-xs text-text-muted">Favori takım: {favoriteTeam}</p>
          )}
        </div>
      </div>

      {(primaryAction || secondaryAction) && (
        <div className={cn('grid gap-2', secondaryAction ? 'grid-cols-2' : 'grid-cols-1')}>
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant ?? 'ghost'}
              size="sm"
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
              fullWidth
            >
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button
              variant={primaryAction.variant ?? 'primary'}
              size="sm"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              fullWidth
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
