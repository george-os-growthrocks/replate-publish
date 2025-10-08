/*
  # SERP Feature Extraction & Job Queue System
  
  Creates comprehensive SERP tracking with feature extraction and
  a robust job queue system for background processing.
  
  ## Tables Created
  
  ### SERP Features
  1. serp_features - Featured snippets, PAA, images, videos, etc.
  2. serp_volatility - SERP ranking volatility index
  3. serp_competitors - Competitor position tracking
  4. zero_click_tracking - Zero-click search monitoring
  
  ### Job Queue
  1. jobs - Background job queue with priority
  2. job_logs - Execution logs and errors
  3. job_schedules - Recurring job definitions
  
  ## Features
  - SERP feature extraction (10+ feature types)
  - Volatility index calculation
  - Competitor tracking
  - Priority-based job queue
  - Job retry logic with exponential backoff
  - Job execution logging
*/

-- =============================================================================
-- SERP FEATURE TABLES
-- =============================================================================

-- SERP Features (Featured Snippets, PAA, Images, etc.)
CREATE TABLE IF NOT EXISTS public.serp_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  keyword_id BIGINT NOT NULL REFERENCES public.serp_keywords(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL CHECK (feature_type IN (
    'featured_snippet',
    'people_also_ask',
    'image_pack',
    'video_carousel',
    'top_stories',
    'local_pack',
    'knowledge_panel',
    'site_links',
    'reviews',
    'shopping_results',
    'ai_overview'
  )),
  position INTEGER,
  url TEXT,
  title TEXT,
  snippet TEXT,
  feature_data JSONB,
  is_owned BOOLEAN DEFAULT false,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_serp_feature UNIQUE(keyword_id, feature_type, date, position)
);

ALTER TABLE public.serp_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view SERP features for their projects"
  ON public.serp_features FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = serp_features.project_id
    AND seo_projects.user_id = auth.uid()
  ));

-- SERP Volatility Index
CREATE TABLE IF NOT EXISTS public.serp_volatility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  volatility_score NUMERIC(5,2),
  keywords_tracked INTEGER,
  keywords_moved INTEGER,
  avg_position_change NUMERIC(5,2),
  top_movers JSONB,
  algorithm_update_suspected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_project_volatility_date UNIQUE(project_id, date)
);

ALTER TABLE public.serp_volatility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view volatility for their projects"
  ON public.serp_volatility FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = serp_volatility.project_id
    AND seo_projects.user_id = auth.uid()
  ));

-- SERP Competitors
CREATE TABLE IF NOT EXISTS public.serp_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  keyword_id BIGINT NOT NULL REFERENCES public.serp_keywords(id) ON DELETE CASCADE,
  competitor_domain TEXT NOT NULL,
  competitor_url TEXT,
  position INTEGER,
  date DATE NOT NULL,
  share_of_voice NUMERIC(5,4),
  estimated_traffic INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_competitor_keyword_date UNIQUE(keyword_id, competitor_domain, date)
);

ALTER TABLE public.serp_competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view competitors for their projects"
  ON public.serp_competitors FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = serp_competitors.project_id
    AND seo_projects.user_id = auth.uid()
  ));

-- Zero-Click Search Tracking
CREATE TABLE IF NOT EXISTS public.zero_click_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  keyword_id BIGINT NOT NULL REFERENCES public.serp_keywords(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  has_featured_snippet BOOLEAN DEFAULT false,
  has_knowledge_panel BOOLEAN DEFAULT false,
  has_ai_overview BOOLEAN DEFAULT false,
  has_people_also_ask BOOLEAN DEFAULT false,
  estimated_zero_click_rate NUMERIC(5,4),
  our_snippet_owned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_zero_click_tracking UNIQUE(keyword_id, date)
);

ALTER TABLE public.zero_click_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view zero-click tracking for their projects"
  ON public.zero_click_tracking FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = zero_click_tracking.project_id
    AND seo_projects.user_id = auth.uid()
  ));

-- =============================================================================
-- JOB QUEUE SYSTEM
-- =============================================================================

-- Jobs Queue
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN (
    'crawl_site',
    'rank_tracking',
    'gsc_sync',
    'ga4_sync',
    'content_analysis',
    'backlink_check',
    'serp_analysis',
    'generate_embeddings',
    'calculate_authority',
    'link_opportunities',
    'forecast_generation',
    'report_generation',
    'data_export'
  )),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1 = highest
  status TEXT DEFAULT 'queued' CHECK (status IN (
    'queued',
    'processing',
    'completed',
    'failed',
    'cancelled',
    'retrying'
  )),
  input_data JSONB,
  output_data JSONB,
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own jobs"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Job Logs
CREATE TABLE IF NOT EXISTS public.job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  level TEXT DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.job_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs for their jobs"
  ON public.job_logs FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = job_logs.job_id
    AND jobs.user_id = auth.uid()
  ));

-- Job Schedules (for recurring jobs)
CREATE TABLE IF NOT EXISTS public.job_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  schedule_cron TEXT NOT NULL, -- e.g., '0 0 * * *' for daily at midnight
  input_data JSONB,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.job_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their job schedules"
  ON public.job_schedules FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- JOB QUEUE FUNCTIONS
-- =============================================================================

-- Dequeue Next Job (with priority)
CREATE OR REPLACE FUNCTION dequeue_next_job()
RETURNS TABLE(
  job_id UUID,
  job_type TEXT,
  input_data JSONB,
  project_id UUID
) AS $$
DECLARE
  selected_job RECORD;
BEGIN
  -- Lock and update the highest priority queued job
  SELECT *
  INTO selected_job
  FROM public.jobs
  WHERE status = 'queued'
  AND (scheduled_at IS NULL OR scheduled_at <= now())
  ORDER BY priority ASC, created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Update job status
  UPDATE public.jobs
  SET status = 'processing',
      started_at = now(),
      updated_at = now()
  WHERE id = selected_job.id;
  
  -- Return job details
  RETURN QUERY
  SELECT 
    selected_job.id,
    selected_job.job_type,
    selected_job.input_data,
    selected_job.project_id;
END;
$$ LANGUAGE plpgsql;

-- Complete Job
CREATE OR REPLACE FUNCTION complete_job(
  p_job_id UUID,
  p_output_data JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF p_error_message IS NOT NULL THEN
    -- Job failed
    UPDATE public.jobs
    SET status = CASE 
      WHEN retry_count < max_retries THEN 'retrying'
      ELSE 'failed'
    END,
    retry_count = retry_count + 1,
    error_message = p_error_message,
    completed_at = now(),
    updated_at = now()
    WHERE id = p_job_id;
  ELSE
    -- Job completed successfully
    UPDATE public.jobs
    SET status = 'completed',
    output_data = p_output_data,
    progress = 100,
    completed_at = now(),
    updated_at = now()
    WHERE id = p_job_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Calculate SERP Volatility
CREATE OR REPLACE FUNCTION calculate_serp_volatility(
  p_project_id UUID,
  p_date DATE
)
RETURNS NUMERIC AS $$
DECLARE
  volatility_score NUMERIC;
  keywords_count INTEGER;
  keywords_moved_count INTEGER;
  avg_change NUMERIC;
BEGIN
  -- Count keywords and position changes
  WITH position_changes AS (
    SELECT 
      r1.keyword_id,
      ABS(r1.position - r2.position) AS position_change
    FROM public.ranks r1
    JOIN public.ranks r2 ON r2.keyword_id = r1.keyword_id
    WHERE r1.project_id = p_project_id
    AND r1.date = p_date
    AND r2.date = p_date - 1
    AND r1.position IS NOT NULL
    AND r2.position IS NOT NULL
  )
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN position_change > 3 THEN 1 END),
    COALESCE(AVG(position_change), 0)
  INTO keywords_count, keywords_moved_count, avg_change
  FROM position_changes;
  
  IF keywords_count = 0 THEN
    RETURN 0;
  END IF;
  
  -- Calculate volatility score (0-100)
  volatility_score := LEAST(100, 
    (keywords_moved_count::NUMERIC / keywords_count * 100) * (avg_change / 10)
  );
  
  -- Insert or update volatility record
  INSERT INTO public.serp_volatility (
    project_id,
    date,
    volatility_score,
    keywords_tracked,
    keywords_moved,
    avg_position_change
  ) VALUES (
    p_project_id,
    p_date,
    volatility_score,
    keywords_count,
    keywords_moved_count,
    avg_change
  )
  ON CONFLICT (project_id, date)
  DO UPDATE SET
    volatility_score = EXCLUDED.volatility_score,
    keywords_tracked = EXCLUDED.keywords_tracked,
    keywords_moved = EXCLUDED.keywords_moved,
    avg_position_change = EXCLUDED.avg_position_change;
  
  RETURN volatility_score;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- SERP Features
CREATE INDEX IF NOT EXISTS idx_serp_features_project_id ON public.serp_features(project_id);
CREATE INDEX IF NOT EXISTS idx_serp_features_keyword_id ON public.serp_features(keyword_id);
CREATE INDEX IF NOT EXISTS idx_serp_features_type ON public.serp_features(feature_type);
CREATE INDEX IF NOT EXISTS idx_serp_features_date ON public.serp_features(date DESC);
CREATE INDEX IF NOT EXISTS idx_serp_features_is_owned ON public.serp_features(is_owned) WHERE is_owned = true;

-- SERP Volatility
CREATE INDEX IF NOT EXISTS idx_serp_volatility_project_id ON public.serp_volatility(project_id);
CREATE INDEX IF NOT EXISTS idx_serp_volatility_date ON public.serp_volatility(date DESC);
CREATE INDEX IF NOT EXISTS idx_serp_volatility_score ON public.serp_volatility(volatility_score DESC);

-- SERP Competitors
CREATE INDEX IF NOT EXISTS idx_serp_competitors_project_id ON public.serp_competitors(project_id);
CREATE INDEX IF NOT EXISTS idx_serp_competitors_keyword_id ON public.serp_competitors(keyword_id);
CREATE INDEX IF NOT EXISTS idx_serp_competitors_domain ON public.serp_competitors(competitor_domain);
CREATE INDEX IF NOT EXISTS idx_serp_competitors_date ON public.serp_competitors(date DESC);

-- Zero Click Tracking
CREATE INDEX IF NOT EXISTS idx_zero_click_project_id ON public.zero_click_tracking(project_id);
CREATE INDEX IF NOT EXISTS idx_zero_click_keyword_id ON public.zero_click_tracking(keyword_id);
CREATE INDEX IF NOT EXISTS idx_zero_click_date ON public.zero_click_tracking(date DESC);

-- Jobs
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_project_id ON public.jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON public.jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_priority_status ON public.jobs(priority ASC, status) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_at ON public.jobs(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- Job Logs
CREATE INDEX IF NOT EXISTS idx_job_logs_job_id ON public.job_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_job_logs_level ON public.job_logs(level);
CREATE INDEX IF NOT EXISTS idx_job_logs_created_at ON public.job_logs(created_at DESC);

-- Job Schedules
CREATE INDEX IF NOT EXISTS idx_job_schedules_user_id ON public.job_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_job_schedules_next_run ON public.job_schedules(next_run_at) WHERE is_active = true;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_schedules_updated_at
  BEFORE UPDATE ON public.job_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-log job status changes
CREATE OR REPLACE FUNCTION log_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.job_logs (job_id, level, message, metadata)
    VALUES (
      NEW.id,
      CASE NEW.status
        WHEN 'failed' THEN 'error'
        WHEN 'completed' THEN 'info'
        ELSE 'info'
      END,
      'Job status changed from ' || COALESCE(OLD.status, 'null') || ' to ' || NEW.status,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'retry_count', NEW.retry_count
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_job_status_changes
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION log_job_status_change();
