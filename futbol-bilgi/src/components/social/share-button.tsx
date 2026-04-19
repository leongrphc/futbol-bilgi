'use client';

import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shareContent, type SharePayload } from '@/lib/utils/share';

interface ShareButtonProps {
  payload: SharePayload;
  label?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function ShareButton({
  payload,
  label = 'Paylaş',
  variant = 'ghost',
  size = 'sm',
  fullWidth = false,
}: ShareButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'shared' | 'copied'>('idle');

  const handleShare = async () => {
    setState('loading');
    const result = await shareContent(payload);
    setState(result.method === 'clipboard' ? 'copied' : 'shared');
    setTimeout(() => setState('idle'), 1800);
  };

  return (
    <Button variant={variant} size={size} fullWidth={fullWidth} onClick={handleShare} isLoading={state === 'loading'}>
      {state === 'shared' ? <Check className="h-4 w-4" /> : state === 'copied' ? <Copy className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {state === 'shared' ? 'Paylaşıldı' : state === 'copied' ? 'Kopyalandı' : label}
    </Button>
  );
}
