-- Enhanced Credit System Migration
-- Adds credit transactions, feature access, and project enhancements

-- 1. Update subscription_plans to include feature flags
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS has_ai_tools BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_api_access BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_team_features BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_white_label BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_unlimited_credits BOOLEAN DEFAULT false;

-- Update existing plans with feature flags
UPDATE subscription_plans SET 
  has_ai_tools = false,
  has_api_access = false,
  has_team_features = false,
  has_white_label = false,
  has_unlimited_credits = false
WHERE name = 'Starter';

UPDATE subscription_plans SET 
  has_ai_tools = true,
  has_api_access = false,
  has_team_features = false,
  has_white_label = true,
  has_unlimited_credits = false
WHERE name = 'Pro';

UPDATE subscription_plans SET 
  has_ai_tools = true,
  has_api_access = true,
  has_team_features = true,
  has_white_label = true,
  has_unlimited_credits = true
WHERE name = 'Agency';

-- 2. Credit Transactions Table (detailed tracking)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  project_id UUID REFERENCES seo_projects,
  transaction_type TEXT NOT NULL, -- 'consumption', 'purchase', 'subscription_renewal', 'refund', 'bonus'
  feature_name TEXT, -- null for purchases/renewals
  credits_amount INTEGER NOT NULL, -- negative for consumption, positive for additions
  credits_before INTEGER NOT NULL,
  credits_after INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- 3. User Feature Access Table (individual tool purchases)
CREATE TABLE IF NOT EXISTS user_feature_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  feature_key TEXT NOT NULL, -- 'answer_the_public_unlimited', 'ai_content_briefs', 'bulk_analyzer', etc.
  feature_name TEXT NOT NULL,
  purchase_type TEXT NOT NULL, -- 'one_time', 'monthly_subscription', 'included_in_plan'
  stripe_price_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'expired', 'canceled'
  expires_at TIMESTAMPTZ,
  purchase_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature_key)
);

CREATE INDEX idx_user_feature_access_user_id ON user_feature_access(user_id);
CREATE INDEX idx_user_feature_access_status ON user_feature_access(status);

-- 4. Enhance seo_projects table
ALTER TABLE seo_projects
ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'organic', -- 'organic', 'local', 'ecommerce', 'enterprise'
ADD COLUMN IF NOT EXISTS credit_budget INTEGER, -- optional per-project credit limit
ADD COLUMN IF NOT EXISTS monthly_keywords_tracked INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS team_member_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- 5. Free Tool Usage Tracking (for rate limiting)
CREATE TABLE IF NOT EXISTS free_tool_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name TEXT NOT NULL,
  ip_address TEXT,
  user_id UUID REFERENCES auth.users,
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE,
  UNIQUE(tool_name, ip_address, date),
  UNIQUE(tool_name, user_id, date)
);

CREATE INDEX idx_free_tool_usage_tool ON free_tool_usage(tool_name);
CREATE INDEX idx_free_tool_usage_date ON free_tool_usage(date);
CREATE INDEX idx_free_tool_usage_ip ON free_tool_usage(ip_address);

-- 6. AI Overview Rankings Table
CREATE TABLE IF NOT EXISTS ai_overview_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES seo_projects NOT NULL,
  keyword TEXT NOT NULL,
  appears_in_aio BOOLEAN DEFAULT false,
  aio_position INTEGER,
  aio_snippet TEXT,
  entities_mentioned JSONB DEFAULT '[]'::jsonb,
  competitors_in_aio TEXT[],
  tracked_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, keyword, tracked_date)
);

CREATE INDEX idx_aio_rankings_project ON ai_overview_rankings(project_id);
CREATE INDEX idx_aio_rankings_keyword ON ai_overview_rankings(keyword);
CREATE INDEX idx_aio_rankings_date ON ai_overview_rankings(tracked_date);

-- 7. ChatGPT Citations Table
CREATE TABLE IF NOT EXISTS chatgpt_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  url TEXT NOT NULL,
  keyword TEXT NOT NULL,
  cited_at TIMESTAMPTZ,
  citation_snippet TEXT,
  citation_context TEXT,
  verified BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chatgpt_citations_user_id ON chatgpt_citations(user_id);
CREATE INDEX idx_chatgpt_citations_url ON chatgpt_citations(url);
CREATE INDEX idx_chatgpt_citations_keyword ON chatgpt_citations(keyword);

-- 8. Answer The Public Queries Cache
CREATE TABLE IF NOT EXISTS atp_queries_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_keyword TEXT NOT NULL UNIQUE,
  questions JSONB NOT NULL DEFAULT '{}'::jsonb,
  prepositions JSONB NOT NULL DEFAULT '{}'::jsonb,
  comparisons JSONB NOT NULL DEFAULT '[]'::jsonb,
  alphabetical JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_queries INTEGER DEFAULT 0,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX idx_atp_cache_keyword ON atp_queries_cache(seed_keyword);
CREATE INDEX idx_atp_cache_expires ON atp_queries_cache(expires_at);

-- 9. Enhanced credit consumption function with transactions
CREATE OR REPLACE FUNCTION consume_credits_with_transaction(
  p_user_id UUID,
  p_feature_name TEXT,
  p_credits_amount INTEGER,
  p_project_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_available INTEGER;
  v_total INTEGER;
  v_used INTEGER;
  v_new_used INTEGER;
  v_result JSONB;
BEGIN
  -- Get current credit state
  SELECT total_credits, used_credits, available_credits 
  INTO v_total, v_used, v_available
  FROM user_credits
  WHERE user_id = p_user_id;
  
  -- Check if user exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User credits not found');
  END IF;
  
  -- Check if enough credits
  IF v_available < p_credits_amount THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Insufficient credits',
      'required', p_credits_amount,
      'available', v_available
    );
  END IF;
  
  -- Calculate new used amount
  v_new_used := v_used + p_credits_amount;
  
  -- Update credits
  UPDATE user_credits
  SET used_credits = v_new_used,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Insert transaction record
  INSERT INTO credit_transactions (
    user_id, 
    project_id, 
    transaction_type, 
    feature_name, 
    credits_amount, 
    credits_before, 
    credits_after,
    metadata
  )
  VALUES (
    p_user_id, 
    p_project_id, 
    'consumption', 
    p_feature_name, 
    -p_credits_amount,
    v_available,
    v_available - p_credits_amount,
    p_metadata
  );
  
  -- Insert into legacy log for backward compatibility
  INSERT INTO credit_usage_log (user_id, project_id, feature, credits_used, metadata)
  VALUES (p_user_id, p_project_id, p_feature_name, p_credits_amount, p_metadata);
  
  RETURN jsonb_build_object(
    'success', true,
    'credits_consumed', p_credits_amount,
    'credits_before', v_available,
    'credits_after', v_available - p_credits_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Add credits function (for purchases)
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_credits_amount INTEGER,
  p_transaction_type TEXT, -- 'purchase', 'subscription_renewal', 'bonus', 'refund'
  p_stripe_payment_intent_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_available INTEGER;
  v_total INTEGER;
  v_used INTEGER;
BEGIN
  -- Get current credit state
  SELECT total_credits, used_credits, available_credits 
  INTO v_total, v_used, v_available
  FROM user_credits
  WHERE user_id = p_user_id;
  
  -- If user doesn't exist, create entry
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, total_credits, used_credits)
    VALUES (p_user_id, p_credits_amount, 0);
    
    v_total := p_credits_amount;
    v_used := 0;
    v_available := p_credits_amount;
  ELSE
    -- Update total credits
    UPDATE user_credits
    SET total_credits = total_credits + p_credits_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    v_total := v_total + p_credits_amount;
    v_available := v_available + p_credits_amount;
  END IF;
  
  -- Insert transaction record
  INSERT INTO credit_transactions (
    user_id, 
    transaction_type, 
    credits_amount, 
    credits_before, 
    credits_after,
    stripe_payment_intent_id,
    metadata
  )
  VALUES (
    p_user_id, 
    p_transaction_type, 
    p_credits_amount,
    v_available - p_credits_amount,
    v_available,
    p_stripe_payment_intent_id,
    p_metadata
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'credits_added', p_credits_amount,
    'total_credits', v_total,
    'available_credits', v_available
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Check feature access function
CREATE OR REPLACE FUNCTION has_feature_access(
  p_user_id UUID,
  p_feature_key TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_access BOOLEAN;
BEGIN
  -- Check if user has active individual feature access
  SELECT EXISTS (
    SELECT 1 FROM user_feature_access
    WHERE user_id = p_user_id
    AND feature_key = p_feature_key
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO v_has_access;
  
  IF v_has_access THEN
    RETURN TRUE;
  END IF;
  
  -- Check if feature is included in user's subscription plan
  -- (This will be expanded based on specific feature mappings)
  SELECT EXISTS (
    SELECT 1 FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing')
    AND (
      (p_feature_key LIKE '%ai%' AND sp.has_ai_tools = true) OR
      (p_feature_key LIKE '%api%' AND sp.has_api_access = true) OR
      (p_feature_key LIKE '%team%' AND sp.has_team_features = true)
    )
  ) INTO v_has_access;
  
  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Row Level Security for new tables
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feature_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_tool_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_overview_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatgpt_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE atp_queries_cache ENABLE ROW LEVEL SECURITY;

-- Policies for credit_transactions
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage credit transactions" ON credit_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for user_feature_access
CREATE POLICY "Users can view own feature access" ON user_feature_access
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage feature access" ON user_feature_access
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for free_tool_usage
CREATE POLICY "Users can view own tool usage" ON free_tool_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage tool usage" ON free_tool_usage
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for ai_overview_rankings
CREATE POLICY "Users can view own project rankings" ON ai_overview_rankings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = ai_overview_rankings.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own project rankings" ON ai_overview_rankings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

-- Policies for chatgpt_citations
CREATE POLICY "Users can view own citations" ON chatgpt_citations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own citations" ON chatgpt_citations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for atp_queries_cache
CREATE POLICY "All authenticated users can read cache" ON atp_queries_cache
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage cache" ON atp_queries_cache
  FOR ALL USING (auth.role() = 'service_role');

-- Grant access
GRANT SELECT ON credit_transactions TO authenticated;
GRANT SELECT ON user_feature_access TO authenticated;
GRANT SELECT ON free_tool_usage TO authenticated;
GRANT SELECT, INSERT ON ai_overview_rankings TO authenticated;
GRANT SELECT, INSERT ON chatgpt_citations TO authenticated;
GRANT SELECT ON atp_queries_cache TO authenticated;

