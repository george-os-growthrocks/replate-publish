-- Quick verification that table has data and RLS is the issue
-- Run this to confirm what's in the table

-- Check if table exists and has data
SELECT 
    (SELECT COUNT(*) FROM public.subscription_plans) as total_rows,
    (SELECT COUNT(*) FROM public.subscription_plans WHERE is_active = true) as active_rows,
    (SELECT COUNT(*) FROM public.subscription_plans WHERE name != 'Free' AND is_active = true) as paid_rows;

-- Show what data exists
SELECT name, price_monthly, credits_per_month, sort_order, is_active
FROM public.subscription_plans 
ORDER BY sort_order;

-- Check RLS status
SELECT relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'subscription_plans';
