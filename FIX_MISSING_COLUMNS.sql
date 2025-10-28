-- Fix missing subscription_plans columns
-- Run this manually in Supabase SQL Editor

-- Add stripe_price_id_monthly if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subscription_plans' 
        AND column_name = 'stripe_price_id_monthly'
    ) THEN
        ALTER TABLE public.subscription_plans ADD COLUMN stripe_price_id_monthly TEXT;
    END IF;
END $$;

-- Add stripe_price_id_yearly if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subscription_plans' 
        AND column_name = 'stripe_price_id_yearly'
    ) THEN
        ALTER TABLE public.subscription_plans ADD COLUMN stripe_price_id_yearly TEXT;
    END IF;
END $$;

-- Update existing plans with stripe price IDs
UPDATE public.subscription_plans SET 
    stripe_price_id_monthly = CASE 
        WHEN name = 'Starter' THEN 'price_starter_monthly'
        WHEN name = 'Professional' THEN 'price_pro_monthly'
        WHEN name = 'Agency' THEN 'price_agency_monthly'
        WHEN name = 'Enterprise' THEN 'price_enterprise_monthly'
        ELSE NULL
    END,
    stripe_price_id_yearly = CASE 
        WHEN name = 'Starter' THEN 'price_starter_yearly'
        WHEN name = 'Professional' THEN 'price_pro_yearly'
        WHEN name = 'Agency' THEN 'price_agency_yearly'
        WHEN name = 'Enterprise' THEN 'price_enterprise_yearly'
        ELSE NULL
    END
WHERE name IN ('Starter', 'Professional', 'Agency', 'Enterprise');

-- Verify the changes
SELECT name, stripe_price_id_monthly, stripe_price_id_yearly 
FROM public.subscription_plans 
ORDER BY sort_order;
