/*
  # Enterprise Monitoring & Alerting System
  
  1. New Tables
    - `rank_tracking_alerts` - Automated ranking change alerts
    - `traffic_anomaly_detection` - AI-powered traffic anomaly detection
    - `core_web_vitals` - Real User Monitoring (RUM) for Core Web Vitals
    - `competitor_movement_alerts` - Competitor ranking movement tracking
    - `serp_feature_changes` - SERP feature appearance/disappearance tracking
    - `algorithm_update_impact` - Google algorithm update impact analysis
    
  2. Features
    - Real-time ranking change detection with customizable thresholds
    - Statistical anomaly detection for traffic patterns
    - Core Web Vitals monitoring (LCP, FID, CLS)
    - Competitor SERP movement intelligence
    - Algorithm update correlation analysis
    
  3. Security
    - Enable RLS on all tables
    - User-specific access policies
*/

-- Rank Tracking Alerts Table
CREATE TABLE IF NOT EXISTS rank_tracking_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES seo_projects(id) ON DELETE CASCADE,
  page_id bigint REFERENCES pages(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  previous_position int,
  current_position int,
  position_change int,
  alert_type text NOT NULL, -- improvement, drop, gained_position_1, lost_position_1
  alert_severity text DEFAULT 'medium', -- low, medium, high, critical
  threshold_triggered decimal(5,2),
  serp_features_gained jsonb DEFAULT '[]'::jsonb,
  serp_features_lost jsonb DEFAULT '[]'::jsonb,
  notification_sent boolean DEFAULT false,
  acknowledged boolean DEFAULT false,
  notes text,
  detected_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_project ON rank_tracking_alerts(project_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON rank_tracking_alerts(alert_severity);
CREATE INDEX IF NOT EXISTS idx_alerts_ack ON rank_tracking_alerts(acknowledged);

ALTER TABLE rank_tracking_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON rank_tracking_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = rank_tracking_alerts.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own alerts"
  ON rank_tracking_alerts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = rank_tracking_alerts.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

-- Traffic Anomaly Detection Table
CREATE TABLE IF NOT EXISTS traffic_anomaly_detection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES seo_projects(id) ON DELETE CASCADE,
  page_id bigint REFERENCES pages(id),
  anomaly_type text NOT NULL, -- spike, drop, pattern_change
  expected_traffic int,
  actual_traffic int,
  deviation_percent decimal(5,2),
  confidence_level decimal(5,2) DEFAULT 0,
  statistical_significance decimal(5,4),
  possible_causes jsonb DEFAULT '[]'::jsonb,
  correlation_data jsonb DEFAULT '{}'::jsonb,
  auto_analysis text,
  status text DEFAULT 'investigating', -- investigating, explained, unexplained, resolved
  detected_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anomaly_project ON traffic_anomaly_detection(project_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_type ON traffic_anomaly_detection(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_anomaly_status ON traffic_anomaly_detection(status);

ALTER TABLE traffic_anomaly_detection ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own anomalies"
  ON traffic_anomaly_detection FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = traffic_anomaly_detection.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

-- Core Web Vitals Table
CREATE TABLE IF NOT EXISTS core_web_vitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES seo_projects(id) ON DELETE CASCADE,
  page_id bigint REFERENCES pages(id) ON DELETE CASCADE,
  url text NOT NULL,
  lcp decimal(10,2), -- Largest Contentful Paint (ms)
  fid decimal(10,2), -- First Input Delay (ms)
  cls decimal(5,3), -- Cumulative Layout Shift
  fcp decimal(10,2), -- First Contentful Paint (ms)
  ttfb decimal(10,2), -- Time to First Byte (ms)
  inp decimal(10,2), -- Interaction to Next Paint (ms)
  device_type text DEFAULT 'desktop', -- desktop, mobile, tablet
  connection_type text,
  geo_location text,
  browser text,
  pass_rate decimal(5,2),
  performance_score int,
  measured_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cwv_project ON core_web_vitals(project_id);
CREATE INDEX IF NOT EXISTS idx_cwv_page ON core_web_vitals(page_id);
CREATE INDEX IF NOT EXISTS idx_cwv_measured ON core_web_vitals(measured_at);

ALTER TABLE core_web_vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own web vitals"
  ON core_web_vitals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = core_web_vitals.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

-- Competitor Movement Alerts Table
CREATE TABLE IF NOT EXISTS competitor_movement_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES seo_projects(id) ON DELETE CASCADE,
  competitor_domain text NOT NULL,
  keyword text NOT NULL,
  movement_type text NOT NULL, -- entered_top_10, left_top_10, overtook_us, we_overtook
  previous_position int,
  current_position int,
  our_previous_position int,
  our_current_position int,
  position_gap int,
  content_changes_detected jsonb DEFAULT '{}'::jsonb,
  backlink_changes int DEFAULT 0,
  estimated_traffic_impact int,
  recommended_actions jsonb DEFAULT '[]'::jsonb,
  priority text DEFAULT 'medium',
  acknowledged boolean DEFAULT false,
  detected_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comp_alerts_project ON competitor_movement_alerts(project_id);
CREATE INDEX IF NOT EXISTS idx_comp_alerts_priority ON competitor_movement_alerts(priority);

ALTER TABLE competitor_movement_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own competitor alerts"
  ON competitor_movement_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = competitor_movement_alerts.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

-- SERP Feature Changes Table
CREATE TABLE IF NOT EXISTS serp_feature_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES seo_projects(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  feature_type text NOT NULL, -- featured_snippet, paa, local_pack, images, videos, etc.
  change_type text NOT NULL, -- appeared, disappeared, owner_changed
  previous_owner text,
  current_owner text,
  our_opportunity boolean DEFAULT false,
  opportunity_score decimal(5,2),
  content_requirements jsonb DEFAULT '{}'::jsonb,
  estimated_traffic_value int,
  action_plan text,
  detected_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_serp_changes_project ON serp_feature_changes(project_id);
CREATE INDEX IF NOT EXISTS idx_serp_changes_opportunity ON serp_feature_changes(our_opportunity);

ALTER TABLE serp_feature_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own SERP changes"
  ON serp_feature_changes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = serp_feature_changes.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

-- Algorithm Update Impact Table
CREATE TABLE IF NOT EXISTS algorithm_update_impact (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES seo_projects(id) ON DELETE CASCADE,
  update_name text NOT NULL,
  update_date date NOT NULL,
  impact_score decimal(5,2), -- -100 to +100
  traffic_change_percent decimal(5,2),
  rankings_affected int DEFAULT 0,
  pages_improved int DEFAULT 0,
  pages_declined int DEFAULT 0,
  primary_impact_areas jsonb DEFAULT '[]'::jsonb, -- content quality, technical, links, etc.
  affected_keywords jsonb DEFAULT '[]'::jsonb,
  recovery_actions jsonb DEFAULT '[]'::jsonb,
  recovery_status text DEFAULT 'analyzing', -- analyzing, in_progress, recovered, unrecovered
  analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_algo_impact_project ON algorithm_update_impact(project_id);
CREATE INDEX IF NOT EXISTS idx_algo_impact_date ON algorithm_update_impact(update_date);

ALTER TABLE algorithm_update_impact ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own algorithm impacts"
  ON algorithm_update_impact FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = algorithm_update_impact.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

-- Function to detect traffic anomalies
CREATE OR REPLACE FUNCTION detect_traffic_anomaly(
  p_project_id uuid,
  p_page_id bigint,
  p_current_traffic int
) RETURNS jsonb AS $$
DECLARE
  v_avg_traffic decimal;
  v_stddev decimal;
  v_deviation decimal;
  v_z_score decimal;
  v_is_anomaly boolean := false;
  v_anomaly_type text;
BEGIN
  -- Calculate 30-day average and standard deviation
  SELECT AVG(traffic), STDDEV(traffic) INTO v_avg_traffic, v_stddev
  FROM pages
  WHERE id = p_page_id
  AND created_at >= NOW() - INTERVAL '30 days';
  
  -- Calculate deviation
  v_deviation := ((p_current_traffic - v_avg_traffic) / NULLIF(v_avg_traffic, 0)) * 100;
  
  -- Calculate Z-score
  v_z_score := (p_current_traffic - v_avg_traffic) / NULLIF(v_stddev, 0);
  
  -- Determine if anomaly (Z-score > 2 or < -2 indicates anomaly)
  IF ABS(v_z_score) > 2 THEN
    v_is_anomaly := true;
    v_anomaly_type := CASE 
      WHEN v_z_score > 0 THEN 'spike'
      ELSE 'drop'
    END;
  END IF;
  
  RETURN jsonb_build_object(
    'is_anomaly', v_is_anomaly,
    'anomaly_type', v_anomaly_type,
    'deviation_percent', v_deviation,
    'z_score', v_z_score,
    'confidence_level', LEAST(ABS(v_z_score) * 33, 100)
  );
END;
$$ LANGUAGE plpgsql;

-- Function to calculate Core Web Vitals score
CREATE OR REPLACE FUNCTION calculate_cwv_score(
  p_lcp decimal,
  p_fid decimal,
  p_cls decimal
) RETURNS int AS $$
DECLARE
  v_lcp_score int := 0;
  v_fid_score int := 0;
  v_cls_score int := 0;
BEGIN
  -- LCP scoring (good < 2.5s, needs improvement < 4s, poor >= 4s)
  v_lcp_score := CASE 
    WHEN p_lcp <= 2500 THEN 100
    WHEN p_lcp <= 4000 THEN 50
    ELSE 0
  END;
  
  -- FID scoring (good < 100ms, needs improvement < 300ms, poor >= 300ms)
  v_fid_score := CASE 
    WHEN p_fid <= 100 THEN 100
    WHEN p_fid <= 300 THEN 50
    ELSE 0
  END;
  
  -- CLS scoring (good < 0.1, needs improvement < 0.25, poor >= 0.25)
  v_cls_score := CASE 
    WHEN p_cls <= 0.1 THEN 100
    WHEN p_cls <= 0.25 THEN 50
    ELSE 0
  END;
  
  RETURN (v_lcp_score + v_fid_score + v_cls_score) / 3;
END;
$$ LANGUAGE plpgsql;
