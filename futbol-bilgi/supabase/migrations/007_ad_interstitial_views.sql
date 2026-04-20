CREATE TABLE IF NOT EXISTS public.ad_interstitial_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    placement VARCHAR(50) NOT NULL,
    view_date DATE NOT NULL DEFAULT CURRENT_DATE,
    shown_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_interstitial_views_user_date
    ON public.ad_interstitial_views(user_id, placement, view_date);

ALTER TABLE public.ad_interstitial_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own interstitial views" ON public.ad_interstitial_views;
CREATE POLICY "Users can view their own interstitial views"
    ON public.ad_interstitial_views FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage interstitial views" ON public.ad_interstitial_views;
CREATE POLICY "System can manage interstitial views"
    ON public.ad_interstitial_views FOR ALL
    USING (auth.role() = 'service_role');
