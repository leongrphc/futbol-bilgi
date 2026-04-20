'use client';

import { useCallback, useState } from 'react';
import { getAdService } from '@/lib/ads';
import type { InterstitialPlacement, RewardedPlacement } from '@/lib/ads/ad-service';

export function useAd() {
  const [isShowingRewarded, setIsShowingRewarded] = useState(false);
  const [isShowingInterstitial, setIsShowingInterstitial] = useState(false);

  const showRewardedAd = useCallback(async (placement: RewardedPlacement) => {
    setIsShowingRewarded(true);
    try {
      return await getAdService().showRewardedAd({ placement });
    } finally {
      setIsShowingRewarded(false);
    }
  }, []);

  const showInterstitialAd = useCallback(async (placement: InterstitialPlacement) => {
    setIsShowingInterstitial(true);
    try {
      return await getAdService().showInterstitialAd({ placement });
    } finally {
      setIsShowingInterstitial(false);
    }
  }, []);

  return {
    showRewardedAd,
    showInterstitialAd,
    isShowingRewarded,
    isShowingInterstitial,
  };
}
