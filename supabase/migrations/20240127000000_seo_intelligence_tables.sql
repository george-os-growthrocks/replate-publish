-- =====================================================
-- SEO Intelligence Features Database Schema
-- =====================================================

-- 1. RANKING TRACKER TABLE
-- Stores historical keyword rankings
CREATE TABLE IF NOT EXISTS keyword_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property TEXT NOT NULL,
  keyword TEXT NOT NULL,
  position DECIMAL(5,2),
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr DECIMAL(5,4) DEFAULT 0,
  url TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast querying (drop first to make idempotent)
DROP INDEX IF EXISTS idx_keyword_rankings_user_property;
DROP INDEX IF EXISTS idx_keyword_rankings_keyword;
DROP INDEX IF EXISTS idx_keyword_rankings_checked_at;

CREATE INDEX idx_keyword_rankings_user_property ON keyword_rankings(user_id, property);
CREATE INDEX idx_keyword_rankings_keyword ON keyword_rankings(keyword);
CREATE INDEX idx_keyword_rankings_checked_at ON keyword_rankings(checked_at);

-- Note: Daily uniqueness (one ranking per keyword per day) is enforced at application level
-- by checking existing rankings before inserting new ones

-- 2. TRACKED KEYWORDS TABLE
-- Stores which keywords users want to track
CREATE TABLE IF NOT EXISTS tracked_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property TEXT NOT NULL,
  keyword TEXT NOT NULL,
  target_position INTEGER,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_tracked_keyword UNIQUE (user_id, property, keyword)
);

DROP INDEX IF EXISTS idx_tracked_keywords_user_property;
DROP INDEX IF EXISTS idx_tracked_keywords_active;
CREATE INDEX idx_tracked_keywords_user_property ON tracked_keywords(user_id, property);
CREATE INDEX idx_tracked_keywords_active ON tracked_keywords(active);

-- 3. GOOGLE ALGORITHM UPDATES TABLE
-- Known Google algorithm updates for impact detection
CREATE TABLE IF NOT EXISTS google_algorithm_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  update_date DATE NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'moderate', 'high', 'severe')),
  category TEXT, -- core, spam, helpful content, product reviews, etc.
  description TEXT,
  impact_areas TEXT[], -- e.g., ['e-commerce', 'blogs', 'affiliate']
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_algorithm_updates_date;
CREATE INDEX idx_algorithm_updates_date ON google_algorithm_updates(update_date);

-- Insert known Google updates (2023-2024)
INSERT INTO google_algorithm_updates (name, update_date, severity, category, description, impact_areas) VALUES
  -- 2025 Updates
  ('October 2025 Core Update', '2025-10-15', 'severe', 'core', 'Major algorithm overhaul focusing on AI-generated content detection and authentic expertise signals', ARRAY['all']),
  ('August 2025 Spam & AI Content Update', '2025-08-20', 'high', 'spam', 'Aggressive targeting of AI-generated spam and low-quality programmatic content', ARRAY['ai-content', 'affiliate', 'thin-content']),
  ('March 2025 Core Update', '2025-03-12', 'high', 'core', 'Broad core update with emphasis on user experience signals and site reliability', ARRAY['all']),
  
  -- 2024 Updates
  ('November 2024 Core Update', '2024-11-11', 'high', 'core', 'Year-end core update targeting content depth and originality', ARRAY['all']),
  ('August 2024 Core Update', '2024-08-15', 'moderate', 'core', 'Mid-year core update with ranking volatility across industries', ARRAY['all']),
  ('June 2024 Spam Update', '2024-06-20', 'high', 'spam', 'Major spam crackdown on link schemes and manipulative content', ARRAY['spam', 'links']),
  ('March 2024 Core Update', '2024-03-05', 'high', 'core', 'Major core algorithm update targeting content quality and user experience', ARRAY['all']),
  
  -- 2023 Updates
  ('November 2023 Core Update', '2023-11-02', 'high', 'core', 'Broad core update focusing on content helpfulness and expertise', ARRAY['all']),
  ('October 2023 Spam Update', '2023-10-04', 'moderate', 'spam', 'Targeted low-quality and spammy content', ARRAY['affiliate', 'thin-content']),
  ('September 2023 Helpful Content Update', '2023-09-14', 'high', 'helpful-content', 'Refined signals for people-first content', ARRAY['blogs', 'how-to', 'reviews']),
  ('August 2023 Core Update', '2023-08-22', 'moderate', 'core', 'Minor core update with ranking fluctuations', ARRAY['all']),
  ('April 2023 Reviews Update', '2023-04-12', 'moderate', 'reviews', 'Improved detection of authentic product reviews', ARRAY['e-commerce', 'affiliate', 'reviews']),
  ('March 2023 Core Update', '2023-03-15', 'high', 'core', 'Major broad core algorithm update', ARRAY['all']),
  ('February 2023 Product Reviews Update', '2023-02-21', 'moderate', 'reviews', 'Enhanced quality signals for product review content', ARRAY['reviews', 'e-commerce'])
ON CONFLICT DO NOTHING;

-- 4. ALGORITHM IMPACT DETECTIONS TABLE
-- Stores detected algorithm impacts for users
CREATE TABLE IF NOT EXISTS algorithm_impacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property TEXT NOT NULL,
  algorithm_update_id UUID REFERENCES google_algorithm_updates(id),
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  avg_position_drop DECIMAL(5,2),
  affected_keywords TEXT[],
  estimated_traffic_loss INTEGER,
  severity TEXT CHECK (severity IN ('low', 'moderate', 'high', 'severe')),
  diagnosis TEXT,
  recovery_actions JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'recovered')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_algorithm_impacts_user_property;
DROP INDEX IF EXISTS idx_algorithm_impacts_detected_at;
CREATE INDEX idx_algorithm_impacts_user_property ON algorithm_impacts(user_id, property);
CREATE INDEX idx_algorithm_impacts_detected_at ON algorithm_impacts(detected_at);

-- 5. NOTIFICATIONS TABLE
-- User notifications for ranking changes, alerts, etc.
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('success', 'warning', 'info', 'ranking_up', 'ranking_down', 'algorithm_impact')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional context data
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_notifications_user;
DROP INDEX IF EXISTS idx_notifications_read;
DROP INDEX IF EXISTS idx_notifications_created_at;
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- 6. SEO INTELLIGENCE INSIGHTS TABLE
-- Stores AI-generated insights and recommendations
CREATE TABLE IF NOT EXISTS seo_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property TEXT NOT NULL,
  insight_type TEXT NOT NULL, -- 'quick_win', 'opportunity', 'recommendation', 'warning'
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  effort TEXT CHECK (effort IN ('low', 'medium', 'high')),
  estimated_impact TEXT, -- e.g., '+500 clicks/mo', '+3 positions'
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed')),
  data JSONB, -- Additional structured data
  expires_at TIMESTAMPTZ, -- Insights can be time-limited
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_seo_insights_user_property;
DROP INDEX IF EXISTS idx_seo_insights_status;
DROP INDEX IF EXISTS idx_seo_insights_expires_at;
CREATE INDEX idx_seo_insights_user_property ON seo_insights(user_id, property);
CREATE INDEX idx_seo_insights_status ON seo_insights(status);
CREATE INDEX idx_seo_insights_expires_at ON seo_insights(expires_at);

-- 7. DAILY RANKINGS SNAPSHOT (for trend analysis)
CREATE TABLE IF NOT EXISTS daily_rankings_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  total_clicks INTEGER,
  total_impressions BIGINT,
  avg_position DECIMAL(5,2),
  avg_ctr DECIMAL(5,4),
  top_keywords JSONB, -- Array of top 10 keywords with metrics
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_daily_snapshot UNIQUE (user_id, property, snapshot_date)
);

DROP INDEX IF EXISTS idx_daily_snapshot_user_property;
DROP INDEX IF EXISTS idx_daily_snapshot_date;
CREATE INDEX idx_daily_snapshot_user_property ON daily_rankings_snapshot(user_id, property);
CREATE INDEX idx_daily_snapshot_date ON daily_rankings_snapshot(snapshot_date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE keyword_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_algorithm_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE algorithm_impacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_rankings_snapshot ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to make idempotent
DROP POLICY IF EXISTS "Users can view their own keyword rankings" ON keyword_rankings;
DROP POLICY IF EXISTS "Users can insert their own keyword rankings" ON keyword_rankings;
DROP POLICY IF EXISTS "Users can manage their tracked keywords" ON tracked_keywords;
DROP POLICY IF EXISTS "Anyone can view algorithm updates" ON google_algorithm_updates;
DROP POLICY IF EXISTS "Users can view their own algorithm impacts" ON algorithm_impacts;
DROP POLICY IF EXISTS "Users can insert their own algorithm impacts" ON algorithm_impacts;
DROP POLICY IF EXISTS "Users can update their own algorithm impacts" ON algorithm_impacts;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own insights" ON seo_insights;
DROP POLICY IF EXISTS "Users can update their own insights" ON seo_insights;
DROP POLICY IF EXISTS "Users can view their own snapshots" ON daily_rankings_snapshot;
DROP POLICY IF EXISTS "Users can insert their own snapshots" ON daily_rankings_snapshot;

-- Policies for keyword_rankings
CREATE POLICY "Users can view their own keyword rankings"
  ON keyword_rankings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own keyword rankings"
  ON keyword_rankings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for tracked_keywords
CREATE POLICY "Users can manage their tracked keywords"
  ON tracked_keywords FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for google_algorithm_updates (read-only for all)
CREATE POLICY "Anyone can view algorithm updates"
  ON google_algorithm_updates FOR SELECT
  TO authenticated
  USING (true);

-- Policies for algorithm_impacts
CREATE POLICY "Users can view their own algorithm impacts"
  ON algorithm_impacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own algorithm impacts"
  ON algorithm_impacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own algorithm impacts"
  ON algorithm_impacts FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for seo_insights
CREATE POLICY "Users can view their own insights"
  ON seo_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights"
  ON seo_insights FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for daily_rankings_snapshot
CREATE POLICY "Users can view their own snapshots"
  ON daily_rankings_snapshot FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own snapshots"
  ON daily_rankings_snapshot FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to detect algorithm impacts
CREATE OR REPLACE FUNCTION detect_algorithm_impacts(
  p_user_id UUID,
  p_property TEXT,
  p_date_range_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  algorithm_name TEXT,
  update_date DATE,
  severity TEXT,
  avg_drop DECIMAL,
  affected_keywords TEXT[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH date_range AS (
    SELECT 
      (CURRENT_DATE - p_date_range_days)::date as start_date,
      CURRENT_DATE as end_date
  ),
  algorithm_dates AS (
    SELECT 
      id,
      name,
      update_date,
      google_algorithm_updates.severity
    FROM google_algorithm_updates, date_range
    WHERE update_date BETWEEN start_date AND end_date
  ),
  ranking_changes AS (
    SELECT 
      kr.keyword,
      kr.checked_at::date as check_date,
      kr.position,
      LAG(kr.position) OVER (PARTITION BY kr.keyword ORDER BY kr.checked_at) as prev_position
    FROM keyword_rankings kr
    WHERE kr.user_id = p_user_id
      AND kr.property = p_property
  )
  SELECT 
    ad.name as algorithm_name,
    ad.update_date,
    ad.severity,
    AVG(rc.position - rc.prev_position) as avg_drop,
    ARRAY_AGG(DISTINCT rc.keyword) FILTER (WHERE rc.position - rc.prev_position > 5) as affected_keywords
  FROM algorithm_dates ad
  LEFT JOIN ranking_changes rc ON rc.check_date BETWEEN ad.update_date AND (ad.update_date + 7)
  WHERE rc.position - rc.prev_position > 3 -- Significant drop
  GROUP BY ad.name, ad.update_date, ad.severity
  HAVING COUNT(*) >= 3 -- At least 3 keywords affected
  ORDER BY ad.update_date DESC;
END;
$$;

COMMENT ON TABLE keyword_rankings IS 'Historical keyword position tracking';
COMMENT ON TABLE tracked_keywords IS 'Keywords users want to monitor';
COMMENT ON TABLE google_algorithm_updates IS 'Known Google algorithm updates for impact detection';
COMMENT ON TABLE algorithm_impacts IS 'Detected algorithm impacts on user sites';
COMMENT ON TABLE notifications IS 'User notifications for SEO events';
COMMENT ON TABLE seo_insights IS 'AI-generated SEO recommendations';
COMMENT ON TABLE daily_rankings_snapshot IS 'Daily performance snapshots for trend analysis';

