-- Rename seo_projects to projects
-- This migration renames the table and updates all foreign key references

-- 1. Rename the table
ALTER TABLE IF EXISTS seo_projects RENAME TO projects;

-- 2. Rename url column to domain (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'url'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'domain'
  ) THEN
    ALTER TABLE projects RENAME COLUMN url TO domain;
    RAISE NOTICE 'Renamed url column to domain';
  END IF;
END $$;

-- 3. Add new columns for GSC connection tracking and plan management
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS gsc_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';

-- 4. Update foreign key constraints in related tables
-- These tables reference seo_projects(id), we need to update them

-- Update llm_citations table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name LIKE '%llm_citations%project%'
    AND table_name = 'llm_citations'
  ) THEN
    ALTER TABLE llm_citations DROP CONSTRAINT IF EXISTS llm_citations_project_id_fkey;
    ALTER TABLE llm_citations 
    ADD CONSTRAINT llm_citations_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update llm_tracking_queries table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'llm_tracking_queries'
  ) THEN
    ALTER TABLE llm_tracking_queries DROP CONSTRAINT IF EXISTS llm_tracking_queries_project_id_fkey;
    ALTER TABLE llm_tracking_queries 
    ADD CONSTRAINT llm_tracking_queries_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update llm_citation_history table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'llm_citation_history'
  ) THEN
    ALTER TABLE llm_citation_history DROP CONSTRAINT IF EXISTS llm_citation_history_project_id_fkey;
    ALTER TABLE llm_citation_history 
    ADD CONSTRAINT llm_citation_history_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update llm_competitors table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'llm_competitors'
  ) THEN
    ALTER TABLE llm_competitors DROP CONSTRAINT IF EXISTS llm_competitors_project_id_fkey;
    ALTER TABLE llm_competitors 
    ADD CONSTRAINT llm_competitors_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update ai_overview_rankings table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'ai_overview_rankings'
  ) THEN
    ALTER TABLE ai_overview_rankings DROP CONSTRAINT IF EXISTS ai_overview_rankings_project_id_fkey;
    ALTER TABLE ai_overview_rankings 
    ADD CONSTRAINT ai_overview_rankings_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update credits_ledger table if it has project_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'credits_ledger' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE credits_ledger DROP CONSTRAINT IF EXISTS credits_ledger_project_id_fkey;
    ALTER TABLE credits_ledger 
    ADD CONSTRAINT credits_ledger_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update user_subscriptions table if it has project_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_project_id_fkey;
    ALTER TABLE user_subscriptions 
    ADD CONSTRAINT user_subscriptions_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. Update RLS policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Create new policies
CREATE POLICY "Users can view own projects" 
ON projects FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" 
ON projects FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" 
ON projects FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" 
ON projects FOR DELETE 
USING (auth.uid() = user_id);

-- 6. Update indexes
DROP INDEX IF EXISTS idx_seo_projects_user_id;
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_gsc_connected ON projects(gsc_connected);
CREATE INDEX IF NOT EXISTS idx_projects_plan ON projects(plan);

-- 7. Add comments
COMMENT ON TABLE projects IS 'User projects with domain tracking and GSC integration';
COMMENT ON COLUMN projects.gsc_connected IS 'Whether Google Search Console is connected for this project';
COMMENT ON COLUMN projects.plan IS 'Subscription plan level for this project (free, starter, pro, etc.)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully renamed seo_projects to projects table';
END $$;

