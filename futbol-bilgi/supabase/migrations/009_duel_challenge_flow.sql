ALTER TABLE duel_invites
ADD COLUMN IF NOT EXISTS question_ids JSONB,
ADD COLUMN IF NOT EXISTS from_user_score INTEGER,
ADD COLUMN IF NOT EXISTS to_user_score INTEGER,
ADD COLUMN IF NOT EXISTS from_user_correct_answers INTEGER,
ADD COLUMN IF NOT EXISTS to_user_correct_answers INTEGER,
ADD COLUMN IF NOT EXISTS from_user_answer_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS to_user_answer_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS from_user_played_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS to_user_played_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS from_user_session_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS to_user_session_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS winner_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

ALTER TABLE duel_invites
DROP CONSTRAINT IF EXISTS duel_invites_status_check;

ALTER TABLE duel_invites
ADD CONSTRAINT duel_invites_status_check
CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed'));
