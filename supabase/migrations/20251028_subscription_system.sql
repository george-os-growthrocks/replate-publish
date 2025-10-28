-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'Starter', 'Pro', 'Agency'
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2) NOT NULL,
  credits_per_month INTEGER NOT NULL,
  max_projects INTEGER NOT NULL,
  max_team_members INTEGER DEFAULT 1,
  features JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  plan_id UUID REFERENCES subscription_plans NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'trialing', -- trialing, active, past_due, canceled, paused
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User Credits Table
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  total_credits INTEGER DEFAULT 0,
  used_credits INTEGER DEFAULT 0,
  available_credits INTEGER GENERATED ALWAYS AS (total_credits - used_credits) STORED,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects Table
CREATE TABLE IF NOT EXISTS seo_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  gsc_property_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, domain)
);

-- Credit Usage Log
CREATE TABLE IF NOT EXISTS credit_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  project_id UUID REFERENCES seo_projects,
  feature TEXT NOT NULL, -- 'keyword_research', 'content_repurpose', 'competitor_analysis', etc.
  credits_used INTEGER NOT NULL DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment History
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL, -- succeeded, pending, failed
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_seo_projects_user_id ON seo_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_log_user_id ON credit_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_log_created_at ON credit_usage_log(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);

-- Insert default plans
INSERT INTO subscription_plans (name, price_monthly, price_yearly, credits_per_month, max_projects, max_team_members, features, stripe_price_id_monthly, stripe_price_id_yearly) VALUES
(
  'Starter',
  69.00,
  690.00, -- 2 months free (69*10 = 690)
  1000,
  3,
  1,
  '["Keyword Research", "Rank Tracking (50 keywords)", "Content Repurpose (50 generations)", "Site Audit (1 site)", "Competitor Analysis (3 competitors)", "Email Support"]'::jsonb,
  'price_starter_monthly',
  'price_starter_yearly'
),
(
  'Pro',
  99.00,
  990.00, -- 2 months free (99*10 = 990)
  3000,
  10,
  3,
  '["Everything in Starter", "Unlimited Keywords", "Content Repurpose (200 generations)", "Site Audit (5 sites)", "Competitor Analysis (10 competitors)", "Backlink Analysis", "Local SEO Suite", "Priority Support", "White-Label Reports"]'::jsonb,
  'price_pro_monthly',
  'price_pro_yearly'
),
(
  'Agency',
  299.00,
  2990.00, -- 2 months free (299*10 = 2990)
  10000,
  50,
  15,
  '["Everything in Pro", "Unlimited Everything", "Site Audit (Unlimited)", "Competitor Analysis (Unlimited)", "Team Collaboration", "Client Management", "Custom Branding", "API Access (50k calls/mo)", "Dedicated Account Manager", "24/7 Priority Support"]'::jsonb,
  'price_agency_monthly',
  'price_agency_yearly'
);

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = p_user_id
    AND status IN ('trialing', 'active')
    AND (trial_end IS NULL OR trial_end > NOW())
    AND (current_period_end IS NULL OR current_period_end > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's available credits
CREATE OR REPLACE FUNCTION get_available_credits(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  SELECT available_credits INTO v_credits
  FROM user_credits
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_credits, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct credits
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_feature TEXT,
  p_credits INTEGER DEFAULT 1,
  p_project_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
DECLARE
  v_available INTEGER;
BEGIN
  -- Get available credits
  SELECT available_credits INTO v_available
  FROM user_credits
  WHERE user_id = p_user_id;
  
  -- Check if enough credits
  IF v_available < p_credits THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credits
  UPDATE user_credits
  SET used_credits = used_credits + p_credits,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log usage
  INSERT INTO credit_usage_log (user_id, project_id, feature, credits_used, metadata)
  VALUES (p_user_id, p_project_id, p_feature, p_credits, p_metadata);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly credits
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void AS $$
BEGIN
  -- Reset credits for active subscriptions based on their plan
  UPDATE user_credits uc
  SET 
    total_credits = sp.credits_per_month,
    used_credits = 0,
    last_reset_at = NOW(),
    updated_at = NOW()
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE uc.user_id = us.user_id
    AND us.status IN ('active', 'trialing')
    AND (us.current_period_end > NOW() OR us.trial_end > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create credits entry when subscription is created
CREATE OR REPLACE FUNCTION create_user_credits_on_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_credits (user_id, total_credits, used_credits)
  SELECT NEW.user_id, sp.credits_per_month, 0
  FROM subscription_plans sp
  WHERE sp.id = NEW.plan_id
  ON CONFLICT (user_id) DO UPDATE
  SET total_credits = EXCLUDED.total_credits,
      last_reset_at = NOW(),
      updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_credits_on_subscription
AFTER INSERT ON user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION create_user_credits_on_subscription();

-- Row Level Security
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Policies for user_subscriptions
CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON user_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for user_credits
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage credits" ON user_credits
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for seo_projects
CREATE POLICY "Users can view own projects" ON seo_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON seo_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON seo_projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON seo_projects
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for credit_usage_log
CREATE POLICY "Users can view own usage log" ON credit_usage_log
  FOR SELECT USING (auth.uid() = user_id);

-- Policies for payment_history
CREATE POLICY "Users can view own payments" ON payment_history
  FOR SELECT USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT SELECT ON subscription_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON seo_projects TO authenticated;
GRANT SELECT ON user_subscriptions TO authenticated;
GRANT SELECT ON user_credits TO authenticated;
GRANT SELECT ON credit_usage_log TO authenticated;
GRANT SELECT ON payment_history TO authenticated;

