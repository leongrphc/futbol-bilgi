// ==========================================
// FutbolBilgi - TypeScript Type Definitions
// ==========================================

// ---------- Enums & Literal Types ----------

export type GameMode = 'millionaire' | 'quick' | 'duel' | 'daily';

export type LeagueScope = 'turkey' | 'europe' | 'world';

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export type JokerType =
  | 'fifty_fifty'
  | 'audience'
  | 'phone'
  | 'freeze_time'
  | 'skip'
  | 'double_answer';

export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'champion';

export type GameResult = 'win' | 'loss' | 'draw' | 'timeout' | 'forfeit';

export type DuelStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export type ShopItemType = 'joker' | 'avatar' | 'frame' | 'energy' | 'cosmetic' | 'theme';

// ---------- Database Models ----------

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  avatar_frame: string | null;
  favorite_team: string | null;
  level: number;
  xp: number;
  coins: number;
  gems: number;
  energy: number;
  energy_last_refill: string; // ISO timestamp
  league_tier: LeagueTier;
  elo_rating: number;
  streak_days: number;
  last_daily_claim: string | null; // ISO timestamp
  total_questions_answered: number;
  total_correct_answers: number;
  settings: UserSettings;
  inventory?: UserInventory[];
  shop_items?: ShopItem[];
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  sound_enabled: boolean;
  music_enabled: boolean;
  vibration_enabled: boolean;
  notifications_enabled: boolean;
  language: string;
  theme: 'dark' | 'green-grass' | 'golden-cup' | 'retro-pitch' | 'champion-night' | 'emerald-flare' | 'midnight-gold';
  rewarded_jokers?: Partial<Record<'double_answer', number>>;
  jokers?: Partial<Record<JokerType, number>>;
  purchases?: {
    starter_pack_claimed?: boolean;
  };
  premium?: {
    claimed_daily_gems_at?: string;
    pass_activated_at?: string;
  };
}

export interface QuestionOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuestionMedia {
  type: 'image' | 'video';
  url: string;
  alt?: string;
}

export interface QuestionStats {
  times_shown: number;
  times_correct: number;
  avg_answer_time_ms: number;
}

export interface Question {
  id: string;
  league_scope: LeagueScope;
  league: string;
  category: string;
  sub_category: string;
  difficulty: DifficultyLevel;
  season_range: string; // e.g. "2020-2024"
  team_tags: string[];
  era_tag: string | null; // e.g. "modern", "classic", "legendary"
  question_text: string;
  options: QuestionOption[];
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  media: QuestionMedia | null;
  stats: QuestionStats;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GameSession {
  id: string;
  user_id: string;
  mode: GameMode;
  league_scope: LeagueScope;
  started_at: string;
  ended_at: string | null;
  score: number;
  questions_answered: number;
  correct_answers: number;
  jokers_used: JokerType[];
  safe_point_reached: number | null;
  result: GameResult | null;
  xp_earned: number;
  coins_earned: number;
  created_at: string;
}

export interface QuestionAnswer {
  id: string;
  session_id: string;
  user_id: string;
  question_id: string;
  user_answer: 'A' | 'B' | 'C' | 'D' | null;
  is_correct: boolean;
  answer_time_ms: number;
  joker_used: JokerType | null;
  question_number: number;
  answered_at: string;
}

export interface Duel {
  id: string;
  player1_id: string;
  player2_id: string;
  status: DuelStatus;
  player1_score: number;
  player2_score: number;
  winner_id: string | null;
  questions: string[];
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  avatar_frame: string | null;
  league_tier: LeagueTier;
  score: number;
  rank: number;
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  mode: GameMode | 'overall';
  updated_at: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: ShopItemType;
  sub_type: string | null;
  price_coins: number | null;
  price_gems: number | null;
  image_url: string | null;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  is_available: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface UserInventory {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  is_equipped: boolean;
  purchased_at: string;
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon_url: string | null;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  coins_reward: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
}

export interface DuelInvite {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';
  question_ids: string[] | null;
  from_user_score: number | null;
  to_user_score: number | null;
  from_user_correct_answers: number | null;
  to_user_correct_answers: number | null;
  from_user_answer_time_ms: number | null;
  to_user_answer_time_ms: number | null;
  from_user_played_at: string | null;
  to_user_played_at: string | null;
  from_user_session_id: string | null;
  to_user_session_id: string | null;
  winner_user_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
}

// ---------- Game Logic Types ----------

export interface MillionaireStep {
  questionNumber: number;
  points: number;
  difficulty: DifficultyLevel;
  isSafePoint: boolean;
  timeLimit: number; // seconds
}

export interface JokerState {
  type: JokerType;
  isUsed: boolean;
  isAvailable: boolean;
}

export interface GameState {
  mode: GameMode;
  sessionId: string | null;
  leagueScope: LeagueScope;
  currentQuestion: Question | null;
  questionNumber: number;
  score: number;
  correctAnswers: number;
  totalAnswered: number;
  jokers: JokerState[];
  timeRemaining: number;
  isGameOver: boolean;
  result: GameResult | null;
  safePointReached: number;
  xpEarned: number;
  coinsEarned: number;
}

// ---------- API Types ----------

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ---------- Component Prop Types ----------

export interface LevelInfo {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  progress: number; // 0-1
}

export interface TimerState {
  timeRemaining: number;
  totalTime: number;
  isRunning: boolean;
  isExpired: boolean;
  progress: number; // 0-1
}
