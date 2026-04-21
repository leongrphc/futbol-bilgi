CREATE TABLE IF NOT EXISTS live_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  league_scope VARCHAR(20) NOT NULL DEFAULT 'turkey',
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  max_players INTEGER NOT NULL DEFAULT 64,
  current_players INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (status IN ('scheduled', 'live', 'completed'))
);

CREATE TABLE IF NOT EXISTS live_tournament_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES live_tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  round_reached INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tournament_id, user_id)
);

ALTER TABLE live_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_tournament_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Live tournaments are viewable by authenticated users" ON live_tournaments;
CREATE POLICY "Live tournaments are viewable by authenticated users"
  ON live_tournaments FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Live tournament entries are viewable by authenticated users" ON live_tournament_entries;
CREATE POLICY "Live tournament entries are viewable by authenticated users"
  ON live_tournament_entries FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can join tournaments" ON live_tournament_entries;
CREATE POLICY "Users can join tournaments"
  ON live_tournament_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tournament entry" ON live_tournament_entries;
CREATE POLICY "Users can update own tournament entry"
  ON live_tournament_entries FOR UPDATE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS on_live_tournaments_updated ON live_tournaments;
CREATE TRIGGER on_live_tournaments_updated
  BEFORE UPDATE ON live_tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_live_tournament_entries_updated ON live_tournament_entries;
CREATE TRIGGER on_live_tournament_entries_updated
  BEFORE UPDATE ON live_tournament_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

INSERT INTO live_tournaments (title, description, league_scope, status, max_players, current_players, starts_at)
SELECT 'Süper Lig Hız Kupası', 'Türkiye kapsamındaki oyuncular için hafta sonu mini turnuva.', 'turkey', 'live', 64, 0, NOW()
WHERE NOT EXISTS (SELECT 1 FROM live_tournaments WHERE title = 'Süper Lig Hız Kupası');

INSERT INTO live_tournaments (title, description, league_scope, status, max_players, current_players, starts_at)
SELECT 'Avrupa Devleri Kupası', 'Avrupa kapsamındaki sorularla oynanan canlı turnuva serisi.', 'europe', 'scheduled', 64, 0, NOW() + INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM live_tournaments WHERE title = 'Avrupa Devleri Kupası');
