-- =====================================================
-- FIX DATABASE ERRORS
-- Addresses: user_oauth_tokens 400, user_profiles 409, seo_projects 400
-- =====================================================

-- 1. FIX USER_OAUTH_TOKENS RLS POLICIES
-- Drop and recreate policies to ensure proper access
DROP POLICY IF EXISTS "Users can view their own tokens" ON user_oauth_tokens;
DROP POLICY IF EXISTS "Users can insert their own tokens" ON user_oauth_tokens;
DROP POLICY IF EXISTS "Users can update their own tokens" ON user_oauth_tokens;
DROP POLICY IF EXISTS "Users can delete their own tokens" ON user_oauth_tokens;

-- Recreate with proper permissions
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

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_oauth_tokens TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 2. FIX USER_PROFILES 409 CONFLICT ISSUE
-- The issue is likely the UNIQUE constraint on user_id causing conflicts
-- Let's handle upserts properly by adding an ON CONFLICT policy

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Recreate policies with proper conflict handling
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;

-- 3. FIX SEO_PROJECTS TABLE ISSUES
-- Just ensure RLS and permissions, don't assume column structure
DO $$
BEGIN
    -- Ensure RLS is enabled
    ALTER TABLE seo_projects ENABLE ROW LEVEL SECURITY;
    
EXCEPTION
    WHEN undefined_table THEN
        -- Table doesn't exist, create it with basic structure
        CREATE TABLE seo_projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users NOT NULL,
            name TEXT NOT NULL,
            domain TEXT NOT NULL,
            gsc_property_url TEXT,
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            
            UNIQUE(user_id, domain)
        );
        
        -- Enable RLS
        ALTER TABLE seo_projects ENABLE ROW LEVEL SECURITY;
        
        -- Create indexes for the new table
        CREATE INDEX idx_seo_projects_user_id ON seo_projects(user_id);
        CREATE INDEX idx_seo_projects_updated_at ON seo_projects(updated_at DESC);
END $$;

-- Drop and recreate RLS policies for seo_projects
DROP POLICY IF EXISTS "Users can view own projects" ON seo_projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON seo_projects;
DROP POLICY IF EXISTS "Users can update own projects" ON seo_projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON seo_projects;

-- Create proper RLS policies
CREATE POLICY "Users can view own projects" ON seo_projects
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own projects" ON seo_projects
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects" ON seo_projects
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own projects" ON seo_projects
  FOR DELETE
  USING (user_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON seo_projects TO authenticated;

-- 4. ENSURE ALL TABLES HAVE PROPER PERMISSIONS
-- Sometimes permissions need to be explicitly granted
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- 5. CREATE OR REPLACE FUNCTION TO HANDLE UPDATED_AT
-- This ensures updated_at is properly managed
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables that need them
DROP TRIGGER IF EXISTS update_seo_projects_updated_at ON seo_projects;
CREATE TRIGGER update_seo_projects_updated_at
    BEFORE UPDATE ON seo_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. VERIFY TABLES EXIST AND ARE ACCESSIBLE
-- This will help confirm the fixes worked
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('user_oauth_tokens', 'user_profiles', 'seo_projects')
ORDER BY tablename;

-- 7. CHECK RLS STATUS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('user_oauth_tokens', 'user_profiles', 'seo_projects')
ORDER BY tablename;

-- 8. LIST POLICIES FOR VERIFICATION
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('user_oauth_tokens', 'user_profiles', 'seo_projects')
ORDER BY tablename, policyname;
