-- Add missing columns to google_api_settings
ALTER TABLE public.google_api_settings
ADD COLUMN IF NOT EXISTS last_gsc_sync TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_ga4_sync TIMESTAMP WITH TIME ZONE;

-- Add usage_count to api_keys
ALTER TABLE public.api_keys
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Add notification columns to user_settings
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_frequency TEXT DEFAULT 'daily';

-- Create internal_linking_analyses table
CREATE TABLE IF NOT EXISTS public.internal_linking_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  analysis_name TEXT NOT NULL,
  total_pages_crawled INTEGER DEFAULT 0,
  total_keywords_extracted INTEGER DEFAULT 0,
  total_opportunities_found INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending'
);

-- Create internal_linking_opportunities table
CREATE TABLE IF NOT EXISTS public.internal_linking_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.internal_linking_analyses(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  source_page TEXT NOT NULL,
  target_page TEXT NOT NULL,
  anchor_text TEXT,
  relevance_score NUMERIC,
  opportunity_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create internal_linking_pages table
CREATE TABLE IF NOT EXISTS public.internal_linking_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.internal_linking_analyses(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.seo_projects(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  keywords JSONB DEFAULT '[]'::jsonb,
  outbound_links INTEGER DEFAULT 0,
  inbound_links INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.internal_linking_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_linking_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_linking_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage analyses for their projects"
  ON public.internal_linking_analyses FOR ALL
  USING (EXISTS (SELECT 1 FROM seo_projects WHERE seo_projects.id = internal_linking_analyses.project_id AND seo_projects.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM seo_projects WHERE seo_projects.id = internal_linking_analyses.project_id AND seo_projects.user_id = auth.uid()));

CREATE POLICY "Users can manage opportunities for their projects"
  ON public.internal_linking_opportunities FOR ALL
  USING (EXISTS (SELECT 1 FROM seo_projects WHERE seo_projects.id = internal_linking_opportunities.project_id AND seo_projects.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM seo_projects WHERE seo_projects.id = internal_linking_opportunities.project_id AND seo_projects.user_id = auth.uid()));

CREATE POLICY "Users can manage pages for their projects"
  ON public.internal_linking_pages FOR ALL
  USING (EXISTS (SELECT 1 FROM seo_projects WHERE seo_projects.id = internal_linking_pages.project_id AND seo_projects.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM seo_projects WHERE seo_projects.id = internal_linking_pages.project_id AND seo_projects.user_id = auth.uid()));