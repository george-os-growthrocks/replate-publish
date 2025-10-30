-- Fix existing users who should have trial but got Free plan credits
-- This migration updates users who have Launch plan subscription with trialing status
-- but only have 100 credits instead of 1200

DO $$
DECLARE
  launch_plan_id UUID;
BEGIN
  -- Get Launch plan ID
  SELECT id INTO launch_plan_id
  FROM subscription_plans
  WHERE name = 'Launch' AND is_active = true
  LIMIT 1;

  IF launch_plan_id IS NOT NULL THEN
    -- Update credits for users on Launch trial with only 100 credits
    UPDATE user_credits
    SET 
      total_credits = 1200,
      updated_at = NOW()
    WHERE user_id IN (
      SELECT us.user_id
      FROM user_subscriptions us
      WHERE us.plan_id = launch_plan_id
        AND us.status = 'trialing'
        AND us.trial_end > NOW()
    )
    AND total_credits = 100;

    -- Also update user_subscriptions to ensure they have proper trial setup
    UPDATE user_subscriptions
    SET 
      seat_count = COALESCE(seat_count, 1),
      usage_last_reset_at = COALESCE(usage_last_reset_at, NOW())
    WHERE plan_id = launch_plan_id
      AND status = 'trialing'
      AND trial_end > NOW();
  END IF;
END $$;

