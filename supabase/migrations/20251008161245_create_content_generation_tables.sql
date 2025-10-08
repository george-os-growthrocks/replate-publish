/*
  # Content Generation & SEO Tools Tables
  
  1. New Tables
    - `alt_text_generations` - AI-generated alt text for images with WCAG compliance
    - `category_descriptions` - SEO-optimized category/PLP descriptions
    - `keyword_trending_analysis` - Keyword trend analysis with time series data
    - `content_generation_jobs` - Job queue for batch generation tasks
    
  2. Features
    - Multi-language support (BCP-47)
    - Brand voice and tone control
    - WCAG compliance tracking
    - Trend shape classification (linear, exponential, s-curve, damped)
    - CSV import/export support
    
  3. Security
    - Enable RLS on all tables
    - User-specific access policies
*/

-- Alt Text Generations Table
CREATE TABLE IF NOT EXISTS alt_text_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES seo_projects(id) ON DELETE CASCADE,
  image_id text NOT NULL,
  image_url text,
  filename text,
  alt_text text NOT NULL,
  language text DEFAULT 'en',
  tone text DEFAULT 'professional',
  keywords jsonb DEFAULT '[]'::jsonb,
  decorative boolean DEFAULT false,
  brand_rules text,
  char_count int DEFAULT 0,
  flags jsonb DEFAULT '{}'::jsonb,
  provider text DEFAULT 'gemini-vision',
  wcag_compliant boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alt_text_project ON alt_text_generations(project_id);
CREATE INDEX IF NOT EXISTS idx_alt_text_language ON alt_text_generations(language);

ALTER TABLE alt_text_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alt text generations"
  ON alt_text_generations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = alt_text_generations.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own alt text generations"
  ON alt_text_generations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = alt_text_generations.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own alt text generations"
  ON alt_text_generations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = alt_text_generations.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

-- Category Descriptions Table
CREATE TABLE IF NOT EXISTS category_descriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES seo_projects(id) ON DELETE CASCADE,
  category_name text NOT NULL,
  url text,
  hero_paragraph text,
  plp_footer text,
  meta_title text,
  meta_description text,
  internal_links jsonb DEFAULT '[]'::jsonb,
  keywords jsonb DEFAULT '[]'::jsonb,
  tone text DEFAULT 'professional',
  language text DEFAULT 'en',
  audience text,
  brand text,
  char_count_meta int DEFAULT 0,
  pixel_width_meta int DEFAULT 0,
  flags jsonb DEFAULT '{}'::jsonb,
  provider text DEFAULT 'gemini',
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_category_desc_project ON category_descriptions(project_id);
CREATE INDEX IF NOT EXISTS idx_category_desc_status ON category_descriptions(status);

ALTER TABLE category_descriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own category descriptions"
  ON category_descriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = category_descriptions.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own category descriptions"
  ON category_descriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = category_descriptions.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own category descriptions"
  ON category_descriptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = category_descriptions.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

-- Keyword Trending Analysis Table
CREATE TABLE IF NOT EXISTS keyword_trending_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES seo_projects(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  country text DEFAULT 'us',
  intents jsonb DEFAULT '[]'::jsonb,
  keyword_difficulty int,
  avg_volume int,
  growth_rate_pct decimal(10,2),
  time_series jsonb DEFAULT '[]'::jsonb,
  window_months int DEFAULT 3,
  trend_shape text,
  rmse decimal(10,4),
  r_squared decimal(5,4),
  branded boolean DEFAULT false,
  model_params jsonb DEFAULT '{}'::jsonb,
  analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trending_project ON keyword_trending_analysis(project_id);
CREATE INDEX IF NOT EXISTS idx_trending_keyword ON keyword_trending_analysis(keyword);
CREATE INDEX IF NOT EXISTS idx_trending_shape ON keyword_trending_analysis(trend_shape);
CREATE INDEX IF NOT EXISTS idx_trending_growth ON keyword_trending_analysis(growth_rate_pct);

ALTER TABLE keyword_trending_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own keyword trending"
  ON keyword_trending_analysis FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = keyword_trending_analysis.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own keyword trending"
  ON keyword_trending_analysis FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = keyword_trending_analysis.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

-- Content Generation Jobs Table
CREATE TABLE IF NOT EXISTS content_generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES seo_projects(id) ON DELETE CASCADE,
  job_type text NOT NULL,
  input_data jsonb NOT NULL,
  output_data jsonb,
  status text DEFAULT 'pending',
  total_items int DEFAULT 0,
  processed_items int DEFAULT 0,
  failed_items int DEFAULT 0,
  error_log jsonb DEFAULT '[]'::jsonb,
  provider text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gen_jobs_project ON content_generation_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_gen_jobs_status ON content_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_gen_jobs_type ON content_generation_jobs(job_type);

ALTER TABLE content_generation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generation jobs"
  ON content_generation_jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = content_generation_jobs.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own generation jobs"
  ON content_generation_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = content_generation_jobs.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own generation jobs"
  ON content_generation_jobs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = content_generation_jobs.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

-- Function to calculate trend shape from time series
CREATE OR REPLACE FUNCTION calculate_trend_shape(
  series jsonb
) RETURNS text AS $$
DECLARE
  volumes decimal[];
  t int[];
  n int;
  linear_rmse decimal;
  exp_rmse decimal;
  best_shape text := 'linear';
  min_rmse decimal := 999999;
BEGIN
  -- Extract volumes from time series
  SELECT array_agg((value->>'volume')::decimal ORDER BY value->>'month')
  INTO volumes
  FROM jsonb_array_elements(series) AS value;
  
  n := array_length(volumes, 1);
  
  IF n < 3 THEN
    RETURN 'insufficient_data';
  END IF;
  
  -- Generate time index
  t := array_agg(generate_series) FROM generate_series(0, n - 1);
  
  -- Simple linear trend detection
  -- If values consistently increase → linear
  -- If growth rate accelerates → exponential
  
  DECLARE
    first_val decimal := volumes[1];
    last_val decimal := volumes[n];
    mid_val decimal := volumes[CEIL(n::decimal / 2)::int];
  BEGIN
    -- Linear growth check
    IF last_val > first_val AND mid_val > first_val THEN
      IF (mid_val - first_val) / NULLIF(first_val, 0) < (last_val - mid_val) / NULLIF(mid_val, 0) THEN
        best_shape := 'exponential';
      ELSE
        best_shape := 'linear';
      END IF;
    -- Damped check (peak then decline)
    ELSIF last_val < first_val AND mid_val > last_val THEN
      best_shape := 'damped';
    -- S-curve check (slow start, rapid middle, saturation)
    ELSIF mid_val > (first_val + last_val) / 2 THEN
      best_shape := 's_curve';
    END IF;
  END;
  
  RETURN best_shape;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate growth rate
CREATE OR REPLACE FUNCTION calculate_growth_rate(
  series jsonb
) RETURNS decimal AS $$
DECLARE
  first_volume decimal;
  last_volume decimal;
  growth_pct decimal;
BEGIN
  -- Get first and last volumes
  SELECT (value->>'volume')::decimal
  INTO first_volume
  FROM jsonb_array_elements(series) AS value
  ORDER BY value->>'month'
  LIMIT 1;
  
  SELECT (value->>'volume')::decimal
  INTO last_volume
  FROM jsonb_array_elements(series) AS value
  ORDER BY value->>'month' DESC
  LIMIT 1;
  
  IF first_volume = 0 OR first_volume IS NULL THEN
    RETURN 0;
  END IF;
  
  growth_pct := ((last_volume - first_volume) / first_volume) * 100;
  
  -- Cap at ±999%
  RETURN LEAST(GREATEST(growth_pct, -999), 999);
END;
$$ LANGUAGE plpgsql;
