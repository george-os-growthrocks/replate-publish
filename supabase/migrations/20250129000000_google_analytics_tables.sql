-- Google Analytics 4 Properties Table
CREATE TABLE IF NOT EXISTS public.ga4_properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id TEXT NOT NULL,
    property_name TEXT NOT NULL,
    website_url TEXT,
    industry_category TEXT,
    time_zone TEXT,
    currency_code TEXT,
    is_active BOOLEAN DEFAULT true,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

-- GA4 Reports Cache Table
CREATE TABLE IF NOT EXISTS public.ga4_reports_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id TEXT NOT NULL,
    report_type TEXT NOT NULL, -- 'traffic', 'realtime', 'events', 'pages'
    date_range TEXT NOT NULL, -- 'last7days', 'last30days', 'today'
    report_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ga4_properties_user_id ON public.ga4_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_ga4_properties_property_id ON public.ga4_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_ga4_reports_cache_user_property ON public.ga4_reports_cache(user_id, property_id);
CREATE INDEX IF NOT EXISTS idx_ga4_reports_cache_expires ON public.ga4_reports_cache(expires_at);

-- RLS Policies
ALTER TABLE public.ga4_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga4_reports_cache ENABLE ROW LEVEL SECURITY;

-- Users can only see their own GA4 properties
CREATE POLICY "Users can view own GA4 properties"
    ON public.ga4_properties FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own GA4 properties"
    ON public.ga4_properties FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own GA4 properties"
    ON public.ga4_properties FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own GA4 properties"
    ON public.ga4_properties FOR DELETE
    USING (auth.uid() = user_id);

-- Users can only see their own cached reports
CREATE POLICY "Users can view own GA4 reports cache"
    ON public.ga4_reports_cache FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own GA4 reports cache"
    ON public.ga4_reports_cache FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Function to clean expired cache
CREATE OR REPLACE FUNCTION clean_expired_ga4_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM public.ga4_reports_cache
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE public.ga4_properties IS 'Stores user Google Analytics 4 properties';
COMMENT ON TABLE public.ga4_reports_cache IS 'Caches GA4 report data to reduce API calls';
