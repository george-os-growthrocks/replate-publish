-- Stripe Billing & Subscription Tables

-- Subscription Plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- 'Starter', 'Professional', 'Agency', 'Enterprise'
    stripe_product_id TEXT UNIQUE,
    stripe_price_id TEXT UNIQUE,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2),
    credits_included INTEGER NOT NULL DEFAULT 0,
    credits_monthly INTEGER NOT NULL DEFAULT 0, -- recurring credits per month
    features JSONB DEFAULT '[]'::jsonb,
    limits JSONB DEFAULT '{}'::jsonb, -- {max_projects: 10, max_keywords: 1000}
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.subscription_plans(id),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'active', -- active, canceled, past_due, incomplete
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    trial_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Payment History
CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_invoice_id TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL, -- succeeded, failed, pending
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Packages (One-time purchases)
CREATE TABLE IF NOT EXISTS public.credit_packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    stripe_price_id TEXT UNIQUE,
    credits INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    bonus_credits INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON public.user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created ON public.payment_history(created_at DESC);

-- RLS Policies
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

-- Anyone can view plans and packages
CREATE POLICY "Plans are viewable by everyone"
    ON public.subscription_plans FOR SELECT
    USING (is_active = true);

CREATE POLICY "Credit packages are viewable by everyone"
    ON public.credit_packages FOR SELECT
    USING (is_active = true);

-- Users can only see their own subscription
CREATE POLICY "Users can view own subscription"
    ON public.user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payment history"
    ON public.payment_history FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can manage everything (for webhooks)
CREATE POLICY "Service role can manage subscriptions"
    ON public.user_subscriptions FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage payments"
    ON public.payment_history FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, price_monthly, price_yearly, credits_included, credits_monthly, features, limits, sort_order) VALUES
('Free', 0, 0, 100, 0, 
    '["5 SEO Tools", "Social Media SEO (Limited)", "100 Credits One-time", "Community Support"]'::jsonb,
    '{"max_projects": 1, "max_keywords": 100, "max_reports": 5}'::jsonb,
    1),
    
('Starter', 29, 290, 500, 500,
    '["All SEO Tools", "Social Media SEO", "SERP Preview", "500 Credits/month", "Email Support"]'::jsonb,
    '{"max_projects": 3, "max_keywords": 500, "max_reports": 50}'::jsonb,
    2),
    
('Professional', 79, 790, 1500, 1500,
    '["Everything in Starter", "GA4 Analytics", "Credit Analytics", "Rank Tracking", "1,500 Credits/month", "Priority Support", "Export Reports"]'::jsonb,
    '{"max_projects": 10, "max_keywords": 2000, "max_reports": 500}'::jsonb,
    3),
    
('Agency', 149, 1490, 3500, 3500,
    '["Everything in Professional", "White-label Reports", "Team Collaboration", "API Access", "3,500 Credits/month", "Dedicated Support"]'::jsonb,
    '{"max_projects": 50, "max_keywords": 10000, "max_reports": -1}'::jsonb,
    4),
    
('Enterprise', 299, 2990, 10000, 10000,
    '["Everything in Agency", "Custom Integration", "SLA", "Custom Limits", "10,000 Credits/month", "White-glove Support", "Training"]'::jsonb,
    '{"max_projects": -1, "max_keywords": -1, "max_reports": -1}'::jsonb,
    5);

-- Insert credit packages
INSERT INTO public.credit_packages (name, credits, price, bonus_credits, sort_order) VALUES
('Starter Pack', 100, 10, 0, 1),
('Growth Pack', 500, 40, 50, 2),
('Pro Pack', 1000, 70, 150, 3),
('Enterprise Pack', 5000, 300, 1000, 4);

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION check_subscription_limit(
    p_user_id UUID,
    p_limit_type TEXT
) RETURNS INTEGER AS $$
DECLARE
    v_limit INTEGER;
BEGIN
    SELECT (limits->>p_limit_type)::INTEGER INTO v_limit
    FROM subscription_plans sp
    JOIN user_subscriptions us ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id
    AND us.status = 'active';
    
    RETURN COALESCE(v_limit, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current plan
CREATE OR REPLACE FUNCTION get_user_plan(p_user_id UUID)
RETURNS TABLE (
    plan_name TEXT,
    credits_monthly INTEGER,
    status TEXT,
    current_period_end TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.name,
        sp.credits_monthly,
        us.status,
        us.current_period_end
    FROM user_subscriptions us
    JOIN subscription_plans sp ON sp.id = us.plan_id
    WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing')
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE public.subscription_plans IS 'Available subscription plans and pricing';
COMMENT ON TABLE public.user_subscriptions IS 'User subscription records linked to Stripe';
COMMENT ON TABLE public.payment_history IS 'All payment transactions';
COMMENT ON TABLE public.credit_packages IS 'One-time credit purchase packages';
