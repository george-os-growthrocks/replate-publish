/*
  # Content Optimizer Engine (Surfer-Style)
  
  Creates tables and functions for advanced content optimization using:
  - BM25 and TF-IDF based term extraction
  - Semantic keyword clustering
  - Content scoring algorithms
  - SERP content analysis
  
  ## Tables Created
  
  1. content_analyses - Analysis sessions
  2. term_frequency - TF-IDF calculations per page
  3. content_scores - Multi-dimensional content scoring
  4. content_recommendations - AI-generated suggestions
  5. serp_content_analysis - Top 10 SERP content breakdown
  6. keyword_clusters - Semantic grouping of keywords
  
  ## Functions
  
  - calculate_tf_idf() - TF-IDF scoring
  - calculate_bm25() - BM25 relevance scoring
  - calculate_content_score() - Overall content quality
  - extract_keywords() - Keyword extraction from text
*/

-- =============================================================================
-- CONTENT ANALYSIS TABLES
-- =============================================================================

-- Content Analysis Sessions
CREATE TABLE IF NOT EXISTS public.content_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  target_keyword TEXT NOT NULL,
  target_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'completed', 'failed')),
  serp_analyzed_count INTEGER DEFAULT 0,
  total_terms_extracted INTEGER DEFAULT 0,
  optimization_score NUMERIC(5,2),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.content_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage content analyses for their projects"
  ON public.content_analyses FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = content_analyses.project_id
    AND seo_projects.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = content_analyses.project_id
    AND seo_projects.user_id = auth.uid()
  ));

-- Term Frequency (for TF-IDF calculations)
CREATE TABLE IF NOT EXISTS public.term_frequency (
  id BIGSERIAL PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES public.content_analyses(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  source_position INTEGER,
  term TEXT NOT NULL,
  term_frequency NUMERIC(10,6) NOT NULL,
  document_frequency INTEGER DEFAULT 1,
  tf_idf_score NUMERIC(10,6),
  bm25_score NUMERIC(10,6),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.term_frequency ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view term frequency for their analyses"
  ON public.term_frequency FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.content_analyses
    JOIN public.seo_projects ON seo_projects.id = content_analyses.project_id
    WHERE content_analyses.id = term_frequency.analysis_id
    AND seo_projects.user_id = auth.uid()
  ));

-- Content Scores (Multi-dimensional scoring)
CREATE TABLE IF NOT EXISTS public.content_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.content_analyses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  readability_score NUMERIC(5,2),
  keyword_density NUMERIC(5,4),
  heading_score NUMERIC(5,2),
  content_structure_score NUMERIC(5,2),
  link_score NUMERIC(5,2),
  image_score NUMERIC(5,2),
  overall_score NUMERIC(5,2),
  recommendations JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_analysis_url UNIQUE(analysis_id, url)
);

ALTER TABLE public.content_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view content scores for their analyses"
  ON public.content_scores FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.content_analyses
    JOIN public.seo_projects ON seo_projects.id = content_analyses.project_id
    WHERE content_analyses.id = content_scores.analysis_id
    AND seo_projects.user_id = auth.uid()
  ));

-- Content Recommendations
CREATE TABLE IF NOT EXISTS public.content_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.content_analyses(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('keywords', 'structure', 'readability', 'links', 'meta', 'images')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  suggested_terms JSONB,
  impact_score NUMERIC(5,2),
  effort_level TEXT CHECK (effort_level IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.content_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage content recommendations"
  ON public.content_recommendations FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.content_analyses
    JOIN public.seo_projects ON seo_projects.id = content_analyses.project_id
    WHERE content_analyses.id = content_recommendations.analysis_id
    AND seo_projects.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.content_analyses
    JOIN public.seo_projects ON seo_projects.id = content_analyses.project_id
    WHERE content_analyses.id = content_recommendations.analysis_id
    AND seo_projects.user_id = auth.uid()
  ));

-- SERP Content Analysis
CREATE TABLE IF NOT EXISTS public.serp_content_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.content_analyses(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 100),
  url TEXT NOT NULL,
  title TEXT,
  meta_description TEXT,
  word_count INTEGER,
  heading_count INTEGER,
  image_count INTEGER,
  internal_links INTEGER,
  external_links INTEGER,
  content_structure JSONB,
  raw_content TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_analysis_position UNIQUE(analysis_id, position)
);

ALTER TABLE public.serp_content_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view SERP content analyses"
  ON public.serp_content_analysis FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.content_analyses
    JOIN public.seo_projects ON seo_projects.id = content_analyses.project_id
    WHERE content_analyses.id = serp_content_analysis.analysis_id
    AND seo_projects.user_id = auth.uid()
  ));

-- Keyword Clusters (Semantic Grouping)
CREATE TABLE IF NOT EXISTS public.keyword_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  cluster_name TEXT NOT NULL,
  primary_keyword TEXT NOT NULL,
  related_keywords JSONB NOT NULL,
  search_volume INTEGER,
  avg_difficulty NUMERIC(5,2),
  content_pillar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.keyword_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage keyword clusters for their projects"
  ON public.keyword_clusters FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = keyword_clusters.project_id
    AND seo_projects.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = keyword_clusters.project_id
    AND seo_projects.user_id = auth.uid()
  ));

-- =============================================================================
-- MATHEMATICAL SCORING FUNCTIONS
-- =============================================================================

-- Calculate TF-IDF Score
CREATE OR REPLACE FUNCTION calculate_tf_idf(
  p_term_frequency NUMERIC,
  p_document_frequency INTEGER,
  p_total_documents INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
  idf NUMERIC;
  tf_idf NUMERIC;
BEGIN
  -- IDF = log(total_documents / document_frequency)
  IF p_document_frequency > 0 AND p_total_documents > 0 THEN
    idf := LOG(p_total_documents::NUMERIC / p_document_frequency::NUMERIC);
    tf_idf := p_term_frequency * idf;
    RETURN ROUND(tf_idf, 6);
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate BM25 Score
CREATE OR REPLACE FUNCTION calculate_bm25(
  p_term_frequency NUMERIC,
  p_document_length INTEGER,
  p_avg_document_length NUMERIC,
  p_document_frequency INTEGER,
  p_total_documents INTEGER,
  p_k1 NUMERIC DEFAULT 1.5,
  p_b NUMERIC DEFAULT 0.75
)
RETURNS NUMERIC AS $$
DECLARE
  idf NUMERIC;
  normalized_tf NUMERIC;
  bm25 NUMERIC;
BEGIN
  -- IDF component
  IF p_document_frequency > 0 AND p_total_documents > 0 THEN
    idf := LOG((p_total_documents - p_document_frequency + 0.5) / (p_document_frequency + 0.5) + 1);
    
    -- TF component with length normalization
    normalized_tf := (p_term_frequency * (p_k1 + 1)) / 
                     (p_term_frequency + p_k1 * (1 - p_b + p_b * (p_document_length / p_avg_document_length)));
    
    bm25 := idf * normalized_tf;
    RETURN ROUND(bm25, 6);
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate Overall Content Score
CREATE OR REPLACE FUNCTION calculate_content_score(
  p_word_count INTEGER,
  p_readability NUMERIC,
  p_keyword_density NUMERIC,
  p_heading_score NUMERIC,
  p_structure_score NUMERIC,
  p_link_score NUMERIC,
  p_image_score NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
  word_count_score NUMERIC := 0;
  readability_normalized NUMERIC := 0;
  keyword_normalized NUMERIC := 0;
  total_score NUMERIC := 0;
BEGIN
  -- Word count scoring (0-20 points)
  word_count_score := LEAST(20, (p_word_count::NUMERIC / 2000) * 20);
  
  -- Readability (already 0-100, normalize to 0-15)
  readability_normalized := (COALESCE(p_readability, 50) / 100) * 15;
  
  -- Keyword density (optimal 1-3%, score 0-10)
  IF p_keyword_density BETWEEN 0.01 AND 0.03 THEN
    keyword_normalized := 10;
  ELSIF p_keyword_density BETWEEN 0.005 AND 0.05 THEN
    keyword_normalized := 7;
  ELSE
    keyword_normalized := 3;
  END IF;
  
  -- Sum all components
  total_score := word_count_score + 
                 readability_normalized + 
                 keyword_normalized +
                 COALESCE(p_heading_score, 0) * 0.15 + -- max 15 points
                 COALESCE(p_structure_score, 0) * 0.15 + -- max 15 points
                 COALESCE(p_link_score, 0) * 0.1 + -- max 10 points
                 COALESCE(p_image_score, 0) * 0.15; -- max 15 points
  
  RETURN LEAST(100, ROUND(total_score, 2));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Extract Top Keywords from Text (simplified version)
CREATE OR REPLACE FUNCTION extract_keywords(p_text TEXT, p_limit INTEGER DEFAULT 20)
RETURNS TABLE(keyword TEXT, frequency INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH words AS (
    SELECT 
      LOWER(word) AS keyword,
      COUNT(*) AS freq
    FROM regexp_split_to_table(p_text, '\s+') AS word
    WHERE LENGTH(word) > 3
    AND word !~ '^[0-9]+$'
    AND word NOT IN ('that', 'this', 'with', 'from', 'have', 'been', 'will', 'your', 'their')
    GROUP BY LOWER(word)
  )
  SELECT 
    words.keyword,
    words.freq::INTEGER
  FROM words
  ORDER BY freq DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update TF-IDF scores in batch
CREATE OR REPLACE FUNCTION update_tf_idf_scores(p_analysis_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_docs INTEGER;
  updated_count INTEGER := 0;
BEGIN
  -- Get total document count
  SELECT COUNT(DISTINCT source_url)
  INTO total_docs
  FROM public.term_frequency
  WHERE analysis_id = p_analysis_id;
  
  -- Update TF-IDF scores
  UPDATE public.term_frequency
  SET tf_idf_score = calculate_tf_idf(
    term_frequency,
    document_frequency,
    total_docs
  )
  WHERE analysis_id = p_analysis_id;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Content Analyses
CREATE INDEX IF NOT EXISTS idx_content_analyses_project_id ON public.content_analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_content_analyses_status ON public.content_analyses(status);
CREATE INDEX IF NOT EXISTS idx_content_analyses_target_keyword ON public.content_analyses(target_keyword);
CREATE INDEX IF NOT EXISTS idx_content_analyses_created_at ON public.content_analyses(created_at DESC);

-- Term Frequency
CREATE INDEX IF NOT EXISTS idx_term_frequency_analysis_id ON public.term_frequency(analysis_id);
CREATE INDEX IF NOT EXISTS idx_term_frequency_term ON public.term_frequency(term);
CREATE INDEX IF NOT EXISTS idx_term_frequency_tf_idf ON public.term_frequency(tf_idf_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_term_frequency_bm25 ON public.term_frequency(bm25_score DESC NULLS LAST);

-- Content Scores
CREATE INDEX IF NOT EXISTS idx_content_scores_analysis_id ON public.content_scores(analysis_id);
CREATE INDEX IF NOT EXISTS idx_content_scores_overall ON public.content_scores(overall_score DESC NULLS LAST);

-- Content Recommendations
CREATE INDEX IF NOT EXISTS idx_content_recommendations_analysis_id ON public.content_recommendations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_content_recommendations_priority ON public.content_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_content_recommendations_status ON public.content_recommendations(status);

-- SERP Content Analysis
CREATE INDEX IF NOT EXISTS idx_serp_content_analysis_id ON public.serp_content_analysis(analysis_id);
CREATE INDEX IF NOT EXISTS idx_serp_content_position ON public.serp_content_analysis(position);

-- Keyword Clusters
CREATE INDEX IF NOT EXISTS idx_keyword_clusters_project_id ON public.keyword_clusters(project_id);
CREATE INDEX IF NOT EXISTS idx_keyword_clusters_primary ON public.keyword_clusters(primary_keyword);
CREATE INDEX IF NOT EXISTS idx_keyword_clusters_volume ON public.keyword_clusters(search_volume DESC NULLS LAST);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_content_analyses_updated_at
  BEFORE UPDATE ON public.content_analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keyword_clusters_updated_at
  BEFORE UPDATE ON public.keyword_clusters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate content score on insert/update
CREATE OR REPLACE FUNCTION auto_calculate_content_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.overall_score := calculate_content_score(
    NEW.word_count,
    NEW.readability_score,
    NEW.keyword_density,
    NEW.heading_score,
    NEW.content_structure_score,
    NEW.link_score,
    NEW.image_score
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_content_score_on_change
  BEFORE INSERT OR UPDATE ON public.content_scores
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_content_score();
