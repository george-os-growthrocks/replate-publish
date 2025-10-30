-- Fix all database issues

-- 1. Create missing credit_usage_log table
CREATE TABLE IF NOT EXISTS public.credit_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  credits_used INTEGER NOT NULL DEFAULT 1,
  project_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_usage_log_user_id ON public.credit_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_log_created_at ON public.credit_usage_log(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_usage_log_feature ON public.credit_usage_log(feature);

-- Enable RLS
ALTER TABLE public.credit_usage_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'credit_usage_log'
    AND policyname = 'Users can view own credit usage'
  ) THEN
    CREATE POLICY "Users can view own credit usage"
    ON public.credit_usage_log
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT ON public.credit_usage_log TO authenticated;
GRANT SELECT ON public.credit_usage_log TO anon;

-- 2. Update subscription_plans with correct Stripe IDs (if not already done)
UPDATE subscription_plans
SET stripe_product_id = 'prod_TKg8kntCNawOGw',
    stripe_price_id_monthly = 'price_1SO0mVBXxQFoEIvuDviUYuG6',
    stripe_price_id_yearly = 'price_1SO0meBXxQFoEIvurheSvraY'
WHERE name = 'Launch';

UPDATE subscription_plans
SET stripe_product_id = 'prod_TKg9o65IDgMYV6',
    stripe_price_id_monthly = 'price_1SO0nCBXxQFoEIvumtsRJbKT',
    stripe_price_id_yearly = 'price_1SO0nMBXxQFoEIvu15zIfWFV'
WHERE name = 'Growth';

UPDATE subscription_plans
SET stripe_product_id = 'prod_TKg9iIJ0TcbWdI',
    stripe_price_id_monthly = 'price_1SO0neBXxQFoEIvuBubzq23x',
    stripe_price_id_yearly = 'price_1SO0nrBXxQFoEIvuHoiDIwcK'
WHERE name = 'Agency';

UPDATE subscription_plans
SET stripe_product_id = 'prod_TKgAmDgOR4hpvo',
    stripe_price_id_monthly = NULL,
    stripe_price_id_yearly = NULL
WHERE name = 'Scale';

-- 3. Run the sync trigger migration
\i supabase/migrations/20251031050000_sync_stripe_to_subscriptions.sql

-- 4. Verify everything is working
SELECT 'Tables created:' as status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('credit_usage_log', 'subscriptions', 'stripe_customers', 'subscription_plans', 'user_subscriptions', 'user_credits')
ORDER BY table_name;

SELECT 'Stripe products updated:' as status;
SELECT name, stripe_product_id, stripe_price_id_monthly, stripe_price_id_yearly
FROM subscription_plans
WHERE name IN ('Launch', 'Growth', 'Agency', 'Scale')
ORDER BY name;
