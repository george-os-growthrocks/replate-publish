-- Analysis History Table for tracking onboarding and manual analysis runs
-- This captures the first analysis during onboarding and subsequent analysis runs

CREATE TABLE IF NOT EXISTS public.analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_url TEXT NOT NULL,
  analysis_type TEXT NOT NULL DEFAULT 'onboarding', -- 'onboarding', 'manual', 'scheduled'
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  
  -- GSC Data Summary
  total_clicks INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  avg_ctr DECIMAL(5,4) DEFAULT 0,
  avg_position DECIMAL(5,2) DEFAULT 0,
  total_queries INTEGER DEFAULT 0,
  total_pages INTEGER DEFAULT 0,
  
  -- Date range analyzed
  start_date DATE,
  end_date DATE,
  
  -- Detailed results (store raw data for later analysis)
  top_queries JSONB, -- Top 10 queries with clicks, impressions, ctr, position
  top_pages JSONB,   -- Top 10 pages with clicks, impressions, ctr, position
  opportunities JSONB, -- Quick wins: low-hanging fruit keywords
  
  -- Metadata
  error_message TEXT,
  duration_seconds INTEGER, -- How long the analysis took
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analysis_runs_user_id ON analysis_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_property ON analysis_runs(property_url);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_status ON analysis_runs(status);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_created_at ON analysis_runs(created_at DESC);

-- Enable RLS
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own analysis runs"
  ON public.analysis_runs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analysis runs"
  ON public.analysis_runs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analysis runs"
  ON public.analysis_runs
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analysis runs"
  ON public.analysis_runs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON analysis_runs TO authenticated;

-- Function to cleanup old analysis runs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_analysis_runs()
RETURNS void AS $$
BEGIN
  DELETE FROM analysis_runs
  WHERE created_at < NOW() - INTERVAL '30 days'
  AND status IN ('completed', 'failed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
