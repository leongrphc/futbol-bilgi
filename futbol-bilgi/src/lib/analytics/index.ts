'use client';

import { createPosthogAnalyticsProvider } from './providers/posthog';
import { createNoopAnalyticsProvider } from './providers/noop';
import type { AnalyticsEventName } from './events';
import type { AnalyticsProperties, AnalyticsProvider } from './types';

let provider: AnalyticsProvider | null = null;

function getProvider() {
  if (provider) {
    return provider;
  }

  const isEnabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';
  const providerName = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER;

  if (!isEnabled) {
    provider = createNoopAnalyticsProvider();
    return provider;
  }

  if (providerName === 'posthog') {
    provider = createPosthogAnalyticsProvider();
    return provider;
  }

  provider = createNoopAnalyticsProvider();
  return provider;
}

export function initAnalytics() {
  getProvider().init();
}

export function trackPageView(screenName: string, properties?: AnalyticsProperties) {
  getProvider().page(screenName, properties);
}

export function trackEvent(name: AnalyticsEventName, properties?: AnalyticsProperties) {
  getProvider().track(name, properties);
}

export function identifyUser(userId: string, traits?: AnalyticsProperties) {
  getProvider().identify(userId, traits);
}

export function resetAnalytics() {
  getProvider().reset();
}
