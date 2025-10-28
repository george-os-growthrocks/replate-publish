-- Fix pricing plan order and ensure correct values
-- Run this manually in Supabase SQL Editor

-- Check current order and values
SELECT name, sort_order, price_monthly, price_yearly, credits_per_month, max_projects 
FROM public.subscription_plans 
ORDER BY sort_order;

-- Update sort_order to ensure correct display order
UPDATE public.subscription_plans SET sort_order = 1 WHERE name = 'Free';
UPDATE public.subscription_plans SET sort_order = 2 WHERE name = 'Starter';
UPDATE public.subscription_plans SET sort_order = 3 WHERE name = 'Professional';
UPDATE public.subscription_plans SET sort_order = 4 WHERE name = 'Agency';
UPDATE public.subscription_plans SET sort_order = 5 WHERE name = 'Enterprise';

-- Update Enterprise plan pricing if it seems too high
UPDATE public.subscription_plans SET 
    price_monthly = 199,
    price_yearly = 1990,
    credits_per_month = 8000,
    max_projects = 100
WHERE name = 'Enterprise';

-- Verify the updated order
SELECT name, sort_order, price_monthly, price_yearly, credits_per_month, max_projects 
FROM public.subscription_plans 
ORDER BY sort_order;
