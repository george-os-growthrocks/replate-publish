/*
  # Internal Linking AI System with pgvector
  
  Creates tables and functions for intelligent internal linking recommendations using:
  - Page embeddings for semantic similarity
  - PageRank-like authority flow calculations
  - Opportunity scoring based on GSC data
  - Anchor text recommendations
  
  ## Prerequisites
  - pgvector extension must be enabled
  
  ## Tables Created
  
  1. page_embeddings - Vector embeddings for semantic search
  2. page_authority - Authority scores (PageRank-like)
  3. internal_link_opportunities - Calculated linking suggestions
  4. anchor_suggestions - Contextual anchor text recommendations
  5. link_audits - Internal link health checks
  
  ## Functions
  
  - calculate_page_authority() - PageRank-like scoring
  - find_similar_pages() - Cosine similarity search
  - calculate_link_opportunity_score() - Opportunity scoring
  - generate_anchor_suggestions() - Anchor text generation
*/

-- =============================================================================
-- ENABLE PGVECTOR EXTENSION
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- PAGE EMBEDDINGS & SIMILARITY
-- =============================================================================

-- Page Embeddings (using vector type for semantic search)
CREATE TABLE IF NOT EXISTS public.page_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  page_id BIGINT NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 or similar (1536 dimensions)
  embedding_model TEXT DEFAULT 'text-embedding-ada-002',
  content_hash TEXT,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_page_embedding UNIQUE(page_id)
);

ALTER TABLE public.page_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view embeddings for their project pages"
  ON public.page_embeddings FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = page_embeddings.project_id
    AND seo_projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage embeddings for their project pages"
  ON public.page_embeddings FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = page_embeddings.project_id
    AND seo_projects.user_id = auth.uid()
  ));

-- Page Authority Scores (PageRank-like)
CREATE TABLE IF NOT EXISTS public.page_authority (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  page_id BIGINT NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  authority_score NUMERIC(10,6) DEFAULT 0,
  inbound_links INTEGER DEFAULT 0,
  outbound_links INTEGER DEFAULT 0,
  gsc_impressions INTEGER DEFAULT 0,
  gsc_clicks INTEGER DEFAULT 0,
  gsc_avg_position NUMERIC(5,2),
  composite_score NUMERIC(10,6),
  last_calculated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_page_authority UNIQUE(page_id)
);

ALTER TABLE public.page_authority ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view page authority for their projects"
  ON public.page_authority FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = page_authority.project_id
    AND seo_projects.user_id = auth.uid()
  ));

-- Internal Link Opportunities
CREATE TABLE IF NOT EXISTS public.internal_link_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  source_page_id BIGINT NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  target_page_id BIGINT NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  opportunity_score NUMERIC(10,6),
  semantic_similarity NUMERIC(5,4),
  authority_transfer NUMERIC(10,6),
  traffic_potential INTEGER,
  reasoning TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'implemented', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.internal_link_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage link opportunities for their projects"
  ON public.internal_link_opportunities FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = internal_link_opportunities.project_id
    AND seo_projects.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = internal_link_opportunities.project_id
    AND seo_projects.user_id = auth.uid()
  ));

-- Anchor Suggestions
CREATE TABLE IF NOT EXISTS public.anchor_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.internal_link_opportunities(id) ON DELETE CASCADE,
  anchor_text TEXT NOT NULL,
  context TEXT,
  relevance_score NUMERIC(5,4),
  keyword_match TEXT,
  placement_paragraph INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.anchor_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view anchor suggestions for their opportunities"
  ON public.anchor_suggestions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.internal_link_opportunities
    JOIN public.seo_projects ON seo_projects.id = internal_link_opportunities.project_id
    WHERE internal_link_opportunities.id = anchor_suggestions.opportunity_id
    AND seo_projects.user_id = auth.uid()
  ));

-- Link Audits (Health Checks)
CREATE TABLE IF NOT EXISTS public.link_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  audit_type TEXT CHECK (audit_type IN ('orphan_pages', 'broken_links', 'over_optimized', 'thin_content')),
  page_id BIGINT REFERENCES public.pages(id) ON DELETE CASCADE,
  url TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  issue_description TEXT NOT NULL,
  recommendation TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'fixed', 'ignored')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.link_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage link audits for their projects"
  ON public.link_audits FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = link_audits.project_id
    AND seo_projects.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = link_audits.project_id
    AND seo_projects.user_id = auth.uid()
  ));

-- =============================================================================
-- AUTHORITY & SIMILARITY FUNCTIONS
-- =============================================================================

-- Calculate PageRank-like Authority Score
CREATE OR REPLACE FUNCTION calculate_page_authority(
  p_project_id UUID,
  p_damping_factor NUMERIC DEFAULT 0.85,
  p_iterations INTEGER DEFAULT 20
)
RETURNS INTEGER AS $$
DECLARE
  iteration INTEGER := 0;
  page_count INTEGER;
  affected_rows INTEGER := 0;
BEGIN
  -- Get total page count
  SELECT COUNT(*) INTO page_count
  FROM public.pages
  WHERE project_id = p_project_id;
  
  IF page_count = 0 THEN
    RETURN 0;
  END IF;
  
  -- Initialize all pages with equal authority
  INSERT INTO public.page_authority (project_id, page_id, url, authority_score)
  SELECT 
    p.project_id,
    p.id,
    p.url,
    1.0 / page_count
  FROM public.pages p
  WHERE p.project_id = p_project_id
  ON CONFLICT (page_id) 
  DO UPDATE SET authority_score = 1.0 / page_count;
  
  -- Iterative authority calculation (simplified PageRank)
  FOR iteration IN 1..p_iterations LOOP
    WITH link_contributions AS (
      SELECT 
        l.dst_url,
        SUM(pa.authority_score / NULLIF(pa.outbound_links, 0)) AS contribution
      FROM public.links l
      JOIN public.page_authority pa ON pa.page_id = l.src_page_id
      WHERE l.project_id = p_project_id
      AND l.link_type IN ('internal', 'dofollow')
      GROUP BY l.dst_url
    )
    UPDATE public.page_authority pa
    SET authority_score = (1 - p_damping_factor) / page_count + 
                          p_damping_factor * COALESCE(lc.contribution, 0)
    FROM link_contributions lc
    WHERE pa.url = lc.dst_url
    AND pa.project_id = p_project_id;
  END LOOP;
  
  -- Update composite scores incorporating GSC data
  UPDATE public.page_authority pa
  SET composite_score = (
    pa.authority_score * 0.4 +
    (COALESCE(pa.gsc_impressions, 0)::NUMERIC / NULLIF((SELECT MAX(gsc_impressions) FROM public.page_authority WHERE project_id = p_project_id), 0)) * 0.3 +
    (COALESCE(pa.gsc_clicks, 0)::NUMERIC / NULLIF((SELECT MAX(gsc_clicks) FROM public.page_authority WHERE project_id = p_project_id), 0)) * 0.3
  )
  WHERE pa.project_id = p_project_id;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- Find Similar Pages Using Cosine Similarity
CREATE OR REPLACE FUNCTION find_similar_pages(
  p_page_id BIGINT,
  p_limit INTEGER DEFAULT 10,
  p_min_similarity NUMERIC DEFAULT 0.5
)
RETURNS TABLE(
  similar_page_id BIGINT,
  similar_url TEXT,
  similarity_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe2.page_id,
    pe2.url,
    ROUND((1 - (pe1.embedding <=> pe2.embedding))::NUMERIC, 4) AS similarity
  FROM public.page_embeddings pe1
  CROSS JOIN public.page_embeddings pe2
  WHERE pe1.page_id = p_page_id
  AND pe2.page_id != p_page_id
  AND pe1.project_id = pe2.project_id
  AND (1 - (pe1.embedding <=> pe2.embedding)) >= p_min_similarity
  ORDER BY pe1.embedding <=> pe2.embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Calculate Link Opportunity Score
CREATE OR REPLACE FUNCTION calculate_link_opportunity_score(
  p_semantic_similarity NUMERIC,
  p_source_authority NUMERIC,
  p_target_impressions INTEGER,
  p_target_position NUMERIC,
  p_existing_links INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
  similarity_weight NUMERIC := 0.3;
  authority_weight NUMERIC := 0.25;
  traffic_weight NUMERIC := 0.25;
  position_weight NUMERIC := 0.2;
  opportunity_score NUMERIC;
BEGIN
  -- Calculate weighted opportunity score
  opportunity_score := (
    p_semantic_similarity * similarity_weight +
    LEAST(p_source_authority, 1.0) * authority_weight +
    (LEAST(p_target_impressions, 10000)::NUMERIC / 10000) * traffic_weight +
    (CASE 
      WHEN p_target_position BETWEEN 11 AND 20 THEN 1.0
      WHEN p_target_position BETWEEN 21 AND 50 THEN 0.7
      WHEN p_target_position > 50 THEN 0.4
      ELSE 0.3
    END) * position_weight
  ) * 100;
  
  -- Penalty for existing links (diminishing returns)
  IF p_existing_links > 0 THEN
    opportunity_score := opportunity_score * (1 / (1 + p_existing_links * 0.2));
  END IF;
  
  RETURN ROUND(opportunity_score, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Generate Internal Link Opportunities for Project
CREATE OR REPLACE FUNCTION generate_link_opportunities(
  p_project_id UUID,
  p_min_score NUMERIC DEFAULT 50.0
)
RETURNS INTEGER AS $$
DECLARE
  opportunity_count INTEGER := 0;
BEGIN
  -- Delete old opportunities
  DELETE FROM public.internal_link_opportunities
  WHERE project_id = p_project_id
  AND status = 'pending';
  
  -- Generate new opportunities based on semantic similarity and authority
  INSERT INTO public.internal_link_opportunities (
    project_id,
    source_page_id,
    target_page_id,
    source_url,
    target_url,
    semantic_similarity,
    authority_transfer,
    traffic_potential,
    opportunity_score,
    reasoning
  )
  SELECT 
    p_project_id,
    pe1.page_id AS source_page_id,
    pe2.page_id AS target_page_id,
    pe1.url AS source_url,
    pe2.url AS target_url,
    ROUND((1 - (pe1.embedding <=> pe2.embedding))::NUMERIC, 4) AS semantic_similarity,
    COALESCE(pa1.composite_score, 0) AS authority_transfer,
    COALESCE(pa2.gsc_impressions, 0) AS traffic_potential,
    calculate_link_opportunity_score(
      ROUND((1 - (pe1.embedding <=> pe2.embedding))::NUMERIC, 4),
      COALESCE(pa1.composite_score, 0),
      COALESCE(pa2.gsc_impressions, 0),
      COALESCE(pa2.gsc_avg_position, 100),
      (SELECT COUNT(*) FROM public.links WHERE src_page_id = pe1.page_id AND dst_url = pe2.url)
    ) AS opportunity_score,
    CASE
      WHEN pa2.gsc_avg_position BETWEEN 11 AND 20 THEN 'Quick win: Page 2 ranking with high authority source'
      WHEN pa2.gsc_impressions > 1000 THEN 'High impression page needing authority boost'
      ELSE 'Topically relevant internal link opportunity'
    END AS reasoning
  FROM public.page_embeddings pe1
  CROSS JOIN public.page_embeddings pe2
  LEFT JOIN public.page_authority pa1 ON pa1.page_id = pe1.page_id
  LEFT JOIN public.page_authority pa2 ON pa2.page_id = pe2.page_id
  WHERE pe1.project_id = p_project_id
  AND pe2.project_id = p_project_id
  AND pe1.page_id != pe2.page_id
  AND (1 - (pe1.embedding <=> pe2.embedding)) >= 0.5
  AND NOT EXISTS (
    SELECT 1 FROM public.links l
    WHERE l.src_page_id = pe1.page_id
    AND l.dst_url = pe2.url
  )
  AND calculate_link_opportunity_score(
    ROUND((1 - (pe1.embedding <=> pe2.embedding))::NUMERIC, 4),
    COALESCE(pa1.composite_score, 0),
    COALESCE(pa2.gsc_impressions, 0),
    COALESCE(pa2.gsc_avg_position, 100),
    0
  ) >= p_min_score
  ORDER BY opportunity_score DESC
  LIMIT 1000;
  
  GET DIAGNOSTICS opportunity_count = ROW_COUNT;
  RETURN opportunity_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Page Embeddings with vector similarity index
CREATE INDEX IF NOT EXISTS idx_page_embeddings_project_id ON public.page_embeddings(project_id);
CREATE INDEX IF NOT EXISTS idx_page_embeddings_page_id ON public.page_embeddings(page_id);
CREATE INDEX IF NOT EXISTS idx_page_embeddings_embedding_cosine 
  ON public.page_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Page Authority
CREATE INDEX IF NOT EXISTS idx_page_authority_project_id ON public.page_authority(project_id);
CREATE INDEX IF NOT EXISTS idx_page_authority_page_id ON public.page_authority(page_id);
CREATE INDEX IF NOT EXISTS idx_page_authority_score ON public.page_authority(authority_score DESC);
CREATE INDEX IF NOT EXISTS idx_page_authority_composite ON public.page_authority(composite_score DESC NULLS LAST);

-- Internal Link Opportunities
CREATE INDEX IF NOT EXISTS idx_link_opportunities_project_id ON public.internal_link_opportunities(project_id);
CREATE INDEX IF NOT EXISTS idx_link_opportunities_source ON public.internal_link_opportunities(source_page_id);
CREATE INDEX IF NOT EXISTS idx_link_opportunities_target ON public.internal_link_opportunities(target_page_id);
CREATE INDEX IF NOT EXISTS idx_link_opportunities_score ON public.internal_link_opportunities(opportunity_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_link_opportunities_status ON public.internal_link_opportunities(status);

-- Anchor Suggestions
CREATE INDEX IF NOT EXISTS idx_anchor_suggestions_opportunity ON public.anchor_suggestions(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_anchor_suggestions_relevance ON public.anchor_suggestions(relevance_score DESC);

-- Link Audits
CREATE INDEX IF NOT EXISTS idx_link_audits_project_id ON public.link_audits(project_id);
CREATE INDEX IF NOT EXISTS idx_link_audits_type ON public.link_audits(audit_type);
CREATE INDEX IF NOT EXISTS idx_link_audits_severity ON public.link_audits(severity);
CREATE INDEX IF NOT EXISTS idx_link_audits_status ON public.link_audits(status);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_internal_link_opportunities_updated_at
  BEFORE UPDATE ON public.internal_link_opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
