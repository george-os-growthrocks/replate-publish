-- Check what's actually wrong with the subscription_plans table
-- This will help identify the root cause of 400 errors

-- 1. Check if table exists
SELECT 'Table exists' as check, EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'subscription_plans'
) as result;

-- 2. Check all columns in the table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'subscription_plans'
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT 'RLS status' as check, relrowsecurity as enabled
FROM pg_class 
WHERE relname = 'subscription_plans';

-- 4. Check if we can select from table at all
-- This will tell us if it's a permissions issue
DO $$
BEGIN
    PERFORM 1 FROM public.subscription_plans LIMIT 1;
    RAISE NOTICE 'Direct SELECT works: Table is accessible';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Direct SELECT failed: %', SQLERRM;
END $$;

-- 5. Try a simple count
SELECT 'Simple count' as check, COUNT(*) as result
FROM public.subscription_plans;
