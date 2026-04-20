export const AD_CONFIG = {
  rewarded: {
    simulatedDurationMs: 3000,
    failureRate: 0,
  },
  interstitial: {
    sessionInterval: 3,
    dailyLimit: 10,
    minTimeBetweenMs: 180000,
    simulatedDurationMs: 1800,
    failureRate: 0,
  },
} as const;
