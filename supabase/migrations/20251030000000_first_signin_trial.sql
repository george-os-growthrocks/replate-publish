-- 7-Day Free Trial on First Sign-In
-- Assigns Starter plan with 7-day trial for first-time Google sign-in users

-- 1. Add trial tracking column to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS has_used_trial BOOLEAN DEFAULT false;

-- 2. Add is_first_trial flag to user_subscriptions for tracking
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS is_first_trial BOOLEAN DEFAULT false;

-- 3. Ensure Starter plan exists with correct configuration
INSERT INTO subscription_plans (
  name,
  price_monthly,
  price_yearly,
  credits_per_month,
  max_projects,
  max_team_members,
  features,
  is_active,
  sort_order
)
VALUES (
  'Starter',
  29.00,
  290.00,
  500,
  3,
  1,
  '["Keyword Research", "Rank Tracking (50 keywords)", "Content Repurpose (50 generations)", "Site Audit (1 site)", "Competitor Analysis (3 competitors)", "Email Support", "500 Credits/month"]'::jsonb,
  true,
  2
)
ON CONFLICT (name) DO UPDATE SET
  price_monthly = 29.00,
  price_yearly = 290.00,
  credits_per_month = 500,
  max_projects = 3,
  max_team_members = 1,
  is_active = true,
  sort_order = 2;

-- 4. Update handle_new_user() function to assign 7-day trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  starter_plan_id uuid;
  existing_subscription uuid;
  already_used_trial boolean;
  free_plan_id uuid;
BEGIN
  -- Check if user already has a subscription (prevents duplicate trials)
  SELECT id INTO existing_subscription
  FROM public.user_subscriptions
  WHERE user_id = NEW.id
  LIMIT 1;

  -- If user already has a subscription, skip (user is re-signing in)
  IF existing_subscription IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Check if user already used trial
  SELECT COALESCE(has_used_trial, false) INTO already_used_trial
  FROM public.user_profiles
  WHERE user_id = NEW.id
  LIMIT 1;

  -- If user already used trial, skip to Free plan fallback
  IF already_used_trial THEN
    -- Assign Free plan as fallback
    SELECT id INTO free_plan_id
    FROM public.subscription_plans
    WHERE name = 'Free' AND is_active = true
    LIMIT 1;

    IF free_plan_id IS NOT NULL THEN
      INSERT INTO public.user_subscriptions (
        user_id,
        plan_id,
        status,
        billing_cycle,
        current_period_start,
        current_period_end,
        trial_end,
        cancel_at_period_end
      ) VALUES (
        NEW.id,
        free_plan_id,
        'active',
        'monthly',
        NOW(),
        NOW() + INTERVAL '1 year',
        NULL,
        false
      )
      ON CONFLICT (user_id) DO NOTHING;

      INSERT INTO public.user_credits (
        user_id,
        total_credits,
        used_credits
      ) VALUES (
        NEW.id,
        100,
        0
      )
      ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
  END IF;

  -- Get Starter plan ID
  SELECT id INTO starter_plan_id
  FROM public.subscription_plans
  WHERE name = 'Starter' AND is_active = true
  LIMIT 1;

  -- If Starter plan exists, create 7-day trial
  IF starter_plan_id IS NOT NULL THEN
    -- Create 7-day trial subscription for Starter plan
    INSERT INTO public.user_subscriptions (
      user_id,
      plan_id,
      status,
      billing_cycle,
      current_period_start,
      current_period_end,
      trial_end,
      cancel_at_period_end,
      is_first_trial
    ) VALUES (
      NEW.id,
      starter_plan_id,
      'trialing',
      'monthly',
      NOW(),
      NOW() + INTERVAL '7 days', -- Trial period end
      NOW() + INTERVAL '7 days',  -- Trial ends in 7 days
      false,
      true  -- Mark as first trial
    );

    -- Create user credits with Starter plan amount (500 credits)
    INSERT INTO public.user_credits (
      user_id,
      total_credits,
      used_credits
    ) VALUES (
      NEW.id,
      500,  -- Starter plan credits
      0
    )
    ON CONFLICT (user_id) DO UPDATE SET
      total_credits = 500,
      used_credits = 0,
      updated_at = NOW();

    -- Mark user as having used trial
    INSERT INTO public.user_profiles (
      user_id,
      has_used_trial,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      has_used_trial = true,
      updated_at = NOW();

    RETURN NEW;
  END IF;

  -- Final fallback: Assign Free plan if Starter doesn't exist
  SELECT id INTO free_plan_id
  FROM public.subscription_plans
  WHERE name = 'Free' AND is_active = true
  LIMIT 1;

  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (
      user_id,
      plan_id,
      status,
      billing_cycle,
      current_period_start,
      current_period_end,
      trial_end,
      cancel_at_period_end
    ) VALUES (
      NEW.id,
      free_plan_id,
      'active',
      'monthly',
      NOW(),
      NOW() + INTERVAL '1 year',
      NULL,
      false
    )
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.user_credits (
      user_id,
      total_credits,
      used_credits
    ) VALUES (
      NEW.id,
      100,
      0
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_has_used_trial 
ON user_profiles(has_used_trial) 
WHERE has_used_trial = true;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_is_first_trial 
ON user_subscriptions(is_first_trial) 
WHERE is_first_trial = true;

-- 6. Add comment for documentation
COMMENT ON COLUMN user_profiles.has_used_trial IS 'Tracks if user has used their 7-day free trial. Prevents multiple trial assignments.';
COMMENT ON COLUMN user_subscriptions.is_first_trial IS 'Marks if this subscription was the initial 7-day trial assignment on first sign-in.';
