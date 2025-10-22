-- Fix 1: Create missing api_keys table with proper RLS
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('dataforseo', 'firecrawl', 'google', 'openai', 'anthropic', 'ahrefs', 'semrush', 'moz', 'custom')),
  key_name TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, key_name)
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own API keys"
  ON public.api_keys
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix 2: Convert materialized view to regular view with automatic RLS
DROP MATERIALIZED VIEW IF EXISTS public.high_potential_keywords;

CREATE OR REPLACE VIEW public.high_potential_keywords AS
SELECT 
  kt.id,
  kt.project_id,
  kt.keyword,
  kt.search_volume,
  kt.difficulty,
  kt.cpc,
  p.user_id,
  (kt.search_volume::NUMERIC / NULLIF(kt.difficulty, 0)) as opportunity_score
FROM keyword_tracking kt
INNER JOIN seo_projects p ON kt.project_id = p.id
WHERE kt.search_volume > 0
  AND p.user_id = auth.uid()
ORDER BY opportunity_score DESC;

-- Fix 3: Fix existing database functions by adding search_path
CREATE OR REPLACE FUNCTION public.check_user_credits(p_user_id UUID, p_required_credits INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(credits, 0) >= p_required_credits
  FROM profiles
  WHERE id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_project_stats(p_project_id UUID)
RETURNS TABLE(
  total_keywords INTEGER,
  avg_position NUMERIC,
  total_clicks INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    COUNT(*)::INTEGER as total_keywords,
    0::NUMERIC as avg_position,
    0::INTEGER as total_clicks
  FROM keyword_tracking
  WHERE project_id = p_project_id;
$$;

CREATE OR REPLACE FUNCTION public.get_high_opportunity_keywords(p_project_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  keyword TEXT,
  search_volume INTEGER,
  difficulty INTEGER,
  opportunity_score NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    keyword,
    search_volume,
    difficulty,
    (search_volume::NUMERIC / NULLIF(difficulty, 0)) as opportunity_score
  FROM keyword_tracking
  WHERE project_id = p_project_id
    AND search_volume > 0
  ORDER BY opportunity_score DESC
  LIMIT p_limit;
$$;