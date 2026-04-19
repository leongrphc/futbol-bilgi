-- ============================================================================
-- League Seasons & Entries Migration (Clean Rewrite)
-- ============================================================================

-- ==========================================================================
-- TABLES
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.league_seasons (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.league_season_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    season_id VARCHAR(50) NOT NULL REFERENCES public.league_seasons(id) ON DELETE CASCADE,
    tier_at_start VARCHAR(20) NOT NULL,
    season_score INTEGER DEFAULT 0 CHECK (season_score >= 0),
    wins INTEGER DEFAULT 0 CHECK (wins >= 0),
    draws INTEGER DEFAULT 0 CHECK (draws >= 0),
    losses INTEGER DEFAULT 0 CHECK (losses >= 0),
    final_rank INTEGER,
    movement VARCHAR(20) DEFAULT 'stayed' CHECK (movement IN ('promoted', 'relegated', 'stayed')),
    reward_coins INTEGER DEFAULT 0,
    reward_gems INTEGER DEFAULT 0,
    reward_theme_key VARCHAR(100),
    reward_badge_key VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, season_id)
);

COMMENT ON TABLE public.league_seasons IS 'Lig sezonları - haftalık döngüler';
COMMENT ON COLUMN public.league_seasons.status IS 'pending: başlamadı, active: devam ediyor, completed: bitti';

COMMENT ON TABLE public.league_season_entries IS 'Kullanıcıların sezon performans kayıtları';
COMMENT ON COLUMN public.league_season_entries.tier_at_start IS 'Sezon başındaki lig seviyesi: bronze, silver, gold, platinum, diamond, champion';
COMMENT ON COLUMN public.league_season_entries.season_score IS 'Sezon puanı: galibiyet=3, beraberlik=1, mağlubiyet=0';
COMMENT ON COLUMN public.league_season_entries.movement IS 'Sezon sonu hareketi: promoted (yükseldi), relegated (düştü), stayed (kaldı)';

-- ==========================================================================
-- INDEXES
-- ==========================================================================
CREATE INDEX IF NOT EXISTS idx_league_seasons_status ON public.league_seasons(status);
CREATE INDEX IF NOT EXISTS idx_league_seasons_dates ON public.league_seasons(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_league_entries_user ON public.league_season_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_league_entries_season ON public.league_season_entries(season_id);
CREATE INDEX IF NOT EXISTS idx_league_entries_tier ON public.league_season_entries(tier_at_start);
CREATE INDEX IF NOT EXISTS idx_league_entries_score ON public.league_season_entries(season_id, tier_at_start, season_score DESC);

-- ==========================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================================================
ALTER TABLE public.league_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_season_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view league seasons" ON public.league_seasons;
CREATE POLICY "Anyone can view league seasons"
    ON public.league_seasons FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Anyone can view league entries" ON public.league_season_entries;
CREATE POLICY "Anyone can view league entries"
    ON public.league_season_entries FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can create their own entries" ON public.league_season_entries;
CREATE POLICY "Users can create their own entries"
    ON public.league_season_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own entries" ON public.league_season_entries;
CREATE POLICY "Users can update their own entries"
    ON public.league_season_entries FOR UPDATE
    USING (auth.uid() = user_id);

-- ==========================================================================
-- FUNCTIONS
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.get_current_season()
RETURNS TABLE (
    id VARCHAR(50),
    name VARCHAR(100),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    status VARCHAR(20),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $season$
BEGIN
    RETURN QUERY
    SELECT s.id, s.name, s.starts_at, s.ends_at, s.status, s.created_at, s.updated_at
    FROM public.league_seasons s
    WHERE s.status = 'active'
      AND s.starts_at <= NOW()
      AND s.ends_at > NOW()
    ORDER BY s.starts_at DESC
    LIMIT 1;
END;
$season$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.get_user_season_entry(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    season_id VARCHAR(50),
    tier_at_start VARCHAR(20),
    season_score INTEGER,
    wins INTEGER,
    draws INTEGER,
    losses INTEGER,
    final_rank INTEGER,
    movement VARCHAR(20),
    reward_coins INTEGER,
    reward_gems INTEGER,
    reward_theme_key VARCHAR(100),
    reward_badge_key VARCHAR(100),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $entry$
BEGIN
    RETURN QUERY
    SELECT e.*
    FROM public.league_season_entries e
    INNER JOIN public.league_seasons s ON e.season_id = s.id
    WHERE e.user_id = p_user_id
      AND s.status = 'active'
    ORDER BY s.starts_at DESC
    LIMIT 1;
END;
$entry$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.record_duel_result(
    p_user_id UUID,
    p_tier VARCHAR(20),
    p_result VARCHAR(10)
)
RETURNS void AS $record$
DECLARE
    v_season_id VARCHAR(50);
    v_score_delta INTEGER;
BEGIN
    SELECT s.id INTO v_season_id
    FROM public.league_seasons s
    WHERE s.status = 'active'
      AND s.starts_at <= NOW()
      AND s.ends_at > NOW()
    ORDER BY s.starts_at DESC
    LIMIT 1;

    IF v_season_id IS NULL THEN
        RAISE EXCEPTION 'No active season found';
    END IF;

    v_score_delta := CASE p_result
        WHEN 'win' THEN 3
        WHEN 'draw' THEN 1
        ELSE 0
    END;

    INSERT INTO public.league_season_entries (
        user_id, season_id, tier_at_start, season_score, wins, draws, losses, updated_at
    ) VALUES (
        p_user_id, v_season_id, p_tier, v_score_delta,
        CASE WHEN p_result = 'win' THEN 1 ELSE 0 END,
        CASE WHEN p_result = 'draw' THEN 1 ELSE 0 END,
        CASE WHEN p_result = 'loss' THEN 1 ELSE 0 END,
        NOW()
    )
    ON CONFLICT (user_id, season_id) DO UPDATE SET
        season_score = public.league_season_entries.season_score + v_score_delta,
        wins = public.league_season_entries.wins + CASE WHEN p_result = 'win' THEN 1 ELSE 0 END,
        draws = public.league_season_entries.draws + CASE WHEN p_result = 'draw' THEN 1 ELSE 0 END,
        losses = public.league_season_entries.losses + CASE WHEN p_result = 'loss' THEN 1 ELSE 0 END,
        updated_at = NOW();
END;
$record$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.finalize_league_season_for_tier(
    p_season_id VARCHAR(50),
    p_tier VARCHAR(20)
)
RETURNS void AS $finalize$
DECLARE
    v_total_players INTEGER;
    v_movement_count INTEGER;
    v_rank INTEGER := 0;
    v_movement VARCHAR(20);
    v_reward_coins INTEGER;
    v_reward_gems INTEGER;
    v_reward_theme_key VARCHAR(100);
    v_reward_badge_key VARCHAR(100);
    v_next_tier VARCHAR(20);
    v_entry RECORD;
BEGIN
    SELECT COUNT(*) INTO v_total_players
    FROM public.league_season_entries
    WHERE season_id = p_season_id
      AND tier_at_start = p_tier;

    IF v_total_players = 0 THEN
        RAISE EXCEPTION 'No league entries found for season % and tier %', p_season_id, p_tier;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.league_season_entries
        WHERE season_id = p_season_id
          AND tier_at_start = p_tier
          AND final_rank IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Season tier already finalized';
    END IF;

    v_movement_count := CAST(FLOOR(v_total_players * 0.2) AS INTEGER);

    FOR v_entry IN
        SELECT id, user_id
        FROM public.league_season_entries
        WHERE season_id = p_season_id
          AND tier_at_start = p_tier
        ORDER BY season_score DESC, wins DESC, updated_at ASC
    LOOP
        v_rank := v_rank + 1;

        v_movement := CASE
            WHEN v_total_players < 5 THEN 'stayed'
            WHEN v_rank <= v_movement_count AND p_tier <> 'champion' THEN 'promoted'
            WHEN v_rank > v_total_players - v_movement_count AND p_tier <> 'bronze' THEN 'relegated'
            ELSE 'stayed'
        END;

        v_reward_coins := CASE p_tier
            WHEN 'champion' THEN 500
            WHEN 'diamond' THEN 350
            WHEN 'gold' THEN 220
            WHEN 'silver' THEN 140
            ELSE 80
        END;

        v_reward_gems := CASE p_tier
            WHEN 'champion' THEN 30
            WHEN 'diamond' THEN 15
            WHEN 'gold' THEN 5
            ELSE 0
        END;

        v_reward_theme_key := CASE p_tier
            WHEN 'champion' THEN 'champion-night'
            WHEN 'diamond' THEN 'diamond-flare'
            WHEN 'gold' THEN 'gold-glow'
            ELSE NULL
        END;

        v_reward_badge_key := CASE p_tier
            WHEN 'champion' THEN 'champion-finalist'
            WHEN 'diamond' THEN 'diamond-climber'
            WHEN 'gold' THEN 'gold-runner'
            WHEN 'silver' THEN 'silver-streak'
            ELSE 'bronze-starter'
        END;

        v_next_tier := CASE
            WHEN v_movement = 'promoted' AND p_tier = 'bronze' THEN 'silver'
            WHEN v_movement = 'promoted' AND p_tier = 'silver' THEN 'gold'
            WHEN v_movement = 'promoted' AND p_tier = 'gold' THEN 'diamond'
            WHEN v_movement = 'promoted' AND p_tier = 'diamond' THEN 'champion'
            WHEN v_movement = 'relegated' AND p_tier = 'champion' THEN 'diamond'
            WHEN v_movement = 'relegated' AND p_tier = 'diamond' THEN 'gold'
            WHEN v_movement = 'relegated' AND p_tier = 'gold' THEN 'silver'
            WHEN v_movement = 'relegated' AND p_tier = 'silver' THEN 'bronze'
            ELSE p_tier
        END;

        UPDATE public.league_season_entries
        SET final_rank = v_rank,
            movement = v_movement,
            reward_coins = v_reward_coins,
            reward_gems = v_reward_gems,
            reward_theme_key = v_reward_theme_key,
            reward_badge_key = v_reward_badge_key,
            updated_at = NOW()
        WHERE id = v_entry.id;

        UPDATE public.profiles
        SET league_tier = v_next_tier,
            coins = coins + v_reward_coins,
            gems = gems + v_reward_gems,
            updated_at = NOW()
        WHERE id = v_entry.user_id;
    END LOOP;
END;
$finalize$ LANGUAGE plpgsql;

-- ==========================================================================
-- SEED DATA - Create initial season
-- ==========================================================================
DO $seed$
DECLARE
    v_season_start TIMESTAMPTZ;
    v_season_end TIMESTAMPTZ;
    v_season_id VARCHAR(50);
BEGIN
    v_season_start := date_trunc('week', NOW());
    v_season_end := v_season_start + INTERVAL '7 days';
    v_season_id := 'season_' || to_char(v_season_start, 'YYYY-MM-DD');

    INSERT INTO public.league_seasons (id, name, starts_at, ends_at, status)
    VALUES (v_season_id, 'Haftalık Lig', v_season_start, v_season_end, 'active')
    ON CONFLICT (id) DO NOTHING;
END $seed$;
