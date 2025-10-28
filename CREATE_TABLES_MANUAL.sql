-- Run this SQL directly in Supabase SQL Editor
-- https://supabase.com/dashboard/project/siwzszmukfbzicjjkxro/sql/new

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  website_url TEXT,
  job_title TEXT,
  industry TEXT,
  team_size TEXT,
  monthly_traffic TEXT,
  primary_goals TEXT,
  bio TEXT,
  avatar_url TEXT,
  twitter_handle TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;

-- Activity Log Table
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  activity_type TEXT NOT NULL,
  activity_description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at DESC);

ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activity" ON user_activity_log;
CREATE POLICY "Users can view own activity" ON user_activity_log FOR SELECT USING (auth.uid() = user_id);

GRANT SELECT ON user_activity_log TO authenticated;

