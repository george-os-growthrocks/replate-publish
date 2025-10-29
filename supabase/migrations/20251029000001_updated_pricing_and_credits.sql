-- Updated Pricing & Credit System
-- Updates subscription pricing and adds creator unlimited credits

-- 1. Update Subscription Plans Pricing
UPDATE subscription_plans SET
  price_monthly = 29.00,
  price_yearly = 290.00,
  credits_per_month = 500
WHERE name = 'Starter';

UPDATE subscription_plans SET
  price_monthly = 79.00,
  price_yearly = 790.00,
  credits_per_month = 2000
WHERE name = 'Pro' OR name = 'Professional';

UPDATE subscription_plans SET
  price_monthly = 149.00,
  price_yearly = 1490.00,
  credits_per_month = 5000
WHERE name = 'Agency';

-- Ensure Enterprise exists and is properly configured
INSERT INTO subscription_plans (name, price_monthly, price_yearly, credits_per_month, max_projects, max_team_members, features)
VALUES (
  'Enterprise',
  299.00,
  2990.00,
  999999, -- Effectively unlimited
  999,
  100,
  '["Everything in Agency", "Unlimited Credits", "Unlimited Projects", "Custom Integrations", "Dedicated Account Manager", "SLA Guarantee", "Custom Contracts"]'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  price_monthly = 299.00,
  price_yearly = 2990.00,
  credits_per_month = 999999,
  max_projects = 999,
  max_team_members = 100;

-- 2. Individual Feature Packages Table
CREATE TABLE IF NOT EXISTS feature_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,
  feature_name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  stripe_price_id TEXT,
  credits_included INTEGER DEFAULT 0, -- Some packages might include credits
  is_active BOOLEAN DEFAULT true,
  category TEXT, -- 'ai_tools', 'analytics', 'research', 'automation'
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert feature packages
INSERT INTO feature_packages (feature_key, feature_name, description, price_monthly, category, features) VALUES
(
  'answer_the_public_unlimited',
  'Answer The Public Unlimited',
  'Unlimited ATP queries for keyword research and content ideas',
  19.00,
  'research',
  '["Unlimited ATP queries", "Export to CSV", "Bulk processing", "API access"]'::jsonb
),
(
  'ai_content_briefs_unlimited',
  'AI Content Briefs Pro',
  'Unlimited AI-powered content briefs and optimization suggestions',
  29.00,
  'ai_tools',
  '["Unlimited content briefs", "SEO optimization", "Competitor analysis", "Content scoring"]'::jsonb
),
(
  'bulk_analyzer_pro',
  'Bulk Analyzer Pro',
  'Analyze hundreds of URLs simultaneously',
  39.00,
  'analytics',
  '["Bulk URL analysis", "Batch processing", "CSV export", "Advanced filters"]'::jsonb
),
(
  'premium_backlinks',
  'Premium Backlink Analysis',
  'Advanced backlink monitoring and opportunities',
  49.00,
  'analytics',
  '["Unlimited backlink checks", "Competitor backlinks", "Link opportunities", "Toxic link detection"]'::jsonb
),
(
  'ai_chatbot_unlimited',
  'AI SEO Assistant Unlimited',
  'Unlimited AI chatbot conversations for SEO advice',
  25.00,
  'ai_tools',
  '["Unlimited chat messages", "Context memory", "Priority processing", "Custom prompts"]'::jsonb
),
(
  'local_seo_suite',
  'Local SEO Suite',
  'Complete local SEO toolkit for multi-location businesses',
  59.00,
  'research',
  '["Google Maps scraping", "Local rankings", "Review monitoring", "Citation tracking"]'::jsonb
);

-- 3. Credit Packages for One-Time Purchases
CREATE TABLE IF NOT EXISTS credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  credits INTEGER NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist (for existing tables)
ALTER TABLE credit_packages ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;
ALTER TABLE credit_packages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Insert or update credit packages
INSERT INTO credit_packages (name, credits, bonus_credits, price, is_popular) VALUES
('Starter Pack', 100, 0, 10.00, false),
('Growth Pack', 500, 50, 40.00, false),
('Pro Pack', 1000, 150, 70.00, true),
('Scale Pack', 5000, 1000, 300.00, false),
('Enterprise Pack', 10000, 2500, 500.00, false)
ON CONFLICT (name) DO UPDATE SET
  credits = EXCLUDED.credits,
  bonus_credits = EXCLUDED.bonus_credits,
  price = EXCLUDED.price,
  is_popular = EXCLUDED.is_popular,
  updated_at = NOW();

-- 4. Special User Permissions (Creator & VIP)
CREATE TABLE IF NOT EXISTS user_special_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  email TEXT NOT NULL,
  has_unlimited_credits BOOLEAN DEFAULT false,
  has_all_features BOOLEAN DEFAULT false,
  bypass_rate_limits BOOLEAN DEFAULT false,
  permission_level TEXT DEFAULT 'standard', -- 'standard', 'vip', 'admin', 'creator'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_special_permissions_email ON user_special_permissions(email);
CREATE INDEX idx_user_special_permissions_user_id ON user_special_permissions(user_id);

-- 5. Function to check if user has unlimited credits
CREATE OR REPLACE FUNCTION has_unlimited_credits(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_unlimited BOOLEAN := false;
BEGIN
  -- Check special permissions first
  SELECT has_unlimited_credits INTO v_has_unlimited
  FROM user_special_permissions
  WHERE user_id = p_user_id;
  
  IF v_has_unlimited THEN
    RETURN true;
  END IF;
  
  -- Check if user has Enterprise plan
  SELECT EXISTS (
    SELECT 1 FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing')
    AND sp.name = 'Enterprise'
  ) INTO v_has_unlimited;
  
  RETURN v_has_unlimited;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Enhanced credit consumption with unlimited check
CREATE OR REPLACE FUNCTION consume_credits_with_unlimited_check(
  p_user_id UUID,
  p_feature_name TEXT,
  p_credits_amount INTEGER,
  p_project_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_has_unlimited BOOLEAN;
  v_available INTEGER;
  v_total INTEGER;
  v_used INTEGER;
  v_new_used INTEGER;
BEGIN
  -- Check if user has unlimited credits
  v_has_unlimited := has_unlimited_credits(p_user_id);
  
  IF v_has_unlimited THEN
    -- Just log usage but don't deduct
    INSERT INTO credit_usage_log (user_id, project_id, feature, credits_used, metadata)
    VALUES (p_user_id, p_project_id, p_feature_name, p_credits_amount, 
            jsonb_build_object('unlimited_user', true) || p_metadata);
    
    RETURN jsonb_build_object(
      'success', true,
      'unlimited', true,
      'credits_consumed', 0,
      'message', 'Unlimited credits - no deduction'
    );
  END IF;
  
  -- Normal credit consumption for non-unlimited users
  SELECT total_credits, used_credits, available_credits 
  INTO v_total, v_used, v_available
  FROM user_credits
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User credits not found');
  END IF;
  
  IF v_available < p_credits_amount THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Insufficient credits',
      'required', p_credits_amount,
      'available', v_available
    );
  END IF;
  
  v_new_used := v_used + p_credits_amount;
  
  UPDATE user_credits
  SET used_credits = v_new_used,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  INSERT INTO credit_transactions (
    user_id, project_id, transaction_type, feature_name, 
    credits_amount, credits_before, credits_after, metadata
  )
  VALUES (
    p_user_id, p_project_id, 'consumption', p_feature_name, 
    -p_credits_amount, v_available, v_available - p_credits_amount, p_metadata
  );
  
  INSERT INTO credit_usage_log (user_id, project_id, feature, credits_used, metadata)
  VALUES (p_user_id, p_project_id, p_feature_name, p_credits_amount, p_metadata);
  
  RETURN jsonb_build_object(
    'success', true,
    'unlimited', false,
    'credits_consumed', p_credits_amount,
    'credits_before', v_available,
    'credits_after', v_available - p_credits_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to setup creator account with unlimited access
CREATE OR REPLACE FUNCTION setup_creator_account(p_email TEXT)
RETURNS void AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'User with email % not found', p_email;
    RETURN;
  END IF;
  
  -- Add special permissions
  INSERT INTO user_special_permissions (
    user_id, email, has_unlimited_credits, has_all_features, 
    bypass_rate_limits, permission_level, notes
  )
  VALUES (
    v_user_id, p_email, true, true, true, 'creator',
    'Platform creator - unlimited access to all features'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    has_unlimited_credits = true,
    has_all_features = true,
    bypass_rate_limits = true,
    permission_level = 'creator',
    updated_at = NOW();
  
  -- Ensure user has Enterprise plan access
  INSERT INTO user_subscriptions (
    user_id, plan_id, status, billing_cycle, 
    current_period_start, current_period_end
  )
  SELECT 
    v_user_id,
    sp.id,
    'active',
    'yearly',
    NOW(),
    NOW() + INTERVAL '100 years'
  FROM subscription_plans sp
  WHERE sp.name = 'Enterprise'
  ON CONFLICT (user_id) DO UPDATE SET
    status = 'active',
    current_period_end = NOW() + INTERVAL '100 years',
    updated_at = NOW();
  
  -- Set unlimited credits
  INSERT INTO user_credits (user_id, total_credits, used_credits)
  VALUES (v_user_id, 999999999, 0)
  ON CONFLICT (user_id) DO UPDATE SET
    total_credits = 999999999,
    updated_at = NOW();
  
  RAISE NOTICE 'Creator account setup complete for %', p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Execute creator setup for the specified email
SELECT setup_creator_account('kasiotisg@gmail.com');

-- 9. Feature access check with package support
CREATE OR REPLACE FUNCTION check_feature_access(
  p_user_id UUID,
  p_feature_key TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_has_special_access BOOLEAN := false;
  v_has_subscription_access BOOLEAN := false;
  v_has_package_access BOOLEAN := false;
  v_result JSONB;
BEGIN
  -- Check special permissions (creator/admin)
  SELECT has_all_features INTO v_has_special_access
  FROM user_special_permissions
  WHERE user_id = p_user_id;
  
  IF v_has_special_access THEN
    RETURN jsonb_build_object(
      'has_access', true,
      'access_type', 'unlimited',
      'source', 'special_permission'
    );
  END IF;
  
  -- Check subscription plan features
  SELECT EXISTS (
    SELECT 1 FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing')
    AND (
      (p_feature_key LIKE '%ai%' AND sp.has_ai_tools = true) OR
      (p_feature_key LIKE '%api%' AND sp.has_api_access = true) OR
      (p_feature_key LIKE '%team%' AND sp.has_team_features = true) OR
      sp.name IN ('Enterprise', 'Agency')
    )
  ) INTO v_has_subscription_access;
  
  IF v_has_subscription_access THEN
    RETURN jsonb_build_object(
      'has_access', true,
      'access_type', 'subscription',
      'source', 'plan_included'
    );
  END IF;
  
  -- Check individual feature package purchase
  SELECT EXISTS (
    SELECT 1 FROM user_feature_access
    WHERE user_id = p_user_id
    AND feature_key = p_feature_key
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO v_has_package_access;
  
  IF v_has_package_access THEN
    RETURN jsonb_build_object(
      'has_access', true,
      'access_type', 'package',
      'source', 'individual_purchase'
    );
  END IF;
  
  -- No access
  RETURN jsonb_build_object(
    'has_access', false,
    'access_type', 'none',
    'upgrade_options', jsonb_build_array(
      'upgrade_subscription',
      'purchase_feature_package'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. RLS Policies
ALTER TABLE feature_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_special_permissions ENABLE ROW LEVEL SECURITY;

-- Everyone can view active packages
CREATE POLICY "Anyone can view active feature packages" ON feature_packages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active credit packages" ON credit_packages
  FOR SELECT USING (is_active = true);

-- Users can only view their own special permissions
CREATE POLICY "Users can view own special permissions" ON user_special_permissions
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage everything
CREATE POLICY "Service role can manage feature packages" ON feature_packages
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage credit packages" ON credit_packages
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage special permissions" ON user_special_permissions
  FOR ALL USING (auth.role() = 'service_role');

-- Grants
GRANT SELECT ON feature_packages TO authenticated, anon;
GRANT SELECT ON credit_packages TO authenticated, anon;
GRANT SELECT ON user_special_permissions TO authenticated;

-- 11. Create view for user's complete access summary
CREATE OR REPLACE VIEW user_access_summary AS
SELECT 
  u.id as user_id,
  u.email,
  sp.name as plan_name,
  sp.price_monthly,
  sp.credits_per_month,
  uc.total_credits,
  uc.available_credits,
  usp.has_unlimited_credits,
  usp.permission_level,
  us.status as subscription_status,
  us.current_period_end,
  array_agg(DISTINCT ufa.feature_key) FILTER (WHERE ufa.feature_key IS NOT NULL) as purchased_features
FROM auth.users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id
LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
LEFT JOIN user_credits uc ON u.id = uc.user_id
LEFT JOIN user_special_permissions usp ON u.id = usp.user_id
LEFT JOIN user_feature_access ufa ON u.id = ufa.user_id AND ufa.status = 'active'
GROUP BY u.id, u.email, sp.name, sp.price_monthly, sp.credits_per_month,
         uc.total_credits, uc.available_credits, usp.has_unlimited_credits,
         usp.permission_level, us.status, us.current_period_end;

GRANT SELECT ON user_access_summary TO authenticated;
