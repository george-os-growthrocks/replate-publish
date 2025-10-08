/*
  # Meta Description Generator Tables
  
  1. New Tables
    - `meta_descriptions` - Generated meta descriptions with quality metrics
    - `meta_generation_batches` - Bulk generation job tracking
    - `meta_description_variants` - Multiple variants per generation
    - `meta_description_history` - Version history and A/B testing
    
  2. Features
    - Pixel width and character count tracking
    - Keyword coverage analysis
    - SERP preview data (desktop/mobile)
    - Quality scoring (readability, CTR potential)
    - Tone and audience targeting
    - Multi-language support
    
  3. Security
    - Enable RLS on all tables
    - User-specific access policies
*/

-- Meta Descriptions Table
CREATE TABLE IF NOT EXISTS meta_descriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES seo_projects(id) ON DELETE CASCADE,
  page_url text,
  page_title text NOT NULL,
  description_text text NOT NULL,
  language text DEFAULT 'en',
  tone text DEFAULT 'professional',
  audience text,
  brand text,
  keywords jsonb DEFAULT '[]'::jsonb,
  guidelines text,
  char_count int DEFAULT 0,
  pixel_width_desktop int DEFAULT 0,
  pixel_width_mobile int DEFAULT 0,
  char_target int DEFAULT 155,
  pixel_target jsonb DEFAULT '{"device": "desktop", "px": 920}'::jsonb,
  keyword_coverage jsonb DEFAULT '{}'::jsonb,
  reading_ease decimal(5,2),
  flags jsonb DEFAULT '{}'::jsonb,
  quality_score decimal(5,2),
  ctr_potential decimal(5,2),
  provider text DEFAULT 'gemini',
  prompt_tokens int DEFAULT 0,
  completion_tokens int DEFAULT 0,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_meta_desc_project ON meta_descriptions(project_id);
CREATE INDEX IF NOT EXISTS idx_meta_desc_url ON meta_descriptions(page_url);
CREATE INDEX IF NOT EXISTS idx_meta_desc_status ON meta_descriptions(status);
CREATE INDEX IF NOT EXISTS idx_meta_desc_quality ON meta_descriptions(quality_score);

ALTER TABLE meta_descriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meta descriptions"
  ON meta_descriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = meta_descriptions.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own meta descriptions"
  ON meta_descriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = meta_descriptions.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own meta descriptions"
  ON meta_descriptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = meta_descriptions.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own meta descriptions"
  ON meta_descriptions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = meta_descriptions.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

-- Meta Description Variants Table
CREATE TABLE IF NOT EXISTS meta_description_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_description_id uuid REFERENCES meta_descriptions(id) ON DELETE CASCADE,
  variant_text text NOT NULL,
  char_count int DEFAULT 0,
  pixel_width int DEFAULT 0,
  keyword_coverage jsonb DEFAULT '{}'::jsonb,
  reading_ease decimal(5,2),
  flags jsonb DEFAULT '{}'::jsonb,
  quality_score decimal(5,2),
  is_selected boolean DEFAULT false,
  performance_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_variants_meta ON meta_description_variants(meta_description_id);
CREATE INDEX IF NOT EXISTS idx_variants_selected ON meta_description_variants(is_selected);

ALTER TABLE meta_description_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own variants"
  ON meta_description_variants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meta_descriptions md
      JOIN seo_projects sp ON sp.id = md.project_id
      WHERE md.id = meta_description_variants.meta_description_id
      AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own variants"
  ON meta_description_variants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meta_descriptions md
      JOIN seo_projects sp ON sp.id = md.project_id
      WHERE md.id = meta_description_variants.meta_description_id
      AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own variants"
  ON meta_description_variants FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meta_descriptions md
      JOIN seo_projects sp ON sp.id = md.project_id
      WHERE md.id = meta_description_variants.meta_description_id
      AND sp.user_id = auth.uid()
    )
  );

-- Meta Generation Batches Table
CREATE TABLE IF NOT EXISTS meta_generation_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES seo_projects(id) ON DELETE CASCADE,
  batch_name text,
  input_data jsonb NOT NULL,
  total_items int DEFAULT 0,
  processed_items int DEFAULT 0,
  successful_items int DEFAULT 0,
  failed_items int DEFAULT 0,
  results jsonb DEFAULT '[]'::jsonb,
  errors jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_batches_project ON meta_generation_batches(project_id);
CREATE INDEX IF NOT EXISTS idx_batches_status ON meta_generation_batches(status);

ALTER TABLE meta_generation_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own batches"
  ON meta_generation_batches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = meta_generation_batches.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own batches"
  ON meta_generation_batches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = meta_generation_batches.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own batches"
  ON meta_generation_batches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = meta_generation_batches.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

-- Meta Description History Table (for A/B testing and versioning)
CREATE TABLE IF NOT EXISTS meta_description_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_description_id uuid REFERENCES meta_descriptions(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES meta_description_variants(id) ON DELETE SET NULL,
  description_text text NOT NULL,
  impressions int DEFAULT 0,
  clicks int DEFAULT 0,
  ctr decimal(5,4),
  avg_position decimal(5,2),
  date_range daterange,
  performance_metrics jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_history_meta ON meta_description_history(meta_description_id);
CREATE INDEX IF NOT EXISTS idx_history_ctr ON meta_description_history(ctr);

ALTER TABLE meta_description_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history"
  ON meta_description_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meta_descriptions md
      JOIN seo_projects sp ON sp.id = md.project_id
      WHERE md.id = meta_description_history.meta_description_id
      AND sp.user_id = auth.uid()
    )
  );

-- Function to calculate quality score
CREATE OR REPLACE FUNCTION calculate_meta_quality_score(
  p_description text,
  p_char_count int,
  p_char_target int,
  p_keyword_coverage jsonb,
  p_reading_ease decimal
) RETURNS decimal AS $$
DECLARE
  v_score decimal := 0;
  v_length_score decimal := 0;
  v_keyword_score decimal := 0;
  v_readability_score decimal := 0;
  v_keywords_covered int := 0;
  v_total_keywords int := 0;
BEGIN
  -- Length score (optimal: 140-155 chars)
  IF p_char_count >= 140 AND p_char_count <= 155 THEN
    v_length_score := 30;
  ELSIF p_char_count >= 130 AND p_char_count < 140 THEN
    v_length_score := 25;
  ELSIF p_char_count > 155 AND p_char_count <= 165 THEN
    v_length_score := 20;
  ELSIF p_char_count >= 120 AND p_char_count < 130 THEN
    v_length_score := 15;
  ELSIF p_char_count > 165 THEN
    v_length_score := 5;
  ELSE
    v_length_score := 10;
  END IF;
  
  -- Keyword coverage score
  SELECT 
    COUNT(*) FILTER (WHERE value::boolean = true),
    COUNT(*)
  INTO v_keywords_covered, v_total_keywords
  FROM jsonb_each(p_keyword_coverage);
  
  IF v_total_keywords > 0 THEN
    v_keyword_score := (v_keywords_covered::decimal / v_total_keywords) * 30;
  ELSE
    v_keyword_score := 15; -- No keywords = moderate score
  END IF;
  
  -- Readability score (Flesch: 60-80 ideal)
  IF p_reading_ease IS NOT NULL THEN
    IF p_reading_ease >= 60 AND p_reading_ease <= 80 THEN
      v_readability_score := 20;
    ELSIF p_reading_ease >= 50 AND p_reading_ease < 60 THEN
      v_readability_score := 15;
    ELSIF p_reading_ease > 80 AND p_reading_ease <= 90 THEN
      v_readability_score := 15;
    ELSE
      v_readability_score := 10;
    END IF;
  ELSE
    v_readability_score := 10;
  END IF;
  
  -- Bonus points for action words and benefits
  IF p_description ~* '\\b(discover|explore|learn|get|find|shop|save|transform|improve|boost)\\b' THEN
    v_score := v_score + 10;
  END IF;
  
  -- Bonus for numbers/specificity
  IF p_description ~ '\\d+' THEN
    v_score := v_score + 5;
  END IF;
  
  -- Penalty for all caps
  IF p_description ~ '[A-Z]{5,}' THEN
    v_score := v_score - 5;
  END IF;
  
  v_score := v_score + v_length_score + v_keyword_score + v_readability_score;
  
  -- Cap at 100
  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate CTR potential
CREATE OR REPLACE FUNCTION calculate_ctr_potential(
  p_description text,
  p_quality_score decimal
) RETURNS decimal AS $$
DECLARE
  v_ctr_score decimal := 0;
BEGIN
  -- Base score from quality
  v_ctr_score := p_quality_score * 0.5;
  
  -- Bonus for emotional triggers
  IF p_description ~* '\\b(free|new|exclusive|limited|special|guaranteed|proven|essential|ultimate|best)\\b' THEN
    v_ctr_score := v_ctr_score + 10;
  END IF;
  
  -- Bonus for questions
  IF p_description ~ '\\?' THEN
    v_ctr_score := v_ctr_score + 5;
  END IF;
  
  -- Bonus for call-to-action
  IF p_description ~* '\\b(shop now|learn more|get started|try|sign up|join|discover more)\\b' THEN
    v_ctr_score := v_ctr_score + 10;
  END IF;
  
  -- Bonus for benefits/outcomes
  IF p_description ~* '\\b(save|boost|increase|improve|transform|reduce|maximize|optimize)\\b' THEN
    v_ctr_score := v_ctr_score + 5;
  END IF;
  
  RETURN LEAST(v_ctr_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate scores on insert/update
CREATE OR REPLACE FUNCTION update_meta_scores()
RETURNS TRIGGER AS $$
BEGIN
  NEW.quality_score := calculate_meta_quality_score(
    NEW.description_text,
    NEW.char_count,
    NEW.char_target,
    NEW.keyword_coverage,
    NEW.reading_ease
  );
  
  NEW.ctr_potential := calculate_ctr_potential(
    NEW.description_text,
    NEW.quality_score
  );
  
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_meta_scores
  BEFORE INSERT OR UPDATE ON meta_descriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_meta_scores();
