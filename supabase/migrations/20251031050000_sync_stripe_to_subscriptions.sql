-- Sync Stripe Subscriptions to User Subscriptions
-- This trigger automatically syncs data from the subscriptions table (Stripe webhook source)
-- to the user_subscriptions and user_credits tables (application source)

-- First, create the subscriptions table if it doesn't exist
-- This table is populated by Stripe webhooks and is the source of truth for paid subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL,
  price_id text,
  product_id text,
  quantity int DEFAULT 1,
  current_period_end timestamptz,
  cancel_at timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  trial_end timestamptz,
  raw jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Enable RLS on subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for subscriptions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscriptions' 
    AND policyname = 'Users can view own subscriptions'
  ) THEN
    CREATE POLICY "Users can view own subscriptions" 
    ON public.subscriptions
    FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create stripe_customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON public.stripe_customers(stripe_customer_id);

-- Enable RLS on stripe_customers table
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for stripe_customers
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'stripe_customers' 
    AND policyname = 'Users can view own customer data'
  ) THEN
    CREATE POLICY "Users can view own customer data" 
    ON public.stripe_customers
    FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add stripe_subscription_id and stripe_customer_id to user_subscriptions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' 
    AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE user_subscriptions 
    ADD COLUMN stripe_subscription_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' 
    AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE user_subscriptions 
    ADD COLUMN stripe_customer_id text;
  END IF;
END $$;

-- Function to sync Stripe subscription data to application tables
CREATE OR REPLACE FUNCTION sync_stripe_subscription()
RETURNS TRIGGER AS $$
DECLARE
  plan_record RECORD;
  billing_cycle_type TEXT;
  stripe_customer_record RECORD;
BEGIN
  -- Log the trigger event
  RAISE NOTICE 'Syncing Stripe subscription % for user %', NEW.id, NEW.user_id;
  
  -- Skip if user_id is null (shouldn't happen but safety check)
  IF NEW.user_id IS NULL THEN
    RAISE NOTICE 'Skipping sync - no user_id found';
    RETURN NEW;
  END IF;
  
  -- Find plan by price_id (check both monthly and yearly)
  SELECT * INTO plan_record 
  FROM subscription_plans 
  WHERE stripe_price_id_monthly = NEW.price_id 
     OR stripe_price_id_yearly = NEW.price_id
  LIMIT 1;
  
  -- If no plan found, log warning and skip
  IF plan_record IS NULL THEN
    RAISE WARNING 'No plan found for price_id: %. Skipping sync.', NEW.price_id;
    RETURN NEW;
  END IF;
  
  RAISE NOTICE 'Found plan: % (id: %)', plan_record.name, plan_record.id;
  
  -- Determine billing cycle based on price_id
  billing_cycle_type := CASE 
    WHEN NEW.price_id = plan_record.stripe_price_id_yearly THEN 'yearly'
    ELSE 'monthly'
  END;
  
  -- Get Stripe customer ID if exists
  SELECT * INTO stripe_customer_record
  FROM stripe_customers
  WHERE user_id = NEW.user_id
  LIMIT 1;
  
  -- Upsert user_subscriptions
  INSERT INTO user_subscriptions (
    user_id,
    plan_id,
    status,
    billing_cycle,
    current_period_start,
    current_period_end,
    trial_end,
    cancel_at_period_end,
    stripe_subscription_id,
    stripe_customer_id,
    updated_at
  ) VALUES (
    NEW.user_id,
    plan_record.id,
    NEW.status,
    billing_cycle_type,
    NOW(), -- Use current time for period start
    NEW.current_period_end,
    NEW.trial_end,
    NEW.cancel_at_period_end,
    NEW.id,
    stripe_customer_record.stripe_customer_id,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    status = EXCLUDED.status,
    billing_cycle = EXCLUDED.billing_cycle,
    current_period_end = EXCLUDED.current_period_end,
    trial_end = EXCLUDED.trial_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    stripe_subscription_id = EXCLUDED.stripe_subscription_id,
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    updated_at = NOW();
  
  RAISE NOTICE 'Synced user_subscriptions for user %', NEW.user_id;
  
  -- Update credits based on plan (only if active or trialing)
  IF NEW.status IN ('active', 'trialing') THEN
    -- Reset credits to plan allocation
    UPDATE user_credits 
    SET total_credits = plan_record.credits_per_month,
        used_credits = 0,
        last_reset_at = NOW()
    WHERE user_id = NEW.user_id;
    
    -- If no credits record exists, create one
    IF NOT FOUND THEN
      INSERT INTO user_credits (user_id, total_credits, used_credits, last_reset_at)
      VALUES (NEW.user_id, plan_record.credits_per_month, 0, NOW());
    END IF;
    
    RAISE NOTICE 'Updated credits to % for user %', plan_record.credits_per_month, NEW.user_id;
  ELSIF NEW.status IN ('canceled', 'past_due', 'unpaid') THEN
    -- On cancellation or payment failure, optionally downgrade to free plan
    DECLARE
      free_plan_id UUID;
    BEGIN
      SELECT id INTO free_plan_id
      FROM subscription_plans
      WHERE name = 'Free' AND is_active = true
      LIMIT 1;
      
      IF free_plan_id IS NOT NULL THEN
        UPDATE user_subscriptions
        SET plan_id = free_plan_id,
            status = 'active',
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
        
        UPDATE user_credits
        SET total_credits = 100,
            used_credits = 0,
            last_reset_at = NOW()
        WHERE user_id = NEW.user_id;
        
        RAISE NOTICE 'Downgraded user % to Free plan due to status: %', NEW.user_id, NEW.status;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_sync_stripe_subscription ON subscriptions;

-- Create trigger that fires after INSERT or UPDATE on subscriptions table
CREATE TRIGGER trigger_sync_stripe_subscription
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_stripe_subscription();

-- Add comments for documentation
COMMENT ON FUNCTION sync_stripe_subscription() IS 
  'Automatically syncs Stripe subscription data from subscriptions table to user_subscriptions and user_credits tables. Triggered by Stripe webhooks.';

COMMENT ON TRIGGER trigger_sync_stripe_subscription ON subscriptions IS
  'Syncs Stripe webhook data to application subscription and credits tables';

