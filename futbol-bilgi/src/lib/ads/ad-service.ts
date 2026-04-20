export type RewardedPlacement = 'dashboard_reward' | 'millionaire_energy';
export type InterstitialPlacement = 'quick_result' | 'millionaire_result' | 'duel_result';

export interface RewardedAdOptions {
  placement: RewardedPlacement;
}

export interface InterstitialAdOptions {
  placement: InterstitialPlacement;
}

export interface AdResult {
  completed: boolean;
  reason?: string;
}

export interface AdService {
  showRewardedAd(options: RewardedAdOptions): Promise<AdResult>;
  showInterstitialAd(options: InterstitialAdOptions): Promise<AdResult>;
}
