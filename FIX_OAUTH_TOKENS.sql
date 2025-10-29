-- Fix OAuth Tokens Storage for GSC Properties
-- Run this in Supabase SQL Editor

-- 1. Create OAuth tokens table
CREATE TABLE IF NOT EXISTS public.user_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- 2. Enable RLS
ALTER TABLE public.user_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own tokens" ON user_oauth_tokens;
DROP POLICY IF EXISTS "Users can update own tokens" ON user_oauth_tokens;
DROP POLICY IF EXISTS "Users can insert own tokens" ON user_oauth_tokens;

-- 4. Create policies
CREATE POLICY "Users can view own tokens" ON user_oauth_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON user_oauth_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens" ON user_oauth_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_oauth_tokens_user_provider 
  ON user_oauth_tokens(user_id, provider);

-- 6. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_oauth_tokens TO authenticated;

-- 7. Verify table was created
SELECT 
  tablename,
  schemaname,
  hasindexes,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'user_oauth_tokens';

-- 8. Check if you have any tokens (will be empty until you sign in again)
SELECT 
  provider,
  created_at,
  expires_at,
  expires_at > NOW() as is_valid,
  access_token IS NOT NULL as has_token
FROM user_oauth_tokens
WHERE user_id = auth.uid();
