-- Fix RLS policies blocking pricing data access
-- Run this to allow public access to subscription_plans for pricing page

-- First, let's see what the current policy is
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'subscription_plans';

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Users can insert their own subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Users can update their own subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Users can delete their own subscription plans" ON public.subscription_plans;

-- Create a new policy that allows anyone to read active subscription plans (for pricing page)
CREATE POLICY "Allow public read access to active subscription plans" ON public.subscription_plans
    FOR SELECT USING (is_active = true);

-- Keep RLS enabled but with permissive policy
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Verify the new policy
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'subscription_plans';

-- Test the new policy by running the same query the frontend uses
SELECT COUNT(*) as test_result
FROM public.subscription_plans 
WHERE is_active = true;
