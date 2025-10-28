-- Basic connection and table test
-- Run this first to verify the database is working

-- Test 1: Can we connect to the database at all?
SELECT 'Database connection test' as test, NOW() as timestamp;

-- Test 2: Does the table exist?
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'subscription_plans'
) as table_exists;

-- Test 3: If table exists, how many rows?
SELECT COUNT(*) as total_rows FROM public.subscription_plans;

-- Test 4: Show sample of data (if any)
SELECT name, price_monthly, is_active 
FROM public.subscription_plans 
LIMIT 3;

-- Test 5: Check for RLS policies
SELECT count(*) as rls_policies_count 
FROM pg_policies 
WHERE tablename = 'subscription_plans';
