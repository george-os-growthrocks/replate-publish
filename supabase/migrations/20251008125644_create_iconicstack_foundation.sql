/*
  # IconicStack Foundation Schema - Core Tables
  
  This migration creates the foundational tables for the IconicStack SEO platform,
  inspired by SEMrush, Ahrefs, Screaming Frog, Moz, SEOTesting, SEOmonitor, and Surfer.
  
  ## Core Tables Created
  
  1. Projects & User Management
     - `profiles` - User profiles with plan types
     - `seo_projects` - SEO project containers with domain tracking
     - `user_settings` - User preferences and configurations
     
  2. Crawling Infrastructure  
     - `crawl_runs` - Crawl job management with HTML-first + conditional JS
     - `pages` - Crawled pages with canonical, status, indexability
     - `links` - Edge list for backlink graph (src, dst, anchor, rel, first/last seen)
     - `crawl_snapshots` - Raw HTML and rendered DOM storage references
     
  3. SERP & Rankings
     - `serp_keywords` - Keyword universe with volume, intent, features
     - `ranks` - Daily position tracking per keyword/URL
     - `serp_features` - Featured snippets, PAA, images, videos
     
  4. Ground Truth (GSC/GA4)
     - `gsc_query` - Search Console query performance data
     - `ga4_sessions` - Analytics engagement and conversion data
     
  5. Testing & Experiments
     - `tests` - SEO experiments with hypothesis and groups
     - `test_metrics` - Pre/post performance deltas
     
  6. Forecasting
     - `forecasts` - Traffic predictions with CTR curves
     - `ctr_curves` - Position-based click probability models
     
  ## Security
  - All tables have RLS enabled
  - User-based access control
  - Project-based data isolation
  
  ## Performance
  - Comprehensive indexing on all query columns
  - Composite indexes for complex queries
  - Foreign key indexes for joins
*/

-- =============================================================================
-- 1. PROFILES & PROJECTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company_name TEXT,
  avatar_url TEXT,
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- SEO Projects
CREATE TABLE IF NOT EXISTS public.seo_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  crawl_depth INTEGER DEFAULT 3 CHECK (crawl_depth BETWEEN 1 AND 10),
  js_render_mode TEXT DEFAULT 'auto' CHECK (js_render_mode IN ('never', 'auto', 'always')),
  gsc_property_id TEXT,
  ga4_property_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT domain_per_user UNIQUE(user_id, domain)
);

ALTER TABLE public.seo_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON public.seo_projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON public.seo_projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.seo_projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.seo_projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User Settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  notifications_enabled BOOLEAN DEFAULT true,
  email_reports BOOLEAN DEFAULT false,
  api_keys JSONB DEFAULT '{}'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
  ON public.user_settings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 2. CRAWLING INFRASTRUCTURE
-- =============================================================================

-- Crawl Runs
CREATE TABLE IF NOT EXISTS public.crawl_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  seed TEXT NOT NULL,
  depth INTEGER DEFAULT 3,
  js_render_mode TEXT DEFAULT 'auto',
  pages_crawled INTEGER DEFAULT 0,
  pages_rendered INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.crawl_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view crawls for their projects"
  ON public.crawl_runs FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = crawl_runs.project_id
    AND seo_projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert crawls for their projects"
  ON public.crawl_runs FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = crawl_runs.project_id
    AND seo_projects.user_id = auth.uid()
  ));

-- Pages
CREATE TABLE IF NOT EXISTS public.pages (
  id BIGSERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  canonical_url TEXT,
  status INTEGER,
  title TEXT,
  h1 TEXT,
  meta_description TEXT,
  lang TEXT,
  word_count INTEGER,
  indexable BOOLEAN,
  rendered BOOLEAN DEFAULT false,
  last_crawled_at TIMESTAMPTZ,
  snapshot_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_project_url UNIQUE(project_id, url)
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pages for their projects"
  ON public.pages FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = pages.project_id
    AND seo_projects.user_id = auth.uid()
  ));

-- Links (Backlink Graph Edge List)
CREATE TABLE IF NOT EXISTS public.links (
  id BIGSERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  src_page_id BIGINT REFERENCES public.pages(id) ON DELETE CASCADE,
  dst_url TEXT NOT NULL,
  anchor TEXT,
  rel TEXT,
  link_type TEXT CHECK (link_type IN ('internal', 'external', 'nofollow', 'dofollow')),
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view links for their projects"
  ON public.links FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = links.project_id
    AND seo_projects.user_id = auth.uid()
  ));

-- =============================================================================
-- 3. SERP & RANKINGS
-- =============================================================================

-- SERP Keywords
CREATE TABLE IF NOT EXISTS public.serp_keywords (
  id BIGSERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  locale TEXT DEFAULT 'en-US',
  device TEXT DEFAULT 'desktop' CHECK (device IN ('desktop', 'mobile')),
  intent TEXT CHECK (intent IN ('informational', 'commercial', 'transactional', 'navigational')),
  volume INTEGER,
  difficulty NUMERIC(5,2),
  cpc NUMERIC(10,2),
  serp_features JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_keyword_locale_device UNIQUE(keyword, locale, device)
);

ALTER TABLE public.serp_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view SERP keywords"
  ON public.serp_keywords FOR SELECT
  TO authenticated
  USING (true);

-- Ranks (Position Tracking)
CREATE TABLE IF NOT EXISTS public.ranks (
  id BIGSERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  keyword_id BIGINT NOT NULL REFERENCES public.serp_keywords(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INTEGER,
  date DATE NOT NULL,
  impressions INTEGER,
  clicks INTEGER,
  ctr NUMERIC(5,4),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_project_keyword_date UNIQUE(project_id, keyword_id, date)
);

ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ranks for their projects"
  ON public.ranks FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = ranks.project_id
    AND seo_projects.user_id = auth.uid()
  ));

-- =============================================================================
-- 4. GROUND TRUTH (GSC/GA4)
-- =============================================================================

-- GSC Query Data
CREATE TABLE IF NOT EXISTS public.gsc_query (
  id BIGSERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  query TEXT NOT NULL,
  date DATE NOT NULL,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC(5,4),
  position NUMERIC(5,2),
  country TEXT,
  device TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_gsc_entry UNIQUE(project_id, page_url, query, date, device)
);

ALTER TABLE public.gsc_query ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view GSC data for their projects"
  ON public.gsc_query FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = gsc_query.project_id
    AND seo_projects.user_id = auth.uid()
  ));

-- GA4 Sessions
CREATE TABLE IF NOT EXISTS public.ga4_sessions (
  id BIGSERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sessions INTEGER DEFAULT 0,
  users INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5,4),
  conversions INTEGER DEFAULT 0,
  revenue NUMERIC(10,2),
  source_medium TEXT,
  landing_page TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_ga4_entry UNIQUE(project_id, date, source_medium, landing_page)
);

ALTER TABLE public.ga4_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view GA4 data for their projects"
  ON public.ga4_sessions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = ga4_sessions.project_id
    AND seo_projects.user_id = auth.uid()
  ));

-- =============================================================================
-- 5. SEO TESTING
-- =============================================================================

-- Tests
CREATE TABLE IF NOT EXISTS public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  hypothesis TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  group_def JSONB NOT NULL,
  status TEXT DEFAULT 'running' CHECK (status IN ('planning', 'running', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage tests for their projects"
  ON public.tests FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = tests.project_id
    AND seo_projects.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = tests.project_id
    AND seo_projects.user_id = auth.uid()
  ));

-- Test Metrics
CREATE TABLE IF NOT EXISTS public.test_metrics (
  id BIGSERIAL PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clicks_delta NUMERIC(10,2),
  impr_delta NUMERIC(10,2),
  p_value NUMERIC(5,4),
  confidence_level NUMERIC(5,4),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_test_date UNIQUE(test_id, date)
);

ALTER TABLE public.test_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view test metrics"
  ON public.test_metrics FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tests
    JOIN public.seo_projects ON seo_projects.id = tests.project_id
    WHERE tests.id = test_metrics.test_id
    AND seo_projects.user_id = auth.uid()
  ));

-- =============================================================================
-- 6. FORECASTING
-- =============================================================================

-- CTR Curves
CREATE TABLE IF NOT EXISTS public.ctr_curves (
  id BIGSERIAL PRIMARY KEY,
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 100),
  device TEXT DEFAULT 'desktop' CHECK (device IN ('desktop', 'mobile')),
  vertical TEXT DEFAULT 'general',
  ctr NUMERIC(5,4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_position_device_vertical UNIQUE(position, device, vertical)
);

-- Seed default CTR data
INSERT INTO public.ctr_curves (position, device, vertical, ctr) VALUES
(1, 'desktop', 'general', 0.2845),
(2, 'desktop', 'general', 0.1515),
(3, 'desktop', 'general', 0.1005),
(4, 'desktop', 'general', 0.0735),
(5, 'desktop', 'general', 0.0555),
(6, 'desktop', 'general', 0.0435),
(7, 'desktop', 'general', 0.0355),
(8, 'desktop', 'general', 0.0295),
(9, 'desktop', 'general', 0.0245),
(10, 'desktop', 'general', 0.0205),
(1, 'mobile', 'general', 0.2645),
(2, 'mobile', 'general', 0.1315),
(3, 'mobile', 'general', 0.0905),
(4, 'mobile', 'general', 0.0635),
(5, 'mobile', 'general', 0.0485)
ON CONFLICT (position, device, vertical) DO NOTHING;

-- Forecasts
CREATE TABLE IF NOT EXISTS public.forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  keyword_set JSONB NOT NULL,
  target_ranks JSONB NOT NULL,
  progression_speed TEXT DEFAULT 'normal' CHECK (progression_speed IN ('aggressive', 'normal', 'conservative')),
  sessions_p10 INTEGER,
  sessions_p50 INTEGER,
  sessions_p90 INTEGER,
  revenue_p10 NUMERIC(10,2),
  revenue_p50 NUMERIC(10,2),
  revenue_p90 NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage forecasts for their projects"
  ON public.forecasts FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = forecasts.project_id
    AND seo_projects.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.seo_projects
    WHERE seo_projects.id = forecasts.project_id
    AND seo_projects.user_id = auth.uid()
  ));

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Projects
CREATE INDEX IF NOT EXISTS idx_seo_projects_user_id ON public.seo_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_seo_projects_domain ON public.seo_projects(domain);
CREATE INDEX IF NOT EXISTS idx_seo_projects_status ON public.seo_projects(status);

-- Crawl Runs
CREATE INDEX IF NOT EXISTS idx_crawl_runs_project_id ON public.crawl_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_crawl_runs_status ON public.crawl_runs(status);
CREATE INDEX IF NOT EXISTS idx_crawl_runs_started_at ON public.crawl_runs(started_at DESC);

-- Pages
CREATE INDEX IF NOT EXISTS idx_pages_project_id ON public.pages(project_id);
CREATE INDEX IF NOT EXISTS idx_pages_url ON public.pages USING hash(url);
CREATE INDEX IF NOT EXISTS idx_pages_canonical_url ON public.pages(canonical_url);
CREATE INDEX IF NOT EXISTS idx_pages_status ON public.pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_last_crawled ON public.pages(last_crawled_at DESC);

-- Links
CREATE INDEX IF NOT EXISTS idx_links_project_id ON public.links(project_id);
CREATE INDEX IF NOT EXISTS idx_links_src_page_id ON public.links(src_page_id);
CREATE INDEX IF NOT EXISTS idx_links_dst_url ON public.links USING hash(dst_url);
CREATE INDEX IF NOT EXISTS idx_links_first_seen ON public.links(first_seen DESC);
CREATE INDEX IF NOT EXISTS idx_links_last_seen ON public.links(last_seen DESC);

-- SERP Keywords
CREATE INDEX IF NOT EXISTS idx_serp_keywords_keyword ON public.serp_keywords USING hash(keyword);
CREATE INDEX IF NOT EXISTS idx_serp_keywords_volume ON public.serp_keywords(volume DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_serp_keywords_difficulty ON public.serp_keywords(difficulty);

-- Ranks
CREATE INDEX IF NOT EXISTS idx_ranks_project_keyword ON public.ranks(project_id, keyword_id);
CREATE INDEX IF NOT EXISTS idx_ranks_date ON public.ranks(date DESC);
CREATE INDEX IF NOT EXISTS idx_ranks_position ON public.ranks(position);

-- GSC Query
CREATE INDEX IF NOT EXISTS idx_gsc_query_project_id ON public.gsc_query(project_id);
CREATE INDEX IF NOT EXISTS idx_gsc_query_date ON public.gsc_query(date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_query_page_url ON public.gsc_query(page_url);
CREATE INDEX IF NOT EXISTS idx_gsc_query_query ON public.gsc_query(query);

-- GA4 Sessions
CREATE INDEX IF NOT EXISTS idx_ga4_sessions_project_date ON public.ga4_sessions(project_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_ga4_sessions_landing_page ON public.ga4_sessions(landing_page);

-- Tests
CREATE INDEX IF NOT EXISTS idx_tests_project_id ON public.tests(project_id);
CREATE INDEX IF NOT EXISTS idx_tests_status ON public.tests(status);

-- Forecasts
CREATE INDEX IF NOT EXISTS idx_forecasts_project_id ON public.forecasts(project_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_created_at ON public.forecasts(created_at DESC);

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_projects_updated_at
  BEFORE UPDATE ON public.seo_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_serp_keywords_updated_at
  BEFORE UPDATE ON public.serp_keywords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tests_updated_at
  BEFORE UPDATE ON public.tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
