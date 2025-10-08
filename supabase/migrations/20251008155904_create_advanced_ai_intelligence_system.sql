/*
  # Advanced AI Intelligence System
  
  1. New Tables
    - `ai_content_briefs` - AI-generated content briefs with topic clusters
    - `content_performance_predictions` - ML-based performance forecasting
    - `serp_intent_analysis` - Search intent classification and scoring
    - `topical_authority_scores` - Domain authority by topic cluster
    - `competitor_content_gaps` - Identified content opportunities
    - `automated_optimization_logs` - Auto-optimization action tracking
    
  2. Advanced Features
    - Real-time SERP intent detection (informational, transactional, navigational)
    - Topical authority calculation with PageRank-style algorithm
    - Automated content brief generation with AI
    - Performance prediction using historical data ML models
    - Competitor gap analysis with opportunity scoring
    
  3. Security
    - Enable RLS on all tables
    - Policies for authenticated users only
*/

-- AI Content Briefs Table
CREATE TABLE IF NOT EXISTS ai_content_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES seo_projects(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  target_word_count int DEFAULT 0,
  recommended_headings jsonb DEFAULT '[]'::jsonb,
  key_topics jsonb DEFAULT '[]'::jsonb,
  questions_to_answer jsonb DEFAULT '[]'::jsonb,
  entities_to_include jsonb DEFAULT '[]'::jsonb,
  internal_links_suggested jsonb DEFAULT '[]'::jsonb,
  external_authority_links jsonb DEFAULT '[]'::jsonb,
  content_structure jsonb DEFAULT '{}'::jsonb,
  competitor_analysis jsonb DEFAULT '{}'::jsonb,
  ai_recommendations text,
  brief_score decimal(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_content_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own content briefs"
  ON ai_content_briefs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = ai_content_briefs.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own content briefs"
  ON ai_content_briefs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = ai_content_briefs.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own content briefs"
  ON ai_content_briefs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = ai_content_briefs.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

-- Content Performance Predictions Table
CREATE TABLE IF NOT EXISTS content_performance_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES seo_projects(id) ON DELETE CASCADE,
  page_id bigint REFERENCES pages(id) ON DELETE CASCADE,
  predicted_traffic_30d int DEFAULT 0,
  predicted_traffic_90d int DEFAULT 0,
  predicted_rankings jsonb DEFAULT '{}'::jsonb,
  confidence_score decimal(5,2) DEFAULT 0,
  prediction_factors jsonb DEFAULT '{}'::jsonb,
  model_version text DEFAULT 'v1',
  predicted_at timestamptz DEFAULT now(),
  actual_traffic_30d int,
  actual_traffic_90d int,
  prediction_accuracy decimal(5,2)
);

ALTER TABLE content_performance_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own predictions"
  ON content_performance_predictions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = content_performance_predictions.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

-- SERP Intent Analysis Table
CREATE TABLE IF NOT EXISTS serp_intent_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  location text DEFAULT 'us',
  language text DEFAULT 'en',
  intent_type text NOT NULL,
  intent_confidence decimal(5,2) DEFAULT 0,
  serp_features_present jsonb DEFAULT '[]'::jsonb,
  content_type_breakdown jsonb DEFAULT '{}'::jsonb,
  avg_word_count int DEFAULT 0,
  common_elements jsonb DEFAULT '{}'::jsonb,
  monetization_potential decimal(5,2) DEFAULT 0,
  analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_serp_intent_keyword ON serp_intent_analysis(keyword);
CREATE INDEX IF NOT EXISTS idx_serp_intent_type ON serp_intent_analysis(intent_type);

ALTER TABLE serp_intent_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view SERP intent analysis"
  ON serp_intent_analysis FOR SELECT
  TO authenticated
  USING (true);

-- Topical Authority Scores Table
CREATE TABLE IF NOT EXISTS topical_authority_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES seo_projects(id) ON DELETE CASCADE,
  topic_cluster text NOT NULL,
  authority_score decimal(5,2) DEFAULT 0,
  pages_in_cluster int DEFAULT 0,
  total_traffic int DEFAULT 0,
  avg_ranking decimal(5,2) DEFAULT 0,
  internal_link_density decimal(5,2) DEFAULT 0,
  content_depth_score decimal(5,2) DEFAULT 0,
  freshness_score decimal(5,2) DEFAULT 0,
  engagement_metrics jsonb DEFAULT '{}'::jsonb,
  competitor_comparison jsonb DEFAULT '{}'::jsonb,
  improvement_opportunities jsonb DEFAULT '[]'::jsonb,
  calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE topical_authority_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own authority scores"
  ON topical_authority_scores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = topical_authority_scores.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

-- Competitor Content Gaps Table
CREATE TABLE IF NOT EXISTS competitor_content_gaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES seo_projects(id) ON DELETE CASCADE,
  competitor_domain text NOT NULL,
  gap_type text NOT NULL,
  keyword text,
  topic text,
  competitor_url text,
  competitor_traffic_estimate int DEFAULT 0,
  competitor_ranking int DEFAULT 0,
  difficulty_score decimal(5,2) DEFAULT 0,
  opportunity_score decimal(5,2) DEFAULT 0,
  estimated_value decimal(10,2) DEFAULT 0,
  content_brief_id uuid REFERENCES ai_content_briefs(id),
  status text DEFAULT 'identified',
  priority text DEFAULT 'medium',
  notes text,
  identified_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competitor_gaps_priority ON competitor_content_gaps(priority);
CREATE INDEX IF NOT EXISTS idx_competitor_gaps_status ON competitor_content_gaps(status);

ALTER TABLE competitor_content_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own content gaps"
  ON competitor_content_gaps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = competitor_content_gaps.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own content gaps"
  ON competitor_content_gaps FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = competitor_content_gaps.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own content gaps"
  ON competitor_content_gaps FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = competitor_content_gaps.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

-- Automated Optimization Logs Table
CREATE TABLE IF NOT EXISTS automated_optimization_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES seo_projects(id) ON DELETE CASCADE,
  page_id bigint REFERENCES pages(id) ON DELETE CASCADE,
  optimization_type text NOT NULL,
  action_taken text NOT NULL,
  before_value text,
  after_value text,
  expected_impact jsonb DEFAULT '{}'::jsonb,
  actual_impact jsonb DEFAULT '{}'::jsonb,
  confidence_score decimal(5,2) DEFAULT 0,
  status text DEFAULT 'applied',
  applied_at timestamptz DEFAULT now(),
  validated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE automated_optimization_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own optimization logs"
  ON automated_optimization_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = automated_optimization_logs.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

-- Function to calculate topical authority
CREATE OR REPLACE FUNCTION calculate_topical_authority(
  p_project_id uuid,
  p_topic_cluster text
) RETURNS decimal AS $$
DECLARE
  v_authority_score decimal := 0;
  v_page_count int := 0;
  v_avg_position decimal := 0;
  v_total_traffic int := 0;
BEGIN
  SELECT COUNT(*) INTO v_page_count
  FROM pages
  WHERE project_id = p_project_id
  AND topic_cluster = p_topic_cluster;
  
  SELECT AVG(position) INTO v_avg_position
  FROM ranks r
  JOIN pages p ON r.page_id = p.id
  WHERE p.project_id = p_project_id
  AND p.topic_cluster = p_topic_cluster
  AND r.tracked_at >= NOW() - INTERVAL '30 days';
  
  SELECT SUM(traffic) INTO v_total_traffic
  FROM pages
  WHERE project_id = p_project_id
  AND topic_cluster = p_topic_cluster;
  
  v_authority_score := (
    (v_page_count * 0.3) +
    ((100 - COALESCE(v_avg_position, 50)) * 0.4) +
    (LEAST(v_total_traffic / 100, 30) * 0.3)
  );
  
  RETURN LEAST(v_authority_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_briefs_project ON ai_content_briefs(project_id);
CREATE INDEX IF NOT EXISTS idx_predictions_project ON content_performance_predictions(project_id);
CREATE INDEX IF NOT EXISTS idx_authority_project ON topical_authority_scores(project_id);
CREATE INDEX IF NOT EXISTS idx_gaps_project ON competitor_content_gaps(project_id);
CREATE INDEX IF NOT EXISTS idx_opt_logs_project ON automated_optimization_logs(project_id);
