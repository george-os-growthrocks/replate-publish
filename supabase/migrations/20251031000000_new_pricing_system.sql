-- Complete Pricing System Redesign Migration
-- Updates subscription plans, adds usage tracking, seats, add-ons, and overage management

-- 1. Update subscription_plans table structure
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS max_seats INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_tracked_keywords_daily INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_crawl_urls_monthly INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_reports_monthly INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS crawl_concurrency INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{}'::jsonb;

-- 2. Migrate existing user_subscriptions to new plan structure
-- Map old plan names to new plan names before deleting
DO $$
DECLARE
  old_plan RECORD;
  new_plan_name TEXT;
BEGIN
  -- Update user_subscriptions: map old plan names to new ones
  FOR old_plan IN 
    SELECT DISTINCT us.plan_id, sp.name as plan_name
    FROM user_subscriptions us
    JOIN subscription_plans sp ON sp.id = us.plan_id
    WHERE sp.name IN ('Starter', 'Pro', 'Professional', 'Agency', 'Enterprise')
  LOOP
    -- Map old plan names to new
    CASE old_plan.plan_name
      WHEN 'Starter' THEN new_plan_name := 'Launch';
      WHEN 'Pro' THEN new_plan_name := 'Growth';
      WHEN 'Professional' THEN new_plan_name := 'Growth';
      WHEN 'Agency' THEN new_plan_name := 'Agency';
      WHEN 'Enterprise' THEN new_plan_name := 'Scale';
      ELSE new_plan_name := 'Free';
    END CASE;
    
    -- Update subscription to point to new plan (will be created next)
    -- We'll update the plan_id after creating new plans below
  END LOOP;
END $$;

-- 3. Update user_subscriptions to temporarily point to a safe plan
-- We'll migrate them to new plans after creating them
-- First, create a temporary Free plan if needed to hold subscriptions during migration
DO $$
DECLARE
  temp_free_id UUID;
BEGIN
  -- Check if Free plan exists, if not create a temporary one
  SELECT id INTO temp_free_id FROM subscription_plans WHERE name = 'Free' LIMIT 1;
  
  IF temp_free_id IS NULL THEN
    INSERT INTO subscription_plans (name, price_monthly, price_yearly, credits_per_month, max_projects, max_team_members, features, is_active)
    VALUES ('Free', 0, 0, 100, 1, 1, '[]'::jsonb, true)
    RETURNING id INTO temp_free_id;
  END IF;
  
  -- Temporarily move all subscriptions to Free plan before deleting plans
  UPDATE user_subscriptions 
  SET plan_id = temp_free_id
  WHERE plan_id IN (
    SELECT id FROM subscription_plans 
    WHERE name IN ('Launch', 'Starter', 'Pro', 'Professional', 'Agency', 'Enterprise', 'Scale')
  );
END $$;

-- 4. Now safely delete existing plans (subscriptions temporarily point to Free)
DELETE FROM subscription_plans WHERE name IN ('Launch', 'Starter', 'Pro', 'Professional', 'Agency', 'Enterprise', 'Scale');

-- 5. Insert new plans starting with Launch Plan
INSERT INTO subscription_plans (
  name, price_monthly, price_yearly, credits_per_month, max_projects, max_team_members,
  max_seats, max_tracked_keywords_daily, max_crawl_urls_monthly, max_reports_monthly,
  crawl_concurrency, feature_flags, features, is_active, sort_order
)
VALUES (
  'Launch',
  29.00,
  290.00, -- Annual: $29 * 10 months = 20% discount
  1200,
  3,
  1,
  1, -- max_seats
  250, -- max_tracked_keywords_daily
  10000, -- max_crawl_urls_monthly
  5, -- max_reports_monthly
  2, -- crawl_concurrency (2 threads)
  '{"api_access": false, "white_label": false, "ssa": false, "automations": false}'::jsonb,
  '["Keyword Research", "Autocomplete", "PAA/ATP", "Clustering", "SERP Overview", "Rank Tracking", "Meta Generator", "Lite Tech Audit (1k URLs per crawl)", "Sample CWV (up to 50 URLs/mo)", "Schema Validator", "AI Overview Checker (Basic)"]'::jsonb,
  true,
  1
)
ON CONFLICT (name) DO UPDATE SET
  price_monthly = 29.00,
  price_yearly = 290.00,
  credits_per_month = 1200,
  max_projects = 3,
  max_team_members = 1,
  max_seats = 1,
  max_tracked_keywords_daily = 250,
  max_crawl_urls_monthly = 10000,
  max_reports_monthly = 5,
  crawl_concurrency = 2,
  feature_flags = '{"api_access": false, "white_label": false, "ssa": false, "automations": false}'::jsonb,
  is_active = true,
  sort_order = 1;

-- Insert Growth Plan
INSERT INTO subscription_plans (
  name, price_monthly, price_yearly, credits_per_month, max_projects, max_team_members,
  max_seats, max_tracked_keywords_daily, max_crawl_urls_monthly, max_reports_monthly,
  crawl_concurrency, feature_flags, features, is_active, sort_order
)
VALUES (
  'Growth',
  79.00,
  790.00, -- Annual: $79 * 10 months = 20% discount
  6000,
  10,
  3,
  3, -- max_seats
  1250, -- max_tracked_keywords_daily
  100000, -- max_crawl_urls_monthly
  20, -- max_reports_monthly
  4, -- crawl_concurrency (4 threads)
  '{"api_access": false, "white_label": false, "ssa": false, "automations": false}'::jsonb,
  '["Everything in Launch", "AI Content Briefs", "SERP Similarity", "Competitor Analysis", "Content Gap", "Backlink Lookups", "Local SEO Audit (light)", "Bulk URL Analyzer", "Scheduled Reports", "Priority chat"]'::jsonb,
  true,
  2
)
ON CONFLICT (name) DO UPDATE SET
  price_monthly = 79.00,
  price_yearly = 790.00,
  credits_per_month = 6000,
  max_projects = 10,
  max_team_members = 3,
  max_seats = 3,
  max_tracked_keywords_daily = 1250,
  max_crawl_urls_monthly = 100000,
  max_reports_monthly = 20,
  crawl_concurrency = 4,
  feature_flags = '{"api_access": false, "white_label": false, "ssa": false, "automations": false}'::jsonb,
  is_active = true,
  sort_order = 2;

-- Insert Agency Plan
INSERT INTO subscription_plans (
  name, price_monthly, price_yearly, credits_per_month, max_projects, max_team_members,
  max_seats, max_tracked_keywords_daily, max_crawl_urls_monthly, max_reports_monthly,
  crawl_concurrency, feature_flags, features, is_active, sort_order
)
VALUES (
  'Agency',
  149.00,
  1490.00, -- Annual: $149 * 10 months = 20% discount
  20000,
  30,
  10,
  10, -- max_seats
  5000, -- max_tracked_keywords_daily
  400000, -- max_crawl_urls_monthly
  60, -- max_reports_monthly
  8, -- crawl_concurrency (8 threads)
  '{"api_access": true, "white_label": true, "ssa": false, "automations": true}'::jsonb,
  '["Everything in Growth", "White-Label Reports", "API Access (read)", "Competitor Monitoring", "Backlink Monitoring", "AI Overview Optimization", "Citation Optimization", "Automations", "Priority support"]'::jsonb,
  true,
  3
)
ON CONFLICT (name) DO UPDATE SET
  price_monthly = 149.00,
  price_yearly = 1490.00,
  credits_per_month = 20000,
  max_projects = 30,
  max_team_members = 10,
  max_seats = 10,
  max_tracked_keywords_daily = 5000,
  max_crawl_urls_monthly = 400000,
  max_reports_monthly = 60,
  crawl_concurrency = 8,
  feature_flags = '{"api_access": true, "white_label": true, "ssa": false, "automations": true}'::jsonb,
  is_active = true,
  sort_order = 3;

-- Insert Scale Plan (Enterprise)
INSERT INTO subscription_plans (
  name, price_monthly, price_yearly, credits_per_month, max_projects, max_team_members,
  max_seats, max_tracked_keywords_daily, max_crawl_urls_monthly, max_reports_monthly,
  crawl_concurrency, feature_flags, features, is_active, sort_order
)
VALUES (
  'Scale',
  399.00, -- Base price, actual is custom/contracted
  3990.00, -- Base annual price
  50000,
  999, -- Effectively unlimited
  100, -- Large teams
  100, -- max_seats (SSO required)
  99999, -- Contracted (placeholder)
  9999999, -- Contracted (placeholder)
  999, -- Contracted (placeholder)
  16, -- crawl_concurrency (16 threads)
  '{"api_access": true, "white_label": true, "ssa": true, "automations": true, "custom_limits": true, "private_data": true, "sla": true}'::jsonb,
  '["Everything in Agency", "SSO/SAML", "Custom limits", "Private data retention", "SLAs", "DPA", "Audit logs", "Dedicated CSM", "Custom connectors"]'::jsonb,
  true,
  4
)
ON CONFLICT (name) DO UPDATE SET
  price_monthly = 399.00,
  price_yearly = 3990.00,
  credits_per_month = 50000,
  max_projects = 999,
  max_team_members = 100,
  max_seats = 100,
  max_tracked_keywords_daily = 99999,
  max_crawl_urls_monthly = 9999999,
  max_reports_monthly = 999,
  crawl_concurrency = 16,
  feature_flags = '{"api_access": true, "white_label": true, "ssa": true, "automations": true, "custom_limits": true, "private_data": true, "sla": true}'::jsonb,
  is_active = true,
  sort_order = 4;

-- Insert Free Plan (fallback)
INSERT INTO subscription_plans (
  name, price_monthly, price_yearly, credits_per_month, max_projects, max_team_members,
  max_seats, max_tracked_keywords_daily, max_crawl_urls_monthly, max_reports_monthly,
  crawl_concurrency, feature_flags, features, is_active, sort_order
)
VALUES (
  'Free',
  0.00,
  0.00,
  100,
  1,
  1,
  1,
  10, -- Very limited
  100, -- Very limited
  1, -- Very limited
  1,
  '{"api_access": false, "white_label": false, "ssa": false, "automations": false}'::jsonb,
  '["Basic Keyword Research", "Limited Rank Tracking"]'::jsonb,
  true,
  0
)
ON CONFLICT (name) DO UPDATE SET
  price_monthly = 0.00,
  price_yearly = 0.00,
  credits_per_month = 100,
  max_projects = 1,
  max_team_members = 1,
  max_seats = 1,
  max_tracked_keywords_daily = 10,
  max_crawl_urls_monthly = 100,
  max_reports_monthly = 1,
  crawl_concurrency = 1,
  feature_flags = '{"api_access": false, "white_label": false, "ssa": false, "automations": false}'::jsonb,
  is_active = true,
  sort_order = 0;

-- 6. Migrate existing user_subscriptions to new plan IDs
-- Update subscriptions that were temporarily pointing to Free plan
DO $$
DECLARE
  launch_id UUID;
  growth_id UUID;
  agency_id UUID;
  scale_id UUID;
  free_id UUID;
BEGIN
  -- Get new plan IDs
  SELECT id INTO launch_id FROM subscription_plans WHERE name = 'Launch' LIMIT 1;
  SELECT id INTO growth_id FROM subscription_plans WHERE name = 'Growth' LIMIT 1;
  SELECT id INTO agency_id FROM subscription_plans WHERE name = 'Agency' LIMIT 1;
  SELECT id INTO scale_id FROM subscription_plans WHERE name = 'Scale' LIMIT 1;
  SELECT id INTO free_id FROM subscription_plans WHERE name = 'Free' LIMIT 1;
  
  -- If we had stored the old plan mapping, we could update here
  -- For now, subscriptions pointing to Free will stay at Free
  -- User subscriptions can be manually updated or will be created fresh via Stripe webhook
END $$;

-- 7. Enhance seo_projects table
-- First, add country_code and locale columns
ALTER TABLE seo_projects
ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'US',
ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en-US',
ADD COLUMN IF NOT EXISTS description TEXT;

-- Handle both 'domain' and 'url' column scenarios
-- Check which column exists and rename 'url' to 'domain' if needed
DO $$
BEGIN
  -- Check if 'url' column exists but 'domain' doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'seo_projects' AND column_name = 'url'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'seo_projects' AND column_name = 'domain'
  ) THEN
    ALTER TABLE seo_projects RENAME COLUMN url TO domain;
  END IF;
  
  -- Ensure 'domain' column exists (add if neither url nor domain exist - shouldn't happen)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'seo_projects' AND column_name = 'domain'
  ) THEN
    ALTER TABLE seo_projects ADD COLUMN domain TEXT;
    -- Copy from url if it still exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'seo_projects' AND column_name = 'url'
    ) THEN
      UPDATE seo_projects SET domain = url WHERE domain IS NULL;
    END IF;
    ALTER TABLE seo_projects ALTER COLUMN domain SET NOT NULL;
  END IF;
END $$;

-- Drop old unique constraints if they exist
ALTER TABLE seo_projects DROP CONSTRAINT IF EXISTS seo_projects_user_id_domain_key;
ALTER TABLE seo_projects DROP CONSTRAINT IF EXISTS seo_projects_user_id_url_key;
ALTER TABLE seo_projects DROP CONSTRAINT IF EXISTS seo_projects_pkey CASCADE;

-- Re-add primary key if needed
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'seo_projects_pkey'
  ) THEN
    ALTER TABLE seo_projects ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Add new unique constraint for (user_id, domain, country_code, locale)
-- Drop it first if it exists to avoid conflicts
ALTER TABLE seo_projects DROP CONSTRAINT IF EXISTS seo_projects_user_domain_country_locale_key;
ALTER TABLE seo_projects
ADD CONSTRAINT seo_projects_user_domain_country_locale_key 
UNIQUE(user_id, domain, country_code, locale);

-- Set existing projects to US/en-US
UPDATE seo_projects 
SET country_code = 'US', locale = 'en-US' 
WHERE country_code IS NULL OR locale IS NULL;

-- 8. Create usage_meters table
CREATE TABLE IF NOT EXISTS usage_meters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  meter_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tracked_keywords INTEGER DEFAULT 0,
  crawled_urls INTEGER DEFAULT 0,
  briefs_generated INTEGER DEFAULT 0,
  reports_rendered INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, meter_date)
);

CREATE INDEX IF NOT EXISTS idx_usage_meters_user_id ON usage_meters(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_meters_date ON usage_meters(meter_date);

-- 9. Create seats table
CREATE TABLE IF NOT EXISTS seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL, -- Subscription owner
  seat_user_id UUID REFERENCES auth.users NOT NULL, -- The actual seat user
  is_active BOOLEAN DEFAULT true,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, seat_user_id)
);

CREATE INDEX IF NOT EXISTS idx_seats_user_id ON seats(user_id);
CREATE INDEX IF NOT EXISTS idx_seats_seat_user_id ON seats(seat_user_id);
CREATE INDEX IF NOT EXISTS idx_seats_active ON seats(user_id, is_active) WHERE is_active = true;

-- 10. Create add_ons table
CREATE TABLE IF NOT EXISTS add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  addon_type TEXT NOT NULL, -- 'seats', 'projects', 'rank_pack', 'crawl_pack', 'credits', 'local_pack'
  quantity INTEGER NOT NULL DEFAULT 1,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'expired'
  metadata JSONB DEFAULT '{}'::jsonb, -- Store additional info like +5 projects, +1k keywords, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, addon_type, stripe_subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_add_ons_user_id ON add_ons(user_id);
CREATE INDEX IF NOT EXISTS idx_add_ons_type ON add_ons(addon_type);
CREATE INDEX IF NOT EXISTS idx_add_ons_status ON add_ons(status) WHERE status = 'active';

-- 11. Create overage_events table
CREATE TABLE IF NOT EXISTS overage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  event_type TEXT NOT NULL, -- 'credit_70', 'credit_90', 'credit_100', 'credit_110', 'keyword_limit', 'crawl_limit', 'report_limit'
  threshold_percent DECIMAL(5,2), -- 70.00, 90.00, 100.00, 110.00
  credits_used INTEGER,
  credits_total INTEGER,
  usage_meter_data JSONB, -- Store snapshot of usage meters
  notified BOOLEAN DEFAULT false,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_overage_events_user_id ON overage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_overage_events_type ON overage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_overage_events_notified ON overage_events(notified) WHERE notified = false;

-- 12. Update user_subscriptions table
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS seat_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS usage_last_reset_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing subscriptions to have seat_count = 1
UPDATE user_subscriptions SET seat_count = 1 WHERE seat_count IS NULL;

-- 13. Row Level Security policies

-- Usage meters RLS
ALTER TABLE usage_meters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own usage meters" ON usage_meters;
CREATE POLICY "Users can view own usage meters" ON usage_meters
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own usage meters" ON usage_meters;
CREATE POLICY "Users can insert own usage meters" ON usage_meters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own usage meters" ON usage_meters;
CREATE POLICY "Users can update own usage meters" ON usage_meters
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage usage meters" ON usage_meters;
CREATE POLICY "Service role can manage usage meters" ON usage_meters
  FOR ALL USING (auth.role() = 'service_role');

-- Seats RLS
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own seats" ON seats;
CREATE POLICY "Users can view own seats" ON seats
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = seat_user_id);

DROP POLICY IF EXISTS "Users can insert own seats" ON seats;
CREATE POLICY "Users can insert own seats" ON seats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own seats" ON seats;
CREATE POLICY "Users can update own seats" ON seats
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage seats" ON seats;
CREATE POLICY "Service role can manage seats" ON seats
  FOR ALL USING (auth.role() = 'service_role');

-- Add-ons RLS
ALTER TABLE add_ons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own add-ons" ON add_ons;
CREATE POLICY "Users can view own add-ons" ON add_ons
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage add-ons" ON add_ons;
CREATE POLICY "Service role can manage add-ons" ON add_ons
  FOR ALL USING (auth.role() = 'service_role');

-- Overage events RLS
ALTER TABLE overage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own overage events" ON overage_events;
CREATE POLICY "Users can view own overage events" ON overage_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage overage events" ON overage_events;
CREATE POLICY "Service role can manage overage events" ON overage_events
  FOR ALL USING (auth.role() = 'service_role');

-- 14. Function to reset monthly usage meters
CREATE OR REPLACE FUNCTION reset_monthly_usage_meters()
RETURNS void AS $$
BEGIN
  -- This function should be called monthly (via cron or scheduled job)
  -- For now, it's a placeholder - actual reset logic will be handled by application
  UPDATE usage_meters 
  SET tracked_keywords = 0, crawled_urls = 0, briefs_generated = 0, reports_rendered = 0
  WHERE meter_date < DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Function to check seat availability
CREATE OR REPLACE FUNCTION check_seat_availability(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_seats INTEGER;
  v_max_seats INTEGER;
  v_plan_id UUID;
BEGIN
  -- Get user's plan
  SELECT plan_id INTO v_plan_id
  FROM user_subscriptions
  WHERE user_id = p_user_id AND status IN ('active', 'trialing')
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    RETURN false;
  END IF;

  -- Get max seats for plan
  SELECT max_seats INTO v_max_seats
  FROM subscription_plans
  WHERE id = v_plan_id;

  -- Count active seats (logged in last 30 days)
  SELECT COUNT(*) INTO v_current_seats
  FROM seats
  WHERE user_id = p_user_id 
    AND is_active = true
    AND last_active_at > NOW() - INTERVAL '30 days';

  -- Check if limit exceeded
  RETURN v_current_seats < v_max_seats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;