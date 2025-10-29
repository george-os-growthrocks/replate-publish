-- Manual function to assign trial to existing users who don't have one
-- This can be called manually for users who signed in before the migration ran

CREATE OR REPLACE FUNCTION assign_trial_to_existing_user(p_user_id UUID)
RETURNS jsonb AS $$
DECLARE
  starter_plan_id uuid;
  existing_subscription uuid;
  already_used_trial boolean;
BEGIN
  -- Check if user already has a subscription
  SELECT id INTO existing_subscription
  FROM public.user_subscriptions
  WHERE user_id = p_user_id
  LIMIT 1;

  IF existing_subscription IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User already has a subscription',
      'subscription_id', existing_subscription
    );
  END IF;

  -- Check if user already used trial
  SELECT COALESCE(has_used_trial, false) INTO already_used_trial
  FROM public.user_profiles
  WHERE user_id = p_user_id
  LIMIT 1;

  IF already_used_trial THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User has already used their trial'
    );
  END IF;

  -- Get Starter plan ID
  SELECT id INTO starter_plan_id
  FROM public.subscription_plans
  WHERE name = 'Starter' AND is_active = true
  LIMIT 1;

  IF starter_plan_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Starter plan not found'
    );
  END IF;

  -- Create 7-day trial subscription
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
    p_user_id,
    starter_plan_id,
    'trialing',
    'monthly',
    NOW(),
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '7 days',
    false,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Create or update credits
  INSERT INTO public.user_credits (
    user_id,
    total_credits,
    used_credits
  ) VALUES (
    p_user_id,
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
    p_user_id,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    has_used_trial = true,
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'message', '7-day trial assigned successfully',
    'trial_end', (NOW() + INTERVAL '7 days')::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION assign_trial_to_existing_user(UUID) TO authenticated;

COMMENT ON FUNCTION assign_trial_to_existing_user(UUID) IS 'Manually assign a 7-day Starter plan trial to an existing user who signed in before the migration ran';

