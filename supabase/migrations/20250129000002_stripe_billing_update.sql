-- Updated Stripe Billing Migration (only missing parts)

-- Check if subscription_plans table exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscription_plans') THEN
        CREATE TABLE public.subscription_plans (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            stripe_product_id TEXT UNIQUE,
            stripe_price_id TEXT UNIQUE,
            price_monthly DECIMAL(10,2) NOT NULL,
            price_yearly DECIMAL(10,2),
            credits_included INTEGER NOT NULL DEFAULT 0,
            credits_monthly INTEGER NOT NULL DEFAULT 0,
            features JSONB DEFAULT '[]'::jsonb,
            limits JSONB DEFAULT '{}'::jsonb,
            is_active BOOLEAN DEFAULT true,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Note: Using existing column credits_per_month instead of credits_included/credits_monthly

    -- Add limits if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subscription_plans' 
        AND column_name = 'limits'
    ) THEN
        ALTER TABLE public.subscription_plans ADD COLUMN limits JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Add sort_order if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subscription_plans' 
        AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE public.subscription_plans ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;

    -- Add is_active if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subscription_plans' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.subscription_plans ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Add updated_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subscription_plans' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.subscription_plans ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Add stripe_product_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subscription_plans' 
        AND column_name = 'stripe_product_id'
    ) THEN
        ALTER TABLE public.subscription_plans ADD COLUMN stripe_product_id TEXT UNIQUE;
    END IF;

    -- Add stripe_price_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subscription_plans' 
        AND column_name = 'stripe_price_id'
    ) THEN
        ALTER TABLE public.subscription_plans ADD COLUMN stripe_price_id TEXT UNIQUE;
    END IF;
END $$;

-- Create payment_history if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_history') THEN
        CREATE TABLE public.payment_history (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            stripe_payment_intent_id TEXT UNIQUE,
            stripe_invoice_id TEXT,
            amount DECIMAL(10,2) NOT NULL,
            currency TEXT DEFAULT 'usd',
            status TEXT NOT NULL,
            description TEXT,
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX idx_payment_history_user_id ON public.payment_history(user_id);
        CREATE INDEX idx_payment_history_created ON public.payment_history(created_at DESC);
    END IF;
END $$;

-- Create credit_packages if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'credit_packages') THEN
        CREATE TABLE public.credit_packages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            stripe_price_id TEXT UNIQUE,
            credits INTEGER NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            bonus_credits INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

-- Add missing columns to credit_packages if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'credit_packages' 
        AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE public.credit_packages ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'credit_packages' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.credit_packages ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'credit_packages' 
        AND column_name = 'bonus_credits'
    ) THEN
        ALTER TABLE public.credit_packages ADD COLUMN bonus_credits INTEGER DEFAULT 0;
    END IF;
END $$;

-- Enable RLS on new tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_history') THEN
        ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'credit_packages') THEN
        ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies only if they don't exist
DO $$
BEGIN
    -- Payment history policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payment_history' 
        AND policyname = 'Users can view own payment history'
    ) THEN
        CREATE POLICY "Users can view own payment history"
            ON public.payment_history FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payment_history' 
        AND policyname = 'Service role can manage payments'
    ) THEN
        CREATE POLICY "Service role can manage payments"
            ON public.payment_history FOR ALL
            USING (auth.jwt()->>'role' = 'service_role');
    END IF;

    -- Credit packages policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'credit_packages' 
        AND policyname = 'Credit packages are viewable by everyone'
    ) THEN
        CREATE POLICY "Credit packages are viewable by everyone"
            ON public.credit_packages FOR SELECT
            USING (is_active = true);
    END IF;

    -- Subscription plans policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subscription_plans' 
        AND policyname = 'Plans are viewable by everyone'
    ) THEN
        CREATE POLICY "Plans are viewable by everyone"
            ON public.subscription_plans FOR SELECT
            USING (is_active = true);
    END IF;
END $$;

-- Update or insert subscription plans (upsert)
-- Note: Using credits_per_month (existing column) and max_projects/max_team_members as separate columns
INSERT INTO public.subscription_plans (name, price_monthly, price_yearly, features, limits, sort_order, credits_per_month, max_projects, max_team_members)
VALUES
    ('Free', 0, 0,
        '["5 SEO Tools", "Social Media SEO (Limited)", "100 Credits One-time", "Community Support"]'::jsonb,
        '{"max_keywords": 100, "max_reports": 5}'::jsonb, 1, 0, 1, 1),
    ('Starter', 29, 290,
        '["All SEO Tools", "Social Media SEO", "SERP Preview", "500 Credits/month", "Email Support"]'::jsonb,
        '{"max_keywords": 500, "max_reports": 50}'::jsonb, 2, 500, 3, 1),
    ('Professional', 79, 790,
        '["Everything in Starter", "GA4 Analytics", "Credit Analytics", "Rank Tracking", "1,500 Credits/month", "Priority Support", "Export Reports"]'::jsonb,
        '{"max_keywords": 2000, "max_reports": 500}'::jsonb, 3, 1500, 10, 5),
    ('Agency', 149, 1490,
        '["Everything in Professional", "White-label Reports", "Team Collaboration", "API Access", "3,500 Credits/month", "Dedicated Support"]'::jsonb,
        '{"max_keywords": 10000, "max_reports": -1}'::jsonb, 4, 3500, 50, 20),
    ('Enterprise', 299, 2990,
        '["Everything in Agency", "Custom Integration", "SLA", "Custom Limits", "10,000 Credits/month", "White-glove Support", "Training"]'::jsonb,
        '{"max_keywords": -1, "max_reports": -1}'::jsonb, 5, 10000, -1, -1)
ON CONFLICT (name) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    credits_per_month = EXCLUDED.credits_per_month,
    max_projects = EXCLUDED.max_projects,
    max_team_members = EXCLUDED.max_team_members,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- Insert credit packages (upsert)
INSERT INTO public.credit_packages (name, credits, price, bonus_credits, sort_order)
VALUES
    ('Starter Pack', 100, 10, 0, 1),
    ('Growth Pack', 500, 40, 50, 2),
    ('Pro Pack', 1000, 70, 150, 3),
    ('Enterprise Pack', 5000, 300, 1000, 4)
ON CONFLICT (name) DO UPDATE SET
    credits = EXCLUDED.credits,
    price = EXCLUDED.price,
    bonus_credits = EXCLUDED.bonus_credits,
    sort_order = EXCLUDED.sort_order;

-- Create helper functions if they don't exist
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
        sp.credits_per_month,
        us.status,
        us.current_period_end
    FROM user_subscriptions us
    JOIN subscription_plans sp ON sp.id = us.plan_id
    WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing')
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
