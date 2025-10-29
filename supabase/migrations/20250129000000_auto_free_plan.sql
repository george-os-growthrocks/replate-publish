-- Function to automatically create a free subscription for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  free_plan_id uuid;
BEGIN
  -- Get the Free plan ID
  SELECT id INTO free_plan_id
  FROM public.subscription_plans
  WHERE name = 'Free' AND is_active = true
  LIMIT 1;

  -- If Free plan exists, create a subscription for the new user
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
    );

    -- Create user credits record
    INSERT INTO public.user_credits (
      user_id,
      total_credits,
      used_credits,
      available_credits
    ) VALUES (
      NEW.id,
      100,
      0,
      100
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to run after user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure Free plan exists
INSERT INTO public.subscription_plans (
  name,
  price_monthly,
  price_yearly,
  features,
  is_active,
  sort_order,
  credits_per_month,
  max_projects,
  max_team_members
) VALUES (
  'Free',
  0,
  0,
  '["5 Essential SEO Tools", "100 Credits One-time", "1 SEO Project", "Basic Keyword Research", "Community Support", "100 Keyword Tracking"]'::jsonb,
  true,
  1,
  0,
  1,
  1
)
ON CONFLICT (name) DO UPDATE SET
  is_active = true,
  sort_order = 1;
