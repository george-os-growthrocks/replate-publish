-- Quick fix to populate subscription_plans with basic data
-- Run this if the table is empty or has issues

-- First, try to delete any existing data to avoid conflicts
DELETE FROM public.subscription_plans;

-- Insert basic pricing data (minimal required fields)
INSERT INTO public.subscription_plans (
    name, 
    price_monthly, 
    price_yearly, 
    credits_per_month, 
    max_projects, 
    max_team_members, 
    sort_order, 
    is_active,
    features,
    limits
) VALUES
    ('Free', 0, 0, 0, 1, 1, 1, true, 
     '["5 SEO Tools", "100 Credits", "Community Support"]'::jsonb,
     '{"max_keywords": 100}'::jsonb),
    ('Starter', 29, 290, 500, 3, 1, 2, true,
     '["All SEO Tools", "500 Credits/month", "Email Support"]'::jsonb,
     '{"max_keywords": 500}'::jsonb),
    ('Professional', 79, 790, 1500, 10, 5, 3, true,
     '["GA4 Analytics", "1,500 Credits/month", "Priority Support"]'::jsonb,
     '{"max_keywords": 2000}'::jsonb),
    ('Agency', 149, 1490, 3500, 50, 20, 4, true,
     '["White-label Reports", "3,500 Credits/month", "Dedicated Support"]'::jsonb,
     '{"max_keywords": 10000}'::jsonb),
    ('Enterprise', 299, 2990, 10000, 100, 50, 5, true,
     '["Custom Integration", "10,000 Credits/month", "White-glove Support"]'::jsonb,
     '{"max_keywords": -1}'::jsonb);

-- Verify the data was inserted
SELECT 
    name,
    price_monthly,
    credits_per_month,
    max_projects,
    sort_order,
    is_active
FROM public.subscription_plans 
ORDER BY sort_order;
