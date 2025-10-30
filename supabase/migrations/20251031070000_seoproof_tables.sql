-- SERPProof Feature: Database Tables
-- Changelog, SEO Tests, and supporting tables for the premium testing feature
-- Migration: 20251031070000

-- 1. Changelog table (site change tracking)
CREATE TABLE IF NOT EXISTS public.changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for changelog
CREATE INDEX IF NOT EXISTS idx_changelog_user_id ON public.changelog(user_id);
CREATE INDEX IF NOT EXISTS idx_changelog_date ON public.changelog(date);
CREATE INDEX IF NOT EXISTS idx_changelog_created_at ON public.changelog(created_at);

-- 2. SEO Tests table (test definitions and status)
CREATE TABLE IF NOT EXISTS public.seo_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('time', 'split')),
  title TEXT NOT NULL,
  definition JSONB NOT NULL, -- Test configuration
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for seo_tests
CREATE INDEX IF NOT EXISTS idx_seo_tests_user_id ON public.seo_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_seo_tests_type ON public.seo_tests(type);
CREATE INDEX IF NOT EXISTS idx_seo_tests_status ON public.seo_tests(status);
CREATE INDEX IF NOT EXISTS idx_seo_tests_created_at ON public.seo_tests(created_at);

-- 3. Test Results table (pre/post data and analysis)
CREATE TABLE IF NOT EXISTS public.test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES public.seo_tests(id) ON DELETE CASCADE,
  pre_data JSONB, -- GSC data from pre period
  post_data JSONB, -- GSC data from post period
  summary JSONB, -- Computed uplift metrics
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for test_results
CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON public.test_results(test_id);

-- 4. Enable RLS on all tables
ALTER TABLE public.changelog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Changelog policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'changelog'
    AND policyname = 'Users can view own changelog'
  ) THEN
    CREATE POLICY "Users can view own changelog" ON public.changelog
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'changelog'
    AND policyname = 'Users can insert own changelog'
  ) THEN
    CREATE POLICY "Users can insert own changelog" ON public.changelog
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- SEO Tests policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'seo_tests'
    AND policyname = 'Users can view own tests'
  ) THEN
    CREATE POLICY "Users can view own tests" ON public.seo_tests
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'seo_tests'
    AND policyname = 'Users can insert own tests'
  ) THEN
    CREATE POLICY "Users can insert own tests" ON public.seo_tests
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Test Results policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'test_results'
    AND policyname = 'Users can view own test results'
  ) THEN
    CREATE POLICY "Users can view own test results" ON public.test_results
      FOR SELECT USING (
        auth.uid() = (SELECT user_id FROM public.seo_tests WHERE id = test_id)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'test_results'
    AND policyname = 'Users can insert test results for own tests'
  ) THEN
    CREATE POLICY "Users can insert test results for own tests" ON public.test_results
      FOR INSERT WITH CHECK (
        auth.uid() = (SELECT user_id FROM public.seo_tests WHERE id = test_id)
      );
  END IF;
END $$;

-- 6. Grant permissions
GRANT SELECT, INSERT ON public.changelog TO authenticated;
GRANT SELECT, INSERT ON public.seo_tests TO authenticated;
GRANT SELECT, INSERT ON public.test_results TO authenticated;

-- 7. Add comments for documentation
COMMENT ON TABLE public.changelog IS 'Site changelog entries for tracking changes and annotating SEO test results';
COMMENT ON TABLE public.seo_tests IS 'SEO test definitions and execution status for time-based and split tests';
COMMENT ON TABLE public.test_results IS 'Pre/post period GSC data and computed uplift metrics for SEO tests';

-- 8. Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Add updated_at triggers
DROP TRIGGER IF EXISTS update_changelog_updated_at ON public.changelog;
CREATE TRIGGER update_changelog_updated_at
  BEFORE UPDATE ON public.changelog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_seo_tests_updated_at ON public.seo_tests;
CREATE TRIGGER update_seo_tests_updated_at
  BEFORE UPDATE ON public.seo_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
