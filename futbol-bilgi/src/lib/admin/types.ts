export interface QuestionAdmin {
  id: string;
  league_scope: string;
  league: string;
  category: string;
  sub_category: string | null;
  difficulty: number;
  season_range: string | null;
  team_tags: string[];
  era_tag: string | null;
  question_text: string;
  options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string | null;
  media: { type: 'image' | 'video'; url: string; alt?: string } | null;
  times_shown: number;
  times_correct: number;
  avg_answer_time_ms: number;
  is_active: boolean;
  reported_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserAdmin {
  id: string;
  username: string;
  email: string;
  coins: number;
  gems: number;
  energy: number;
  xp: number;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShopItemAdmin {
  id: string;
  item_type: string;
  name: string;
  description: string | null;
  preview_url: string | null;
  price_coins: number | null;
  price_gems: number | null;
  league_scope: string | null;
  is_premium: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AchievementAdmin {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  reward_coins: number;
  reward_gems: number;
  reward_xp: number;
  condition: Record<string, unknown>;
  league_scope: string | null;
  created_at: string;
}
