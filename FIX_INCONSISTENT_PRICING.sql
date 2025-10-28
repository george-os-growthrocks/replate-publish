-- Fix inconsistent pricing data
-- Run this in Supabase SQL Editor to standardize all pricing

-- First, clear any existing data to avoid conflicts
DELETE FROM public.subscription_plans;

-- Insert clean, consistent pricing data
INSERT INTO public.subscription_plans (name, price_monthly, price_yearly, features, limits, sort_order, credits_per_month, max_projects, max_team_members, stripe_price_id_monthly, stripe_price_id_yearly, is_active)
VALUES
    ('Free', 0, 0,
        '["5 SEO Tools", "Social Media SEO (Limited)", "100 Credits One-time", "Community Support"]'::jsonb,
        '{"max_keywords": 100, "max_reports": 5}'::jsonb, 1, 0, 1, 1, NULL, NULL, true),
    ('Starter', 29, 290,
        '["All SEO Tools", "Social Media SEO", "SERP Preview", "500 Credits/month", "Email Support", "7-Day Free Trial"]'::jsonb,
        '{"max_keywords": 500, "max_reports": 50}'::jsonb, 2, 500, 3, 1, 'price_starter_monthly', 'price_starter_yearly', true),
    ('Professional', 79, 790,
        '["Everything in Starter", "GA4 Analytics", "Credit Analytics", "Rank Tracking", "1,500 Credits/month", "Priority Support", "Export Reports", "7-Day Free Trial"]'::jsonb,
        '{"max_keywords": 2000, "max_reports": 500}'::jsonb, 3, 1500, 10, 5, 'price_pro_monthly', 'price_pro_yearly', true),
    ('Agency', 149, 1490,
        '["Everything in Professional", "White-label Reports", "Team Collaboration", "API Access", "3,500 Credits/month", "Dedicated Support", "7-Day Free Trial"]'::jsonb,
        '{"max_keywords": 10000, "max_reports": -1}'::jsonb, 4, 3500, 50, 20, 'price_agency_monthly', 'price_agency_yearly', true),
    ('Enterprise', 299, 2990,
        '["Everything in Agency", "Custom Integration", "SLA", "Custom Limits", "10,000 Credits/month", "White-glove Support", "Training", "7-Day Free Trial"]'::jsonb,
        '{"max_keywords": -1, "max_reports": -1}'::jsonb, 5, 10000, 100, 50, 'price_enterprise_monthly', 'price_enterprise_yearly', true);

-- Verify the corrected data
SELECT 
    name,
    sort_order,
    price_monthly,
    price_yearly,
    credits_per_month,
    max_projects,
    max_team_members
FROM public.subscription_plans 
ORDER BY sort_order;
