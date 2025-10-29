-- Create table for API usage tracking and rate limiting
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  cost DECIMAL(10, 4) DEFAULT 0,
  request_params JSONB,
  response_status INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_usage_user_endpoint ON api_usage(user_id, endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);

-- Create view for usage statistics
CREATE OR REPLACE VIEW api_usage_stats AS
SELECT 
  user_id,
  endpoint,
  COUNT(*) as total_requests,
  SUM(cost) as total_cost,
  AVG(cost) as avg_cost,
  MAX(created_at) as last_request,
  DATE_TRUNC('hour', created_at) as hour_bucket
FROM api_usage
GROUP BY user_id, endpoint, DATE_TRUNC('hour', created_at);

-- Create function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_hourly_limit INTEGER DEFAULT 100,
  p_daily_limit INTEGER DEFAULT 1000
) RETURNS BOOLEAN AS $$
DECLARE
  v_hourly_count INTEGER;
  v_daily_count INTEGER;
BEGIN
  -- Check hourly limit
  SELECT COUNT(*) INTO v_hourly_count
  FROM api_usage
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND created_at >= NOW() - INTERVAL '1 hour';
  
  IF v_hourly_count >= p_hourly_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Check daily limit
  SELECT COUNT(*) INTO v_daily_count
  FROM api_usage
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND created_at >= NOW() - INTERVAL '24 hours';
  
  IF v_daily_count >= p_daily_limit THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create table for caching DataForSEO responses
CREATE TABLE IF NOT EXISTS dataforseo_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  endpoint TEXT NOT NULL,
  request_params JSONB NOT NULL,
  response_data JSONB NOT NULL,
  ttl_seconds INTEGER DEFAULT 86400,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Create index for cache lookups
CREATE INDEX IF NOT EXISTS idx_cache_key ON dataforseo_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON dataforseo_cache(expires_at);

-- Create function to get cached data
CREATE OR REPLACE FUNCTION get_cached_dataforseo(
  p_cache_key TEXT
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT response_data INTO v_result
  FROM dataforseo_cache
  WHERE cache_key = p_cache_key
    AND expires_at > NOW();
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to set cache
CREATE OR REPLACE FUNCTION set_dataforseo_cache(
  p_cache_key TEXT,
  p_endpoint TEXT,
  p_request_params JSONB,
  p_response_data JSONB,
  p_ttl_seconds INTEGER DEFAULT 86400
) RETURNS VOID AS $$
BEGIN
  INSERT INTO dataforseo_cache (
    cache_key,
    endpoint,
    request_params,
    response_data,
    ttl_seconds,
    expires_at
  ) VALUES (
    p_cache_key,
    p_endpoint,
    p_request_params,
    p_response_data,
    p_ttl_seconds,
    NOW() + (p_ttl_seconds || ' seconds')::INTERVAL
  )
  ON CONFLICT (cache_key) DO UPDATE SET
    response_data = EXCLUDED.response_data,
    expires_at = EXCLUDED.expires_at,
    created_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean expired cache
CREATE OR REPLACE FUNCTION clean_expired_cache() RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM dataforseo_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataforseo_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_usage
CREATE POLICY "Users can view own usage" ON api_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON api_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for cache (service role only)
CREATE POLICY "Service role full access cache" ON dataforseo_cache
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON api_usage TO authenticated;
GRANT INSERT ON api_usage TO authenticated;
GRANT SELECT ON api_usage_stats TO authenticated;
GRANT ALL ON dataforseo_cache TO service_role;

-- Comments
COMMENT ON TABLE api_usage IS 'Tracks DataForSEO API usage for rate limiting and cost tracking';
COMMENT ON TABLE dataforseo_cache IS 'Caches DataForSEO API responses to reduce costs';
COMMENT ON FUNCTION check_rate_limit IS 'Checks if user has exceeded rate limits';
COMMENT ON FUNCTION get_cached_dataforseo IS 'Retrieves cached DataForSEO response if not expired';
COMMENT ON FUNCTION set_dataforseo_cache IS 'Stores DataForSEO response in cache';
COMMENT ON FUNCTION clean_expired_cache IS 'Removes expired cache entries';
