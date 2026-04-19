-- ==========================================
-- FutbolBilgi - Initial Database Schema
-- Supabase PostgreSQL Migration
-- ==========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. Lig Scope & Lig Tanımlari
-- ==========================================

CREATE TABLE league_scopes (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leagues (
    code VARCHAR(50) PRIMARY KEY,
    scope_code VARCHAR(20) NOT NULL REFERENCES league_scopes(code) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(50),
    tier SMALLINT DEFAULT 1,
    icon_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0
);

-- ==========================================
-- 2. Kullanici Profilleri (auth.users ile bagli)
-- ==========================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(255),
    avatar_url VARCHAR(500),
    avatar_frame VARCHAR(100) DEFAULT 'default',
    favorite_team VARCHAR(100),
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 100,
    gems INTEGER DEFAULT 0,
    energy INTEGER DEFAULT 5,
    energy_last_refill TIMESTAMPTZ DEFAULT NOW(),
    league_tier VARCHAR(20) DEFAULT 'bronze',
    elo_rating INTEGER DEFAULT 1000,
    streak_days INTEGER DEFAULT 0,
    last_daily_claim DATE,
    total_questions_answered INTEGER DEFAULT 0,
    total_correct_answers INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{"sound_enabled": true, "music_enabled": true, "vibration_enabled": true, "notifications_enabled": true, "language": "tr", "theme": "dark"}'::jsonb,
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. Soru Havuzu
-- ==========================================

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_scope VARCHAR(20) NOT NULL DEFAULT 'turkey' REFERENCES league_scopes(code),
    league VARCHAR(50) NOT NULL REFERENCES leagues(code),
    category VARCHAR(50) NOT NULL,
    sub_category VARCHAR(50),
    difficulty SMALLINT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    season_range VARCHAR(50),
    team_tags TEXT[] DEFAULT '{}',
    era_tag VARCHAR(20),
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- [{"key":"A","text":"..."}, {"key":"B","text":"..."}, ...]
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    media JSONB, -- {"type":"image","url":"...","alt":"..."}
    times_shown INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    avg_answer_time_ms INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    reported_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. Oyun Oturumlari
-- ==========================================

CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mode VARCHAR(30) NOT NULL CHECK (mode IN ('millionaire', 'quick', 'duel', 'daily')),
    league_scope VARCHAR(20) DEFAULT 'turkey' REFERENCES league_scopes(code),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    score INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    jokers_used JSONB DEFAULT '[]'::jsonb,
    safe_point_reached INTEGER DEFAULT 0,
    result VARCHAR(20) CHECK (result IN ('completed', 'failed', 'timeout', 'quit', NULL)),
    xp_earned INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0
);

-- ==========================================
-- 5. Soru Cevap Gecmisi
-- ==========================================

CREATE TABLE question_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id),
    user_answer CHAR(1) CHECK (user_answer IN ('A', 'B', 'C', 'D', NULL)),
    is_correct BOOLEAN NOT NULL,
    answer_time_ms INTEGER,
    joker_used VARCHAR(30),
    question_number SMALLINT,
    answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. Duello Eslesmeleri
-- ==========================================

CREATE TABLE duels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenger_id UUID NOT NULL REFERENCES profiles(id),
    opponent_id UUID REFERENCES profiles(id),
    challenger_score INTEGER DEFAULT 0,
    opponent_score INTEGER DEFAULT 0,
    winner_id UUID REFERENCES profiles(id),
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    league_scope VARCHAR(20) DEFAULT 'turkey' REFERENCES league_scopes(code),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'expired', 'cancelled')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 7. Liderlik Tablolari
-- ==========================================

CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    period VARCHAR(20) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'alltime')),
    league_scope VARCHAR(20) DEFAULT 'turkey' REFERENCES league_scopes(code),
    score BIGINT DEFAULT 0,
    rank INTEGER,
    period_start DATE NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, period, period_start, league_scope)
);

-- ==========================================
-- 8. Magaza Ogeleri
-- ==========================================

CREATE TABLE shop_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_type VARCHAR(30) NOT NULL CHECK (item_type IN ('joker', 'avatar', 'frame', 'energy', 'cosmetic', 'theme', 'joker_pack', 'energy_pack')),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sub_type VARCHAR(50),
    preview_url VARCHAR(500),
    price_coins INTEGER,
    price_gems INTEGER,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    league_scope VARCHAR(20) REFERENCES league_scopes(code),
    is_premium BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 9. Kullanici Envanteri
-- ==========================================

CREATE TABLE user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES shop_items(id),
    quantity INTEGER DEFAULT 1,
    is_equipped BOOLEAN DEFAULT FALSE,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- ==========================================
-- 10. Basarimlar (Achievements)
-- ==========================================

CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    category VARCHAR(50) DEFAULT 'general',
    tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    requirement_type VARCHAR(50) NOT NULL,
    requirement_value INTEGER NOT NULL DEFAULT 1,
    xp_reward INTEGER DEFAULT 0,
    coins_reward INTEGER DEFAULT 0,
    gems_reward INTEGER DEFAULT 0,
    league_scope VARCHAR(20) REFERENCES league_scopes(code),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 11. Kullanici Basarimlari
-- ==========================================

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id),
    progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- ==========================================
-- 12. Arkadaslik Sistemi
-- ==========================================

CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- ==========================================
-- INDEXES
-- ==========================================

-- Questions
CREATE INDEX idx_questions_league_scope ON questions(league_scope);
CREATE INDEX idx_questions_league ON questions(league);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_active ON questions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_questions_team_tags ON questions USING GIN(team_tags);
CREATE INDEX idx_questions_scope_difficulty ON questions(league_scope, difficulty) WHERE is_active = TRUE;

-- Game Sessions
CREATE INDEX idx_game_sessions_user ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_mode ON game_sessions(mode);
CREATE INDEX idx_game_sessions_user_mode ON game_sessions(user_id, mode);
CREATE INDEX idx_game_sessions_started ON game_sessions(started_at DESC);

-- Question Answers
CREATE INDEX idx_question_answers_session ON question_answers(session_id);
CREATE INDEX idx_question_answers_user ON question_answers(user_id);
CREATE INDEX idx_question_answers_question ON question_answers(question_id);

-- Duels
CREATE INDEX idx_duels_challenger ON duels(challenger_id);
CREATE INDEX idx_duels_opponent ON duels(opponent_id);
CREATE INDEX idx_duels_status ON duels(status);

-- Leaderboards
CREATE INDEX idx_leaderboards_period ON leaderboards(period, period_start);
CREATE INDEX idx_leaderboards_score ON leaderboards(score DESC);
CREATE INDEX idx_leaderboards_rank ON leaderboards(period, period_start, rank);

-- Profiles
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_league_tier ON profiles(league_tier);
CREATE INDEX idx_profiles_level ON profiles(level DESC);
CREATE INDEX idx_profiles_elo ON profiles(elo_rating DESC);

-- User Achievements
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

-- Friendships
CREATE INDEX idx_friendships_friend ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_friendships_updated_at
    BEFORE UPDATE ON friendships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::TEXT, 8)),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Questions: everyone can read active questions
CREATE POLICY "Active questions are viewable by everyone"
    ON questions FOR SELECT
    USING (is_active = true);

-- Game Sessions: users can CRUD own sessions
CREATE POLICY "Users can view own game sessions"
    ON game_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own game sessions"
    ON game_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game sessions"
    ON game_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- Question Answers: users can CRUD own answers
CREATE POLICY "Users can view own answers"
    ON question_answers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own answers"
    ON question_answers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Duels: participants can view and update
CREATE POLICY "Duel participants can view"
    ON duels FOR SELECT
    USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

CREATE POLICY "Users can create duels"
    ON duels FOR INSERT
    WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Duel participants can update"
    ON duels FOR UPDATE
    USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- Leaderboards: everyone can read
CREATE POLICY "Leaderboards are viewable by everyone"
    ON leaderboards FOR SELECT
    USING (true);

CREATE POLICY "Users can upsert own leaderboard"
    ON leaderboards FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leaderboard"
    ON leaderboards FOR UPDATE
    USING (auth.uid() = user_id);

-- Shop Items: everyone can read active items
CREATE POLICY "Active shop items are viewable by everyone"
    ON shop_items FOR SELECT
    USING (is_active = true);

-- User Inventory: users can CRUD own inventory
CREATE POLICY "Users can view own inventory"
    ON user_inventory FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory"
    ON user_inventory FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory"
    ON user_inventory FOR UPDATE
    USING (auth.uid() = user_id);

-- Achievements: everyone can read
CREATE POLICY "Achievements are viewable by everyone"
    ON achievements FOR SELECT
    USING (true);

-- User Achievements: users can CRUD own achievements
CREATE POLICY "Users can view own achievements"
    ON user_achievements FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
    ON user_achievements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
    ON user_achievements FOR UPDATE
    USING (auth.uid() = user_id);

-- Friendships: participants can view and manage
CREATE POLICY "Users can view own friendships"
    ON friendships FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships"
    ON friendships FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own friendships"
    ON friendships FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete own friendships"
    ON friendships FOR DELETE
    USING (auth.uid() = user_id);

-- League Scopes & Leagues: everyone can read
CREATE POLICY "League scopes are viewable by everyone"
    ON league_scopes FOR SELECT
    USING (true);

CREATE POLICY "Leagues are viewable by everyone"
    ON leagues FOR SELECT
    USING (true);

-- ==========================================
-- SEED DATA
-- ==========================================

-- League Scopes
INSERT INTO league_scopes (code, name, sort_order) VALUES
    ('turkey', 'Türkiye Ligleri', 1),
    ('europe', 'Avrupa Ligleri', 2),
    ('world', 'Dünya Futbolu', 3);

-- Turkish Leagues
INSERT INTO leagues (code, scope_code, name, country, tier, sort_order) VALUES
    ('super_lig', 'turkey', 'Süper Lig', 'Türkiye', 1, 1),
    ('1_lig', 'turkey', '1. Lig (TFF 1. Lig)', 'Türkiye', 2, 2),
    ('2_lig', 'turkey', '2. Lig (TFF 2. Lig)', 'Türkiye', 3, 3),
    ('3_lig', 'turkey', '3. Lig (TFF 3. Lig)', 'Türkiye', 4, 4),
    ('turkiye_kupasi', 'turkey', 'Türkiye Kupası', 'Türkiye', 1, 5),
    ('super_kupa', 'turkey', 'Süper Kupa', 'Türkiye', 1, 6),
    ('milli_takim', 'turkey', 'Milli Takım', 'Türkiye', 1, 7);

-- Achievements
INSERT INTO achievements (key, name, description, category, tier, requirement_type, requirement_value, xp_reward, coins_reward) VALUES
    -- Oyun Basarimlari
    ('first_game', 'İlk Adım', 'İlk oyununu tamamla', 'game', 'bronze', 'games_played', 1, 50, 25),
    ('ten_games', 'Deneyimli', '10 oyun tamamla', 'game', 'bronze', 'games_played', 10, 100, 50),
    ('fifty_games', 'Veteran', '50 oyun tamamla', 'game', 'silver', 'games_played', 50, 250, 100),
    ('hundred_games', 'Efsane', '100 oyun tamamla', 'game', 'gold', 'games_played', 100, 500, 250),

    -- Dogru Cevap Basarimlari
    ('first_correct', 'Doğru!', 'İlk doğru cevabını ver', 'answer', 'bronze', 'correct_answers', 1, 25, 10),
    ('hundred_correct', 'Bilgi Küpü', '100 doğru cevap ver', 'answer', 'silver', 'correct_answers', 100, 200, 100),
    ('five_hundred_correct', 'Ansiklopedi', '500 doğru cevap ver', 'answer', 'gold', 'correct_answers', 500, 500, 250),
    ('thousand_correct', 'Profesör', '1000 doğru cevap ver', 'answer', 'platinum', 'correct_answers', 1000, 1000, 500),

    -- Milyoner Basarimlari
    ('safe_point_1', 'Güvenli!', 'İlk güvenli noktaya ulaş', 'millionaire', 'bronze', 'safe_point_reached', 1, 100, 50),
    ('safe_point_2', 'İkinci Basamak', 'İkinci güvenli noktaya ulaş', 'millionaire', 'silver', 'safe_point_reached', 2, 250, 100),
    ('millionaire', 'Milyoner!', '1.000.000 puana ulaş', 'millionaire', 'platinum', 'millionaire_completed', 1, 2000, 1000),

    -- Streak Basarimlari
    ('streak_3', 'Başlangıç', '3 gün üst üste oyna', 'streak', 'bronze', 'streak_days', 3, 75, 30),
    ('streak_7', 'Haftalık', '7 gün üst üste oyna', 'streak', 'silver', 'streak_days', 7, 200, 100),
    ('streak_30', 'Aylık', '30 gün üst üste oyna', 'streak', 'gold', 'streak_days', 30, 500, 300),

    -- Duello Basarimlari
    ('first_duel_win', 'İlk Galibiyet', 'İlk düelloyu kazan', 'duel', 'bronze', 'duel_wins', 1, 100, 50),
    ('ten_duel_wins', 'Rakipsiz', '10 düello kazan', 'duel', 'silver', 'duel_wins', 10, 250, 125),

    -- Seviye Basarimlari
    ('level_5', 'Çaylak', 'Seviye 5''e ulaş', 'level', 'bronze', 'level_reached', 5, 100, 50),
    ('level_10', 'Amatör', 'Seviye 10''a ulaş', 'level', 'silver', 'level_reached', 10, 250, 100),
    ('level_25', 'Profesyonel', 'Seviye 25''e ulaş', 'level', 'gold', 'level_reached', 25, 500, 250),
    ('level_50', 'Usta', 'Seviye 50''ye ulaş', 'level', 'platinum', 'level_reached', 50, 1000, 500);

-- Shop Items
INSERT INTO shop_items (item_type, name, description, price_coins, price_gems, rarity) VALUES
    -- Joker Paketleri
    ('joker', '%50 Joker', '2 yanlış şıkkı eler', 50, NULL, 'common'),
    ('joker', 'Seyirci Joker', 'Doğru cevap olasılık dağılımı gösterir', 75, NULL, 'common'),
    ('joker', 'Telefon Joker', 'Doğru cevabı %80 ihtimalle söyler', 100, NULL, 'rare'),
    ('joker', 'Süre Dondur', 'Süreyi 15 saniye durdurur', 60, NULL, 'common'),
    ('joker', 'Pas Geç', 'Soruyu değiştirir', 120, NULL, 'rare'),
    ('joker', 'Çift Cevap', '2 cevap hakkı verir', 80, NULL, 'common'),

    -- Enerji
    ('energy', 'Enerji Paketi (3)', '3 enerji kazanır', 30, NULL, 'common'),
    ('energy', 'Enerji Paketi (5)', 'Tam enerji yeniler', 50, NULL, 'common'),

    -- Avatar Çerçeveleri
    ('frame', 'Altın Çerçeve', 'Altın avatar çerçevesi', NULL, 50, 'rare'),
    ('frame', 'Elmas Çerçeve', 'Elmas avatar çerçevesi', NULL, 100, 'epic'),
    ('frame', 'Efsane Çerçeve', 'Efsanevi avatar çerçevesi', NULL, 200, 'legendary'),

    -- Temalar
    ('theme', 'Gece Stadyumu', 'Varsayılan karanlık tema', 0, NULL, 'common'),
    ('theme', 'Yeşil Saha', 'Yeşil tonlarında tema', NULL, 30, 'common'),
    ('theme', 'Kırmızı Tribün', 'Kırmızı tonlarında tema', NULL, 30, 'common'),
    ('theme', 'Altın Kupa', 'Altın tonlarında premium tema', NULL, 75, 'rare');

-- ==========================================
-- DONE
-- ==========================================
