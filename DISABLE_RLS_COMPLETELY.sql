-- Completely disable RLS for subscription_plans table (temporary fix)
-- This will allow anyone to read the pricing data

-- Disable RLS completely
ALTER TABLE public.subscription_plans DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT relrowsecurity 
FROM pg_class 
WHERE relname = 'subscription_plans';

-- Test the connection works
SELECT COUNT(*) as test_count, 
       'RLS disabled - pricing should work now' as status
FROM public.subscription_plans 
WHERE is_active = true;

-- Show sample data to confirm it's working
SELECT name, price_monthly, credits_per_month, max_projects
FROM public.subscription_plans 
WHERE is_active = true 
ORDER BY sort_order;
