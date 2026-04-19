export type AnalyticsValue = string | number | boolean | null | undefined;

export type AnalyticsProperties = Record<string, AnalyticsValue>;

export interface AnalyticsProvider {
  init(): void;
  page(name: string, properties?: AnalyticsProperties): void;
  track(name: string, properties?: AnalyticsProperties): void;
  identify(userId: string, traits?: AnalyticsProperties): void;
  reset(): void;
}
