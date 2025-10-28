-- Add onboarding fields to user_profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding 
ON user_profiles(user_id, onboarding_completed);

-- Verification query
-- SELECT user_id, onboarding_completed, onboarding_step FROM user_profiles;
