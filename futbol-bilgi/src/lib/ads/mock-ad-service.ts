import { AD_CONFIG } from '@/lib/constants/ads';
import type { AdResult, AdService, InterstitialAdOptions, RewardedAdOptions } from './ad-service';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildResult(failureRate: number): AdResult {
  return Math.random() < failureRate
    ? { completed: false, reason: 'Ad failed to load' }
    : { completed: true };
}

export class MockAdService implements AdService {
  async showRewardedAd(_options: RewardedAdOptions): Promise<AdResult> {
    await wait(AD_CONFIG.rewarded.simulatedDurationMs);
    return buildResult(AD_CONFIG.rewarded.failureRate);
  }

  async showInterstitialAd(_options: InterstitialAdOptions): Promise<AdResult> {
    await wait(AD_CONFIG.interstitial.simulatedDurationMs);
    return buildResult(AD_CONFIG.interstitial.failureRate);
  }
}
