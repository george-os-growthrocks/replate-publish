-- Answer The Public Queries Cache Table
-- Stores generated question wheels to avoid re-fetching

CREATE TABLE IF NOT EXISTS atp_queries_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_keyword TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '{}'::jsonb,
  prepositions JSONB NOT NULL DEFAULT '{}'::jsonb,
  comparisons TEXT[] DEFAULT ARRAY[]::TEXT[],
  alphabetical JSONB DEFAULT '{}'::jsonb,
  total_queries INTEGER DEFAULT 0,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint on seed keyword
  UNIQUE(seed_keyword)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_atp_seed_keyword ON atp_queries_cache(seed_keyword);
CREATE INDEX IF NOT EXISTS idx_atp_expires_at ON atp_queries_cache(expires_at);

-- RLS Policies (public read, no write needed from client)
ALTER TABLE atp_queries_cache ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage ATP cache"
  ON atp_queries_cache
  FOR ALL
  USING (auth.role() = 'service_role');

-- Allow authenticated users to read cache
CREATE POLICY "Authenticated users can read ATP cache"
  ON atp_queries_cache
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_atp_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_atp_cache_updated_at_trigger ON atp_queries_cache;
CREATE TRIGGER update_atp_cache_updated_at_trigger
  BEFORE UPDATE ON atp_queries_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_atp_cache_updated_at();

-- Grant permissions
GRANT SELECT ON atp_queries_cache TO authenticated;
GRANT ALL ON atp_queries_cache TO service_role;
