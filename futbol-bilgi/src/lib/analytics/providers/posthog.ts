import posthog from 'posthog-js';
import { createNoopAnalyticsProvider } from './noop';
import type { AnalyticsProvider } from '../types';

export function createPosthogAnalyticsProvider(): AnalyticsProvider {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!key || !host) {
    return createNoopAnalyticsProvider();
  }

  let initialized = false;

  const ensureInit = () => {
    if (initialized || typeof window === 'undefined') {
      return;
    }

    posthog.init(key, {
      api_host: host,
      capture_pageview: false,
      persistence: 'localStorage+cookie',
    });

    initialized = true;
  };

  return {
    init() {
      ensureInit();
    },
    page(name, properties) {
      ensureInit();
      posthog.capture('page_view', {
        screen_name: name,
        ...properties,
      });
    },
    track(name, properties) {
      ensureInit();
      posthog.capture(name, properties);
    },
    identify(userId, traits) {
      ensureInit();
      posthog.identify(userId, traits);
    },
    reset() {
      ensureInit();
      posthog.reset();
    },
  };
}
