-- Safe fix for seo_projects - drops and recreates policies to ensure they're correct

-- First, ensure the table exists (won't error if it does)
CREATE TABLE IF NOT EXISTS seo_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  domain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index if missing
CREATE INDEX IF NOT EXISTS idx_seo_projects_user_id ON seo_projects(user_id);

-- Enable RLS (safe to run multiple times)
ALTER TABLE seo_projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe - won't error if they don't exist)
DROP POLICY IF EXISTS "Users can view own projects" ON seo_projects;
DROP POLICY IF EXISTS "Users can create own projects" ON seo_projects;
DROP POLICY IF EXISTS "Users can update own projects" ON seo_projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON seo_projects;

-- Recreate policies with correct configuration
CREATE POLICY "Users can view own projects" ON seo_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON seo_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON seo_projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON seo_projects
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON seo_projects TO authenticated;

-- Verify the setup
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'seo_projects'
ORDER BY policyname;
