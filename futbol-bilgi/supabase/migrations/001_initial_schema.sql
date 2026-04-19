-- ============================================================================
-- FutbolBilgi - Initial Database Schema
-- Türk Futbolu Bilgi Yarışması Oyunu
-- Production-Ready PostgreSQL Migration for Supabase
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. LEAGUE SCOPES (Lig Kapsamları)
-- ============================================================================
CREATE TABLE league_scopes (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE league_scopes IS 'Oyun kapsamları: Türkiye, Avrupa, Dünya';

-- ============================================================================
-- 2. LEAGUES (Ligler)
-- ============================================================================
CREATE TABLE leagues (
    code VARCHAR(50) PRIMARY KEY,
    scope_code VARCHAR(20) NOT NULL REFERENCES league_scopes(code) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(50),
    tier SMALLINT DEFAULT 1,
    icon_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE leagues IS 'Lig tanımları: Süper Lig, 1. Lig, vb.';

-- ============================================================================
-- 3. PROFILES (Kullanıcı Profilleri - auth.users ile bağlı)
-- ============================================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(30) UNIQUE NOT NULL,
    avatar_url VARCHAR(500),
    avatar_frame VARCHAR(100) DEFAULT 'default',
    favorite_team VARCHAR(100),
    level INTEGER DEFAULT 1 CHECK (level >= 1),
    xp INTEGER DEFAULT 0 CHECK (xp >= 0),
    coins INTEGER DEFAULT 500 CHECK (coins >= 0),
    gems INTEGER DEFAULT 0 CHECK (gems >= 0),
    energy INTEGER DEFAULT 5 CHECK (energy >= 0 AND energy <= 5),
    energy_last_refill TIMESTAMPTZ DEFAULT NOW(),
    league_tier VARCHAR(20) DEFAULT 'bronze',
    elo_rating INTEGER DEFAULT 1000 CHECK (elo_rating >= 0),
    streak_days INTEGER DEFAULT 0 CHECK (streak_days >= 0),
    last_daily_claim DATE,
    total_questions_answered INTEGER DEFAULT 0 CHECK (total_questions_answered >= 0),
    total_correct_answers INTEGER DEFAULT 0 CHECK (total_correct_answers >= 0),
    settings JSONB DEFAULT '{}',
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Kullanıcı profil bilgileri ve oyun istatistikleri';
COMMENT ON COLUMN profiles.coins IS 'Başlangıç: 500 coin';

-- ============================================================================
-- 4. QUESTIONS (Sorular)
-- ============================================================================
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_scope VARCHAR(20) NOT NULL REFERENCES league_scopes(code),
    league VARCHAR(50) REFERENCES leagues(code),
    category VARCHAR(50) NOT NULL,
    sub_category VARCHAR(50),
    difficulty SMALLINT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    season_range VARCHAR(20),
    team_tags TEXT[],
    era_tag VARCHAR(30),
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer VARCHAR(10) NOT NULL,
    explanation TEXT,
    media JSONB DEFAULT '{}',
    times_shown INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    avg_answer_time_ms INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    reported_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE questions IS 'Oyun soruları ve istatistikleri';
COMMENT ON COLUMN questions.options IS 'JSON: {"A": "text", "B": "text", "C": "text", "D": "text"}';
COMMENT ON COLUMN questions.correct_answer IS 'A, B, C, veya D';
COMMENT ON COLUMN questions.media IS 'JSON: {"type": "image|video", "url": "...", "thumbnail": "..."}';
COMMENT ON COLUMN questions.team_tags IS 'Takım etiketleri array: ["Galatasaray", "Fenerbahçe"]';

-- ============================================================================
-- 5. GAME SESSIONS (Oyun Oturumları)
-- ============================================================================
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mode VARCHAR(30) NOT NULL,
    league_scope VARCHAR(20) NOT NULL REFERENCES league_scopes(code),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    score INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    jokers_used JSONB DEFAULT '{}',
    safe_point_reached INTEGER DEFAULT 0,
    result VARCHAR(20),
    xp_earned INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE game_sessions IS 'Oyun oturumu kayıtları';
COMMENT ON COLUMN game_sessions.mode IS 'classic, duel, daily_challenge, quick_play, vb.';
COMMENT ON COLUMN game_sessions.jokers_used IS 'JSON: {"fifty_fifty": 1, "audience": 0, "phone": 1}';
COMMENT ON COLUMN game_sessions.result IS 'completed, failed, timeout, quit';

-- ============================================================================
-- 6. QUESTION ANSWERS (Soru Cevapları)
-- ============================================================================
CREATE TABLE question_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_answer VARCHAR(10),
    is_correct BOOLEAN NOT NULL,
    answer_time_ms INTEGER,
    joker_used VARCHAR(30),
    question_number INTEGER NOT NULL,
    answered_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE question_answers IS 'Kullanıcı cevap kayıtları';
COMMENT ON COLUMN question_answers.joker_used IS 'fifty_fifty, audience, phone, time_freeze, skip, double_answer';

-- ============================================================================
-- 7. DUELS (Düellolar)
-- ============================================================================
CREATE TABLE duels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    player2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    winner_id UUID REFERENCES profiles(id),
    questions JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE duels IS 'Oyuncu düelloları';
COMMENT ON COLUMN duels.status IS 'pending, active, completed, cancelled';
COMMENT ON COLUMN duels.questions IS 'JSON array: [{"question_id": "...", "p1_answer": "A", "p2_answer": "B"}]';

-- ============================================================================
-- 8. LEADERBOARDS (Lider Tablosu)
-- ============================================================================
CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    period VARCHAR(20) NOT NULL,
    league_scope VARCHAR(20) NOT NULL REFERENCES league_scopes(code),
    score BIGINT DEFAULT 0,
    rank INTEGER,
    period_start DATE NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, period, period_start, league_scope)
);

COMMENT ON TABLE leaderboards IS 'Periyodik lider tablosu kayıtları';
COMMENT ON COLUMN leaderboards.period IS 'daily, weekly, monthly, all_time';

-- ============================================================================
-- 9. SHOP ITEMS (Mağaza Ürünleri)
-- ============================================================================
CREATE TABLE shop_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_type VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    preview_url VARCHAR(500),
    price_coins INTEGER DEFAULT 0,
    price_gems INTEGER DEFAULT 0,
    league_scope VARCHAR(20) REFERENCES league_scopes(code),
    is_premium BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE shop_items IS 'Satın alınabilir ürünler: temalar, çerçeveler, joker paketleri, vb.';
COMMENT ON COLUMN shop_items.item_type IS 'theme, avatar_frame, joker_pack, energy_pack, cosmetic';

-- ============================================================================
-- 10. USER INVENTORY (Kullanıcı Envanteri)
-- ============================================================================
CREATE TABLE user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    is_equipped BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, item_id)
);

COMMENT ON TABLE user_inventory IS 'Kullanıcının sahip olduğu ürünler';

-- ============================================================================
-- 11. ACHIEVEMENTS (Başarımlar)
-- ============================================================================
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    reward_coins INTEGER DEFAULT 0,
    reward_gems INTEGER DEFAULT 0,
    reward_xp INTEGER DEFAULT 0,
    condition JSONB NOT NULL,
    league_scope VARCHAR(20) REFERENCES league_scopes(code),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE achievements IS 'Başarım tanımları';
COMMENT ON COLUMN achievements.condition IS 'JSON: {"type": "answer_count", "target": 100, ...}';

-- ============================================================================
-- 12. USER ACHIEVEMENTS (Kullanıcı Başarımları)
-- ============================================================================
CREATE TABLE user_achievements (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    unlocked_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, achievement_id)
);

COMMENT ON TABLE user_achievements IS 'Kullanıcı başarım ilerlemeleri';

-- ============================================================================
-- 13. FRIENDSHIPS (Arkadaşlıklar)
-- ============================================================================
CREATE TABLE friendships (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, friend_id),
    CHECK (user_id != friend_id)
);

COMMENT ON TABLE friendships IS 'Kullanıcı arkadaşlık ilişkileri';
COMMENT ON COLUMN friendships.status IS 'pending, accepted, blocked';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- League indexes
CREATE INDEX idx_leagues_scope ON leagues(scope_code);
CREATE INDEX idx_leagues_active ON leagues(is_active);

-- Profile indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_league_tier ON profiles(league_tier);
CREATE INDEX idx_profiles_elo ON profiles(elo_rating DESC);
CREATE INDEX idx_profiles_level ON profiles(level DESC);

-- Question indexes
CREATE INDEX idx_questions_league_scope ON questions(league_scope);
CREATE INDEX idx_questions_league ON questions(league);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_active ON questions(is_active);
CREATE INDEX idx_questions_team_tags ON questions USING GIN(team_tags);
CREATE INDEX idx_questions_scope_difficulty ON questions(league_scope, difficulty) WHERE is_active = TRUE;

-- Game Session indexes
CREATE INDEX idx_sessions_user ON game_sessions(user_id);
CREATE INDEX idx_sessions_mode ON game_sessions(mode);
CREATE INDEX idx_sessions_started ON game_sessions(started_at DESC);
CREATE INDEX idx_sessions_scope ON game_sessions(league_scope);
CREATE INDEX idx_sessions_user_mode ON game_sessions(user_id, mode);
CREATE INDEX idx_sessions_user_started ON game_sessions(user_id, started_at DESC);

-- Question Answer indexes
CREATE INDEX idx_answers_session ON question_answers(session_id);
CREATE INDEX idx_answers_user ON question_answers(user_id);
CREATE INDEX idx_answers_question ON question_answers(question_id);
CREATE INDEX idx_answers_correct ON question_answers(is_correct);
CREATE INDEX idx_answers_session_number ON question_answers(session_id, question_number);

-- Duel indexes
CREATE INDEX idx_duels_player1 ON duels(player1_id);
CREATE INDEX idx_duels_player2 ON duels(player2_id);
CREATE INDEX idx_duels_status ON duels(status);
CREATE INDEX idx_duels_created ON duels(created_at DESC);

-- Leaderboard indexes
CREATE INDEX idx_leaderboards_period ON leaderboards(period, period_start);
CREATE INDEX idx_leaderboards_scope ON leaderboards(league_scope);
CREATE INDEX idx_leaderboards_score ON leaderboards(score DESC);
CREATE INDEX idx_leaderboards_rank ON leaderboards(rank);
CREATE INDEX idx_leaderboards_period_scope_score ON leaderboards(period, league_scope, score DESC);

-- Shop Item indexes
CREATE INDEX idx_shop_items_type ON shop_items(item_type);
CREATE INDEX idx_shop_items_active ON shop_items(is_active);

-- User Inventory indexes
CREATE INDEX idx_inventory_user ON user_inventory(user_id);
CREATE INDEX idx_inventory_equipped ON user_inventory(user_id, is_equipped);

-- Achievement indexes
CREATE INDEX idx_achievements_code ON achievements(code);

-- User Achievement indexes
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked ON user_achievements(unlocked_at DESC);

-- Friendship indexes
CREATE INDEX idx_friendships_user ON friendships(user_id);
CREATE INDEX idx_friendships_friend ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Profil otomatik oluşturma trigger'ı
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Profil güncelleme zamanı trigger'ı
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_question_updated
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE league_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
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

-- League Scopes: Herkes okuyabilir
CREATE POLICY "League scopes are viewable by everyone"
    ON league_scopes FOR SELECT
    USING (true);

-- Leagues: Herkes okuyabilir
CREATE POLICY "Leagues are viewable by everyone"
    ON leagues FOR SELECT
    USING (true);

-- Profiles: Herkes okuyabilir, sadece kendi profilini güncelleyebilir
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Questions: Kimlik doğrulaması yapanlar aktif soruları okuyabilir
CREATE POLICY "Active questions are viewable by authenticated users"
    ON questions FOR SELECT
    USING (auth.role() = 'authenticated' AND is_active = true);

-- Game Sessions: Kullanıcılar sadece kendi oturumlarını yönetebilir
CREATE POLICY "Users can view own sessions"
    ON game_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
    ON game_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
    ON game_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- Question Answers: Kullanıcılar sadece kendi cevaplarını yönetebilir
CREATE POLICY "Users can view own answers"
    ON question_answers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own answers"
    ON question_answers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Duels: Oyuncular kendi düellolarını görebilir
CREATE POLICY "Players can view their duels"
    ON duels FOR SELECT
    USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Players can create duels"
    ON duels FOR INSERT
    WITH CHECK (auth.uid() = player1_id);

CREATE POLICY "Players can update their duels"
    ON duels FOR UPDATE
    USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Leaderboards: Herkes okuyabilir
CREATE POLICY "Leaderboards are viewable by authenticated users"
    ON leaderboards FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "System can manage leaderboards"
    ON leaderboards FOR ALL
    USING (auth.role() = 'service_role');

-- Shop Items: Herkes aktif ürünleri görebilir
CREATE POLICY "Active shop items are viewable by authenticated users"
    ON shop_items FOR SELECT
    USING (auth.role() = 'authenticated' AND is_active = true);

-- User Inventory: Kullanıcılar sadece kendi envanterlerini yönetebilir
CREATE POLICY "Users can view own inventory"
    ON user_inventory FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to own inventory"
    ON user_inventory FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory"
    ON user_inventory FOR UPDATE
    USING (auth.uid() = user_id);

-- Achievements: Herkes okuyabilir
CREATE POLICY "Achievements are viewable by authenticated users"
    ON achievements FOR SELECT
    USING (auth.role() = 'authenticated');

-- User Achievements: Herkes okuyabilir, sadece kendi başarımını güncelleyebilir
CREATE POLICY "User achievements are viewable by authenticated users"
    ON user_achievements FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own achievements"
    ON user_achievements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievement progress"
    ON user_achievements FOR UPDATE
    USING (auth.uid() = user_id);

-- Friendships: Kullanıcılar kendi arkadaşlıklarını yönetebilir
CREATE POLICY "Users can view their friendships"
    ON friendships FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships"
    ON friendships FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their friendships"
    ON friendships FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their friendships"
    ON friendships FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- League Scopes
INSERT INTO league_scopes (code, name, icon_url, is_active, sort_order) VALUES
('turkey', 'Türkiye Ligleri', '/icons/turkey.svg', true, 1),
('europe', 'Avrupa Ligleri', '/icons/europe.svg', false, 2),
('world', 'Dünya Futbolu', '/icons/world.svg', false, 3);

-- Turkish Leagues
INSERT INTO leagues (code, scope_code, name, country, tier, icon_url, is_active, sort_order) VALUES
('super_lig', 'turkey', 'Süper Lig', 'Türkiye', 1, '/icons/leagues/super_lig.svg', true, 1),
('lig_1', 'turkey', '1. Lig', 'Türkiye', 2, '/icons/leagues/lig_1.svg', true, 2),
('lig_2', 'turkey', '2. Lig', 'Türkiye', 3, '/icons/leagues/lig_2.svg', true, 3),
('lig_3', 'turkey', '3. Lig', 'Türkiye', 4, '/icons/leagues/lig_3.svg', true, 4),
('turkiye_kupasi', 'turkey', 'Türkiye Kupası', 'Türkiye', 1, '/icons/leagues/turkiye_kupasi.svg', true, 5),
('super_kupa', 'turkey', 'Süper Kupa', 'Türkiye', 1, '/icons/leagues/super_kupa.svg', true, 6),
('milli_takim', 'turkey', 'A Milli Takım', 'Türkiye', 1, '/icons/leagues/milli_takim.svg', true, 7);

-- Achievements
INSERT INTO achievements (code, name, description, icon_url, reward_coins, reward_gems, reward_xp, condition, league_scope) VALUES
(
    'ilk_adim',
    'İlk Adım',
    'İlk soruyu cevapla',
    '/icons/achievements/first_step.svg',
    50,
    0,
    10,
    '{"type": "answer_count", "target": 1}',
    NULL
),
(
    'mukemmel_10',
    'Mükemmel 10',
    '10 doğru cevap üst üste',
    '/icons/achievements/perfect_10.svg',
    200,
    5,
    100,
    '{"type": "streak_correct", "target": 10}',
    NULL
),
(
    'milyoner',
    'Milyoner',
    '1.000.000 puana ulaş',
    '/icons/achievements/millionaire.svg',
    500,
    10,
    500,
    '{"type": "total_score", "target": 1000000}',
    NULL
),
(
    'bilgi_krali',
    'Bilgi Kralı',
    '1000 doğru cevap ver',
    '/icons/achievements/knowledge_king.svg',
    1000,
    20,
    1000,
    '{"type": "correct_answers", "target": 1000}',
    NULL
),
(
    'streak_ustasi',
    'Streak Ustası',
    '30 gün üst üste giriş yap',
    '/icons/achievements/streak_master.svg',
    0,
    50,
    500,
    '{"type": "daily_streak", "target": 30}',
    NULL
),
(
    'duello_sampiyonu',
    'Düello Şampiyonu',
    '50 düello kazan',
    '/icons/achievements/duel_champion.svg',
    500,
    15,
    750,
    '{"type": "duel_wins", "target": 50}',
    NULL
),
(
    'hiz_seytani',
    'Hız Şeytanı',
    '5 saniyenin altında 10 doğru cevap ver',
    '/icons/achievements/speed_demon.svg',
    300,
    10,
    300,
    '{"type": "fast_answers", "target": 10, "max_time_ms": 5000}',
    NULL
);

-- Shop Items - Themes
INSERT INTO shop_items (item_type, name, description, preview_url, price_coins, price_gems, is_premium, is_active) VALUES
('theme', 'Stadyum Gecesi', 'Varsayılan tema', '/previews/theme_stadium_night.jpg', 0, 0, false, true),
('theme', 'Yeşil Çim', 'Taze çim kokusu', '/previews/theme_green_grass.jpg', 5000, 0, false, true),
('theme', 'Altın Kupa', 'Şampiyonlar için', '/previews/theme_golden_cup.jpg', 10000, 0, false, true),
('theme', 'Retro', 'Nostaljik futbol', '/previews/theme_retro.jpg', 15000, 0, false, true);

-- Shop Items - Avatar Frames
INSERT INTO shop_items (item_type, name, description, preview_url, price_coins, price_gems, league_scope, is_premium, is_active) VALUES
('avatar_frame', 'Bronz Çerçeve', 'Bronz lig çerçevesi', '/previews/frame_bronze.png', 0, 0, 'turkey', false, true),
('avatar_frame', 'Gümüş Çerçeve', 'Gümüş lig çerçevesi', '/previews/frame_silver.png', 5000, 0, 'turkey', false, true),
('avatar_frame', 'Altın Çerçeve', 'Altın lig çerçevesi', '/previews/frame_gold.png', 10000, 0, 'turkey', false, true),
('avatar_frame', 'Platin Çerçeve', 'Platin lig çerçevesi', '/previews/frame_platinum.png', 20000, 0, 'turkey', false, true),
('avatar_frame', 'Elmas Çerçeve', 'Elmas lig çerçevesi', '/previews/frame_diamond.png', 0, 50, 'turkey', true, true),
('avatar_frame', 'Şampiyon Çerçeve', 'Şampiyon lig çerçevesi', '/previews/frame_champion.png', 0, 100, 'turkey', true, true);

-- Shop Items - Joker Packs
INSERT INTO shop_items (item_type, name, description, preview_url, price_coins, price_gems, is_premium, is_active) VALUES
('joker_pack', 'Joker Paketi (3)', '3 adet joker hakkı', '/previews/joker_pack_3.png', 1000, 0, false, true),
('joker_pack', 'Joker Paketi (10)', '10 adet joker hakkı', '/previews/joker_pack_10.png', 3000, 0, false, true),
('joker_pack', 'Mega Joker Paketi', '25 adet joker hakkı', '/previews/joker_pack_25.png', 0, 10, true, true);

-- Shop Items - Energy Packs
INSERT INTO shop_items (item_type, name, description, preview_url, price_coins, price_gems, is_premium, is_active) VALUES
('energy_pack', 'Enerji Doldur', 'Enerjini hemen doldur', '/previews/energy_refill.png', 500, 0, false, true),
('energy_pack', 'Sınırsız Enerji (1 Gün)', '24 saat sınırsız enerji', '/previews/energy_unlimited_1d.png', 0, 20, true, true),
('energy_pack', 'Sınırsız Enerji (7 Gün)', '7 gün sınırsız enerji', '/previews/energy_unlimited_7d.png', 0, 100, true, true);

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Kullanıcı istatistiklerini güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_user_stats(
    p_user_id UUID,
    p_xp_gain INTEGER DEFAULT 0,
    p_coins_gain INTEGER DEFAULT 0,
    p_questions_answered INTEGER DEFAULT 0,
    p_correct_answers INTEGER DEFAULT 0
)
RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET
        xp = xp + p_xp_gain,
        coins = coins + p_coins_gain,
        total_questions_answered = total_questions_answered + p_questions_answered,
        total_correct_answers = total_correct_answers + p_correct_answers,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_user_stats IS 'Oyun sonrası kullanıcı istatistiklerini günceller';

-- Soru istatistiklerini güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_question_stats(
    p_question_id UUID,
    p_is_correct BOOLEAN,
    p_answer_time_ms INTEGER
)
RETURNS void AS $$
BEGIN
    UPDATE questions
    SET
        times_shown = times_shown + 1,
        times_correct = times_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
        avg_answer_time_ms = CASE
            WHEN avg_answer_time_ms IS NULL THEN p_answer_time_ms
            ELSE (avg_answer_time_ms * times_shown + p_answer_time_ms) / (times_shown + 1)
        END,
        updated_at = NOW()
    WHERE id = p_question_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_question_stats IS 'Soru istatistiklerini günceller (gösterilme, doğru cevap, ortalama süre)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON SCHEMA public IS 'FutbolBilgi - Türk Futbolu Bilgi Yarışması v1.0';
