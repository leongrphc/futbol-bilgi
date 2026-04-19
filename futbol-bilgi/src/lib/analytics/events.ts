export const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'page_view',
  NAV_CLICKED: 'nav_clicked',
  AUTH_ATTEMPTED: 'auth_attempted',
  AUTH_FAILED: 'auth_failed',
  GAME_MODE_SELECTED: 'game_mode_selected',
  GAME_STARTED: 'game_started',
  GAME_COMPLETED: 'game_completed',
  JOKER_USED: 'joker_used',
  SHARE_CLICKED: 'share_clicked',
  SHARE_COMPLETED: 'share_completed',
  LEADERBOARD_FILTER_CHANGED: 'leaderboard_filter_changed',
  PROFILE_ACTION: 'profile_action',
  DAILY_MODE_VIEWED: 'daily_mode_viewed',
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
