-- LLM CITATION TRACKING SYSTEM
-- Track if your domain appears in ChatGPT, Claude, Gemini, Perplexity responses

-- Create seo_projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS seo_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_seo_projects_user;
CREATE INDEX idx_seo_projects_user ON seo_projects(user_id);

-- Main tracking table
CREATE TABLE IF NOT EXISTS llm_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  query TEXT NOT NULL,
  llm_model TEXT NOT NULL CHECK (llm_model IN ('chatgpt', 'claude', 'gemini', 'perplexity')),
  is_cited BOOLEAN DEFAULT false,
  citation_position INTEGER, -- Position in response (1=first mentioned)
  citation_context TEXT, -- The sentence where domain was mentioned
  full_response TEXT, -- Complete LLM response
  response_quality_score INTEGER CHECK (response_quality_score BETWEEN 1 AND 100),
  competitors_cited TEXT[], -- Other domains mentioned
  tracked_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, query, llm_model, tracked_date)
);

-- Query templates for tracking
CREATE TABLE IF NOT EXISTS llm_tracking_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE,
  query_template TEXT NOT NULL,
  category TEXT, -- 'product', 'how-to', 'comparison', 'review', etc.
  target_keywords TEXT[],
  is_active BOOLEAN DEFAULT true,
  tracking_frequency TEXT DEFAULT 'daily' CHECK (tracking_frequency IN ('daily', 'weekly', 'monthly')),
  last_tracked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historical trends (daily aggregates)
CREATE TABLE IF NOT EXISTS llm_citation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE,
  llm_model TEXT NOT NULL CHECK (llm_model IN ('chatgpt', 'claude', 'gemini', 'perplexity')),
  total_queries_tracked INTEGER DEFAULT 0,
  total_citations INTEGER DEFAULT 0,
  citation_rate DECIMAL(5,2), -- Percentage
  avg_position DECIMAL(5,2),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, llm_model, date)
);

-- Competitor tracking
CREATE TABLE IF NOT EXISTS llm_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE,
  competitor_domain TEXT NOT NULL,
  total_mentions INTEGER DEFAULT 0,
  avg_position DECIMAL(5,2),
  queries_mentioned TEXT[],
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, competitor_domain)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_llm_citations_project ON llm_citations(project_id);
CREATE INDEX IF NOT EXISTS idx_llm_citations_date ON llm_citations(tracked_date);
CREATE INDEX IF NOT EXISTS idx_llm_citations_model ON llm_citations(llm_model);
CREATE INDEX IF NOT EXISTS idx_llm_citations_cited ON llm_citations(is_cited);

CREATE INDEX IF NOT EXISTS idx_llm_tracking_queries_project ON llm_tracking_queries(project_id);
CREATE INDEX IF NOT EXISTS idx_llm_tracking_queries_active ON llm_tracking_queries(is_active);

CREATE INDEX IF NOT EXISTS idx_llm_citation_history_project ON llm_citation_history(project_id);
CREATE INDEX IF NOT EXISTS idx_llm_citation_history_date ON llm_citation_history(date);

CREATE INDEX IF NOT EXISTS idx_llm_competitors_project ON llm_competitors(project_id);

-- RLS Policies
ALTER TABLE llm_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_tracking_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_citation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_competitors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own llm_citations" ON llm_citations;
DROP POLICY IF EXISTS "Users can insert their own llm_citations" ON llm_citations;
DROP POLICY IF EXISTS "Users can update their own llm_citations" ON llm_citations;
DROP POLICY IF EXISTS "Users can delete their own llm_citations" ON llm_citations;

DROP POLICY IF EXISTS "Users can view their own llm_tracking_queries" ON llm_tracking_queries;
DROP POLICY IF EXISTS "Users can insert their own llm_tracking_queries" ON llm_tracking_queries;
DROP POLICY IF EXISTS "Users can update their own llm_tracking_queries" ON llm_tracking_queries;
DROP POLICY IF EXISTS "Users can delete their own llm_tracking_queries" ON llm_tracking_queries;

DROP POLICY IF EXISTS "Users can view their own llm_citation_history" ON llm_citation_history;
DROP POLICY IF EXISTS "Users can insert their own llm_citation_history" ON llm_citation_history;

DROP POLICY IF EXISTS "Users can view their own llm_competitors" ON llm_competitors;
DROP POLICY IF EXISTS "Users can insert their own llm_competitors" ON llm_competitors;
DROP POLICY IF EXISTS "Users can update their own llm_competitors" ON llm_competitors;

-- Create policies
CREATE POLICY "Users can view their own llm_citations" ON llm_citations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = llm_citations.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own llm_citations" ON llm_citations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = llm_citations.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own llm_citations" ON llm_citations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = llm_citations.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own llm_citations" ON llm_citations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = llm_citations.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

-- Tracking queries policies
CREATE POLICY "Users can view their own llm_tracking_queries" ON llm_tracking_queries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = llm_tracking_queries.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own llm_tracking_queries" ON llm_tracking_queries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = llm_tracking_queries.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own llm_tracking_queries" ON llm_tracking_queries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = llm_tracking_queries.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own llm_tracking_queries" ON llm_tracking_queries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = llm_tracking_queries.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

-- History policies
CREATE POLICY "Users can view their own llm_citation_history" ON llm_citation_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = llm_citation_history.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own llm_citation_history" ON llm_citation_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = llm_citation_history.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

-- Competitors policies
CREATE POLICY "Users can view their own llm_competitors" ON llm_competitors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = llm_competitors.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own llm_competitors" ON llm_competitors
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = llm_competitors.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own llm_competitors" ON llm_competitors
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = llm_competitors.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

-- Function to update competitor stats
CREATE OR REPLACE FUNCTION update_llm_competitor_stats()
RETURNS TRIGGER AS $$
DECLARE
  competitor TEXT;
BEGIN
  -- Update or insert competitor stats when citation is added
  IF NEW.competitors_cited IS NOT NULL AND array_length(NEW.competitors_cited, 1) > 0 THEN
    FOREACH competitor IN ARRAY NEW.competitors_cited
    LOOP
      INSERT INTO llm_competitors (project_id, competitor_domain, total_mentions, queries_mentioned, last_seen)
      VALUES (NEW.project_id, competitor, 1, ARRAY[NEW.query], NOW())
      ON CONFLICT (project_id, competitor_domain)
      DO UPDATE SET
        total_mentions = llm_competitors.total_mentions + 1,
        queries_mentioned = array_append(llm_competitors.queries_mentioned, NEW.query),
        last_seen = NOW();
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update competitor stats
DROP TRIGGER IF EXISTS update_competitor_stats_trigger ON llm_citations;
CREATE TRIGGER update_competitor_stats_trigger
  AFTER INSERT ON llm_citations
  FOR EACH ROW
  EXECUTE FUNCTION update_llm_competitor_stats();

-- Seed some default query templates
INSERT INTO llm_tracking_queries (project_id, query_template, category, is_active)
SELECT 
  id as project_id,
  'What are the best SEO tools?',
  'product',
  false
FROM seo_projects
ON CONFLICT DO NOTHING;

