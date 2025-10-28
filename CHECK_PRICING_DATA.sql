-- Check current pricing data in database
-- Run this in Supabase SQL Editor to see what's actually stored

SELECT 
    name,
    sort_order,
    price_monthly,
    price_yearly,
    credits_per_month,
    max_projects,
    max_team_members,
    features
FROM public.subscription_plans 
ORDER BY sort_order;

-- Also check if there are duplicate entries
SELECT name, COUNT(*) as count
FROM public.subscription_plans 
GROUP BY name
HAVING COUNT(*) > 1;
