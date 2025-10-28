-- Diagnostic script to check pricing data
-- Run this in Supabase SQL Editor to identify issues

-- 1. Check if subscription_plans table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'subscription_plans'
) as table_exists;

-- 2. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'subscription_plans'
ORDER BY ordinal_position;

-- 3. Check current data in table
SELECT 
    name,
    price_monthly,
    price_yearly,
    credits_per_month,
    max_projects,
    max_team_members,
    sort_order,
    is_active,
    stripe_price_id_monthly,
    stripe_price_id_yearly
FROM public.subscription_plans 
ORDER BY sort_order;

-- 4. Check if RLS policies exist and might be blocking access
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'subscription_plans';

-- 5. Test a simple query (what the frontend runs)
SELECT COUNT(*) as total_plans,
       COUNT(CASE WHEN is_active = true THEN 1 END) as active_plans,
       COUNT(CASE WHEN name != 'Free' AND is_active = true THEN 1 END) as paid_plans
FROM public.subscription_plans;
