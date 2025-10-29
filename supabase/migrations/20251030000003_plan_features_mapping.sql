-- Plan Features Mapping
-- Assigns features to subscription plans and creates feature access rules

-- 1. Create plan_features junction table
CREATE TABLE IF NOT EXISTS plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  feature_category TEXT, -- 'research', 'content', 'technical', 'competitive', 'advanced', 'reporting'
  credit_cost DECIMAL(10,2) DEFAULT 0,
  is_included BOOLEAN DEFAULT true, -- true = included in plan, false = available as add-on
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, feature_key)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_plan_features_plan_id ON plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_features_feature_key ON plan_features(feature_key);
CREATE INDEX IF NOT EXISTS idx_plan_features_category ON plan_features(feature_category);

-- 2. Insert Starter Plan Features
DO $$
DECLARE
  starter_plan_id UUID;
BEGIN
  -- Get Starter plan ID
  SELECT id INTO starter_plan_id FROM subscription_plans WHERE name = 'Starter' LIMIT 1;
  
  IF starter_plan_id IS NOT NULL THEN
    INSERT INTO plan_features (plan_id, feature_key, feature_name, feature_category, credit_cost, is_included) VALUES
    -- Research
    (starter_plan_id, 'keyword_research', 'Keyword Research', 'research', 1, true),
    (starter_plan_id, 'keyword_autocomplete', 'Keyword Autocomplete', 'research', 1, true),
    (starter_plan_id, 'keyword_clustering', 'Keyword Clustering', 'research', 5, true),
    (starter_plan_id, 'answer_the_public', 'Answer The Public', 'research', 2, true),
    (starter_plan_id, 'paa_extractor', 'People Also Ask Extractor', 'research', 1, true),
    (starter_plan_id, 'serp_analysis', 'SERP Analysis', 'research', 2, true),
    (starter_plan_id, 'rank_tracking', 'Rank Tracking', 'research', 0.1, true),
    -- Content
    (starter_plan_id, 'content_repurpose', 'Content Repurposing', 'content', 5, true),
    (starter_plan_id, 'meta_description_generator', 'Meta Description Generator', 'content', 1, true),
    -- Technical
    (starter_plan_id, 'technical_audit', 'Technical SEO Audit', 'technical', 10, true),
    (starter_plan_id, 'site_crawl', 'Site Crawler', 'technical', 0.1, true),
    (starter_plan_id, 'cwv_check', 'Core Web Vitals Checker', 'technical', 1, true),
    (starter_plan_id, 'schema_validation', 'Schema Validator', 'technical', 0.5, true),
    -- Advanced
    (starter_plan_id, 'ai_overview_check', 'AI Overview Checker', 'advanced', 2, true)
    ON CONFLICT (plan_id, feature_key) DO UPDATE SET
      feature_name = EXCLUDED.feature_name,
      feature_category = EXCLUDED.feature_category,
      credit_cost = EXCLUDED.credit_cost,
      updated_at = NOW();
  END IF;
END $$;

-- 3. Insert Pro Plan Features (includes all Starter + Pro-only)
DO $$
DECLARE
  pro_plan_id UUID;
BEGIN
  SELECT id INTO pro_plan_id FROM subscription_plans WHERE name IN ('Pro', 'Professional') LIMIT 1;
  
  IF pro_plan_id IS NOT NULL THEN
    -- Copy all Starter features
    INSERT INTO plan_features (plan_id, feature_key, feature_name, feature_category, credit_cost, is_included)
    SELECT pro_plan_id, feature_key, feature_name, feature_category, credit_cost, is_included
    FROM plan_features
    WHERE plan_id = (SELECT id FROM subscription_plans WHERE name = 'Starter' LIMIT 1)
    ON CONFLICT (plan_id, feature_key) DO NOTHING;

    -- Add Pro-only features
    INSERT INTO plan_features (plan_id, feature_key, feature_name, feature_category, credit_cost, is_included) VALUES
    -- Content
    (pro_plan_id, 'ai_content_brief', 'AI Content Briefs', 'content', 5, true),
    (pro_plan_id, 'chatgpt_optimization', 'ChatGPT Citation Optimization', 'content', 5, true),
    -- Research
    (pro_plan_id, 'serp_similarity', 'SERP Similarity Analysis', 'research', 3, true),
    -- Competitive
    (pro_plan_id, 'competitor_analysis', 'Competitor Analysis', 'competitive', 3, true),
    (pro_plan_id, 'content_gap_analysis', 'Content Gap Analysis', 'competitive', 10, true),
    (pro_plan_id, 'backlink_analysis', 'Backlink Analysis', 'competitive', 3, true),
    (pro_plan_id, 'competitor_monitoring', 'Competitor Monitoring', 'competitive', 1, true),
    -- Advanced
    (pro_plan_id, 'ai_overview_optimization', 'AI Overview Optimization', 'advanced', 5, true),
    (pro_plan_id, 'citation_optimization', 'Citation Optimization', 'advanced', 5, true),
    (pro_plan_id, 'bulk_analyzer', 'Bulk URL Analyzer', 'advanced', 0.5, true),
    (pro_plan_id, 'local_seo_audit', 'Local SEO Audit', 'advanced', 5, true)
    ON CONFLICT (plan_id, feature_key) DO UPDATE SET
      feature_name = EXCLUDED.feature_name,
      feature_category = EXCLUDED.feature_category,
      credit_cost = EXCLUDED.credit_cost,
      updated_at = NOW();
  END IF;
END $$;

-- 4. Insert Agency Plan Features (includes all Pro + Agency-only)
DO $$
DECLARE
  agency_plan_id UUID;
BEGIN
  SELECT id INTO agency_plan_id FROM subscription_plans WHERE name = 'Agency' LIMIT 1;
  
  IF agency_plan_id IS NOT NULL THEN
    -- Copy all Pro features
    INSERT INTO plan_features (plan_id, feature_key, feature_name, feature_category, credit_cost, is_included)
    SELECT agency_plan_id, feature_key, feature_name, feature_category, credit_cost, is_included
    FROM plan_features
    WHERE plan_id = (SELECT id FROM subscription_plans WHERE name IN ('Pro', 'Professional') LIMIT 1)
    ON CONFLICT (plan_id, feature_key) DO NOTHING;

    -- Add Agency-only features
    INSERT INTO plan_features (plan_id, feature_key, feature_name, feature_category, credit_cost, is_included) VALUES
    (agency_plan_id, 'automated_reporting', 'Automated Reports', 'reporting', 3, true),
    (agency_plan_id, 'white_label_reports', 'White-Label Reports', 'reporting', 0, true),
    (agency_plan_id, 'api_access', 'API Access', 'advanced', 0, true)
    ON CONFLICT (plan_id, feature_key) DO UPDATE SET
      feature_name = EXCLUDED.feature_name,
      feature_category = EXCLUDED.feature_category,
      credit_cost = EXCLUDED.credit_cost,
      updated_at = NOW();
  END IF;
END $$;

-- 5. Insert Enterprise Plan Features (all features, unlimited)
DO $$
DECLARE
  enterprise_plan_id UUID;
BEGIN
  SELECT id INTO enterprise_plan_id FROM subscription_plans WHERE name = 'Enterprise' LIMIT 1;
  
  IF enterprise_plan_id IS NOT NULL THEN
    -- Copy all Agency features
    INSERT INTO plan_features (plan_id, feature_key, feature_name, feature_category, credit_cost, is_included)
    SELECT enterprise_plan_id, feature_key, feature_name, feature_category, credit_cost, is_included
    FROM plan_features
    WHERE plan_id = (SELECT id FROM subscription_plans WHERE name = 'Agency' LIMIT 1)
    ON CONFLICT (plan_id, feature_key) DO NOTHING;
  END IF;
END $$;

-- 6. Row Level Security
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plan features" ON plan_features
  FOR SELECT USING (true);

GRANT SELECT ON plan_features TO authenticated, anon;

-- 7. Function to check if user's plan has access to a feature
CREATE OR REPLACE FUNCTION user_has_feature_access(
  p_user_id UUID,
  p_feature_key TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan_id UUID;
  v_feature_exists BOOLEAN;
BEGIN
  -- Get user's subscription plan
  SELECT plan_id INTO v_plan_id
  FROM user_subscriptions
  WHERE user_id = p_user_id
    AND status IN ('active', 'trialing')
    AND (current_period_end IS NULL OR current_period_end > NOW())
  LIMIT 1;

  -- If no subscription, check Free plan
  IF v_plan_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if feature exists in plan
  SELECT EXISTS (
    SELECT 1 FROM plan_features
    WHERE plan_id = v_plan_id
      AND feature_key = p_feature_key
      AND is_included = true
  ) INTO v_feature_exists;

  RETURN v_feature_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute
GRANT EXECUTE ON FUNCTION user_has_feature_access(UUID, TEXT) TO authenticated;

-- 8. Comment
COMMENT ON TABLE plan_features IS 'Maps features to subscription plans. Determines which features are available for each plan.';
COMMENT ON FUNCTION user_has_feature_access(UUID, TEXT) IS 'Checks if a user has access to a specific feature based on their subscription plan.';

