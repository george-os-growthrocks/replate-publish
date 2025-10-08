-- Enable pgvector extension for embeddings (Gemini uses 768-dim vectors)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns to keywords table (768 dimensions for Gemini)
ALTER TABLE keyword_tracking 
ADD COLUMN IF NOT EXISTS embedding vector(768),
ADD COLUMN IF NOT EXISTS embedding_model text DEFAULT 'gemini-embedding-001',
ADD COLUMN IF NOT EXISTS embedding_updated_at timestamp with time zone;

-- Add embedding columns to pages table for internal linking
ALTER TABLE internal_linking_pages
ADD COLUMN IF NOT EXISTS embedding vector(768),
ADD COLUMN IF NOT EXISTS page_title text,
ADD COLUMN IF NOT EXISTS page_content text,
ADD COLUMN IF NOT EXISTS h1_tags text[],
ADD COLUMN IF NOT EXISTS h2_tags text[],
ADD COLUMN IF NOT EXISTS entities jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS embedding_model text DEFAULT 'gemini-embedding-001',
ADD COLUMN IF NOT EXISTS embedding_updated_at timestamp with time zone;

-- Create index for vector similarity search on keywords
CREATE INDEX IF NOT EXISTS idx_keyword_tracking_embedding 
ON keyword_tracking USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for vector similarity search on pages
CREATE INDEX IF NOT EXISTS idx_internal_linking_pages_embedding
ON internal_linking_pages USING ivfflat (embedding vector_cosine_ops)  
WITH (lists = 100);

-- Add cluster cohesion score to keyword_clusters
ALTER TABLE keyword_clusters
ADD COLUMN IF NOT EXISTS cohesion_score numeric,
ADD COLUMN IF NOT EXISTS avg_embedding vector(768),
ADD COLUMN IF NOT EXISTS topic_strength numeric;

-- Enhance internal_linking_opportunities with semantic scores
ALTER TABLE internal_linking_opportunities
ADD COLUMN IF NOT EXISTS semantic_score numeric,
ADD COLUMN IF NOT EXISTS context_snippet text,
ADD COLUMN IF NOT EXISTS confidence_level text CHECK (confidence_level IN ('high', 'medium', 'low'));

-- Create function to calculate cosine similarity
CREATE OR REPLACE FUNCTION cosine_similarity(a vector, b vector)
RETURNS float
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN 1 - (a <=> b);
END;
$$;

-- Create materialized view for high-potential keywords
CREATE MATERIALIZED VIEW IF NOT EXISTS high_potential_keywords AS
SELECT 
  kt.id,
  kt.keyword,
  kt.project_id,
  kt.search_volume,
  kt.difficulty,
  kt.cpc,
  kt.search_intent,
  ka.potential_score as opportunity_score,
  ka.difficulty_score,
  kt.embedding,
  CASE 
    WHEN kt.difficulty < 30 AND kt.search_volume > 1000 THEN 'high'
    WHEN kt.difficulty < 50 AND kt.search_volume > 500 THEN 'medium'
    ELSE 'low'
  END as opportunity_level,
  kt.created_at
FROM keyword_tracking kt
LEFT JOIN keyword_analysis ka ON ka.keyword = kt.keyword AND ka.project_id = kt.project_id
WHERE ka.potential_score > 60 OR (kt.difficulty < 40 AND kt.search_volume > 500);

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_high_potential_keywords_project 
ON high_potential_keywords(project_id, opportunity_level);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_high_potential_keywords()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY high_potential_keywords;
END;
$$;