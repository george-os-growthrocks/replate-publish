-- ============================================
-- CRITICAL RLS POLICIES FOR CORE TABLES
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. USER CREDITS TABLE
-- ============================================
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can insert their own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can update their own credits" ON user_credits;
DROP POLICY IF EXISTS "Service role can manage all credits" ON user_credits;

CREATE POLICY "Users can view their own credits"
ON user_credits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all credits"
ON user_credits FOR ALL
USING (auth.role() = 'service_role');

GRANT SELECT, INSERT, UPDATE ON user_credits TO authenticated;
GRANT ALL ON user_credits TO service_role;

-- 2. USER OAUTH TOKENS TABLE (if not already created)
-- ============================================
ALTER TABLE user_oauth_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own tokens" ON user_oauth_tokens;
DROP POLICY IF EXISTS "Users can insert their own tokens" ON user_oauth_tokens;
DROP POLICY IF EXISTS "Users can update their own tokens" ON user_oauth_tokens;
DROP POLICY IF EXISTS "Users can delete their own tokens" ON user_oauth_tokens;
DROP POLICY IF EXISTS "Service role can manage all tokens" ON user_oauth_tokens;

CREATE POLICY "Users can view their own tokens" ON user_oauth_tokens
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own tokens" ON user_oauth_tokens
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tokens" ON user_oauth_tokens
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own tokens" ON user_oauth_tokens
  FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all tokens" ON user_oauth_tokens
  FOR ALL
  USING (auth.role() = 'service_role');

GRANT SELECT, INSERT, UPDATE, DELETE ON user_oauth_tokens TO authenticated;
GRANT ALL ON user_oauth_tokens TO service_role;

-- 3. USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  website_url TEXT,
  job_title TEXT,
  industry TEXT,
  team_size TEXT,
  monthly_traffic TEXT,
  primary_goals TEXT,
  bio TEXT,
  twitter_handle TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

CREATE POLICY "Users can view their own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON user_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;

-- 4. CREDIT USAGE HISTORY TABLE (for analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS credit_usage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  credits_used INTEGER NOT NULL DEFAULT 1,
  project_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_usage_user ON credit_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_created ON credit_usage_history(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_usage_feature ON credit_usage_history(feature);

ALTER TABLE credit_usage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credit history"
ON credit_usage_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage credit history"
ON credit_usage_history FOR ALL
USING (auth.role() = 'service_role');

GRANT SELECT ON credit_usage_history TO authenticated;
GRANT ALL ON credit_usage_history TO service_role;

-- 5. STORAGE BUCKET FOR AVATARS
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- VERIFICATION QUERIES
-- Run these to test policies are working
-- ============================================

-- Check your credits (should work)
-- SELECT * FROM user_credits WHERE user_id = auth.uid();

-- Check your tokens (should work)
-- SELECT * FROM user_oauth_tokens WHERE user_id = auth.uid();

-- Check your profile (should work)
-- SELECT * FROM user_profiles WHERE user_id = auth.uid();

-- Check credit history (should work)
-- SELECT * FROM credit_usage_history WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 10;
