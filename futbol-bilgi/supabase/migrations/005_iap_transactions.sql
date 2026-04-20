CREATE TABLE IF NOT EXISTS public.iap_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android')),
    product_id VARCHAR(100) NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,
    original_transaction_id VARCHAR(255),
    purchase_token_hash TEXT,
    receipt_hash TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'refunded')),
    amount_cents INTEGER,
    currency VARCHAR(3),
    provider_response JSONB DEFAULT '{}'::jsonb,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(platform, transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_iap_transactions_user_created_at
    ON public.iap_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_iap_transactions_user_product_status
    ON public.iap_transactions(user_id, product_id, status);

CREATE INDEX IF NOT EXISTS idx_iap_transactions_original_transaction_id
    ON public.iap_transactions(original_transaction_id);

CREATE TABLE IF NOT EXISTS public.iap_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android')),
    product_id VARCHAR(100) NOT NULL,
    transaction_id VARCHAR(255),
    purchase_token_hash TEXT,
    receipt_hash TEXT,
    validation_status VARCHAR(20) NOT NULL CHECK (validation_status IN ('pending', 'verified', 'rejected', 'error')),
    validation_response JSONB DEFAULT '{}'::jsonb,
    validated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_iap_receipts_user_validated_at
    ON public.iap_receipts(user_id, validated_at DESC);

CREATE INDEX IF NOT EXISTS idx_iap_receipts_receipt_hash
    ON public.iap_receipts(receipt_hash);

CREATE INDEX IF NOT EXISTS idx_iap_receipts_purchase_token_hash
    ON public.iap_receipts(purchase_token_hash);

ALTER TABLE public.iap_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iap_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own iap transactions" ON public.iap_transactions;
CREATE POLICY "Users can view their own iap transactions"
    ON public.iap_transactions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage iap transactions" ON public.iap_transactions;
CREATE POLICY "System can manage iap transactions"
    ON public.iap_transactions FOR ALL
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can view their own iap receipts" ON public.iap_receipts;
CREATE POLICY "Users can view their own iap receipts"
    ON public.iap_receipts FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage iap receipts" ON public.iap_receipts;
CREATE POLICY "System can manage iap receipts"
    ON public.iap_receipts FOR ALL
    USING (auth.role() = 'service_role');
