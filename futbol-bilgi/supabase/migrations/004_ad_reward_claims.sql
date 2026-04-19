CREATE TABLE IF NOT EXISTS public.ad_reward_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reward_type VARCHAR(50) NOT NULL,
    reward_value INTEGER NOT NULL DEFAULT 0,
    claim_date DATE NOT NULL DEFAULT CURRENT_DATE,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_reward_claims_user_date
    ON public.ad_reward_claims(user_id, reward_type, claim_date);

ALTER TABLE public.ad_reward_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own ad reward claims" ON public.ad_reward_claims;
CREATE POLICY "Users can view their own ad reward claims"
    ON public.ad_reward_claims FOR SELECT
    USING (auth.uid() = user_id);
