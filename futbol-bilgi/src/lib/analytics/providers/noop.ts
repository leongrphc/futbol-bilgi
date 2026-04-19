import type { AnalyticsProperties, AnalyticsProvider } from '../types';

function logDebug(method: string, name: string, properties?: AnalyticsProperties) {
  if (process.env.NEXT_PUBLIC_ANALYTICS_DEBUG !== 'true') {
    return;
  }

  console.info(`[analytics:${method}]`, name, properties ?? {});
}

export function createNoopAnalyticsProvider(): AnalyticsProvider {
  return {
    init() {},
    page(name, properties) {
      logDebug('page', name, properties);
    },
    track(name, properties) {
      logDebug('track', name, properties);
    },
    identify(userId, traits) {
      logDebug('identify', userId, traits);
    },
    reset() {
      if (process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true') {
        console.info('[analytics:reset]');
      }
    },
  };
}
