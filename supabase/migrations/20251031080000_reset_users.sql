-- Reset Users Migration
-- This migration deletes all existing users to provide a fresh start for the new authentication flow
-- This will cascade delete to all related tables due to ON DELETE CASCADE constraints

-- WARNING: This will permanently delete all user data
-- Only run this migration if you're certain you want to start fresh

-- Delete all users from auth.users
-- This will cascade to:
-- - public.user_profiles
-- - public.user_oauth_tokens
-- - public.seo_projects (and all related LLM tables, keywords, etc.)
-- - public.user_subscriptions
-- - public.stripe_customers
-- - public.credits_ledger
-- - All other tables with user_id foreign keys

DO $$
BEGIN
  -- Delete all users from auth.users
  DELETE FROM auth.users;
  
  RAISE NOTICE 'All users have been deleted. Database is ready for new authentication flow.';
END $$;

-- Verify deletion
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  RAISE NOTICE 'Remaining users in auth.users: %', user_count;
END $$;

