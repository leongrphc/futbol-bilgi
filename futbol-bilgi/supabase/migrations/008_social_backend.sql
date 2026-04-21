ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE friendships
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

ALTER TABLE friendships
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE friendships
SET id = gen_random_uuid()
WHERE id IS NULL;

UPDATE friendships
SET updated_at = created_at
WHERE updated_at IS NULL;

ALTER TABLE friendships
ALTER COLUMN id SET NOT NULL;

ALTER TABLE friendships
ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE friendships
ADD CONSTRAINT friendships_id_unique UNIQUE (id);

DROP TRIGGER IF EXISTS on_friendship_updated ON friendships;
CREATE TRIGGER on_friendship_updated
  BEFORE UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS duel_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  CHECK (from_user_id <> to_user_id),
  CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_duel_invites_to_status_created
  ON duel_invites(to_user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_duel_invites_from_status_created
  ON duel_invites(from_user_id, status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_duel_invites_pending_unique
  ON duel_invites(from_user_id, to_user_id)
  WHERE status = 'pending';

ALTER TABLE duel_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their duel invites" ON duel_invites;
CREATE POLICY "Users can view their duel invites"
  ON duel_invites FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

DROP POLICY IF EXISTS "Users can create duel invites" ON duel_invites;
CREATE POLICY "Users can create duel invites"
  ON duel_invites FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "Recipients can respond to duel invites" ON duel_invites;
CREATE POLICY "Recipients can respond to duel invites"
  ON duel_invites FOR UPDATE
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

DROP TRIGGER IF EXISTS on_duel_invites_updated ON duel_invites;
CREATE TRIGGER on_duel_invites_updated
  BEFORE UPDATE ON duel_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
