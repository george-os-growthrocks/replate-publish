-- USER OAUTH TOKENS TABLE
-- Store Google OAuth tokens for GSC API access

-- Handle potential column name inconsistency
DO $$
BEGIN
    -- Rename column if it exists as 'scope' instead of 'scopes'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_oauth_tokens'
        AND column_name = 'scope'
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_oauth_tokens'
        AND column_name = 'scopes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE user_oauth_tokens RENAME COLUMN scope TO scopes;
        -- Convert single text value to array if needed
        UPDATE user_oauth_tokens SET scopes = ARRAY[scopes] WHERE scopes IS NOT NULL AND array_length(scopes, 1) IS NULL;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS user_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scopes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, provider)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_oauth_tokens_user ON user_oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_oauth_tokens_provider ON user_oauth_tokens(provider);
CREATE INDEX IF NOT EXISTS idx_user_oauth_tokens_expires ON user_oauth_tokens(expires_at);

-- RLS Policies
ALTER TABLE user_oauth_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own tokens" ON user_oauth_tokens;
DROP POLICY IF EXISTS "Users can insert their own tokens" ON user_oauth_tokens;
DROP POLICY IF EXISTS "Users can update their own tokens" ON user_oauth_tokens;
DROP POLICY IF EXISTS "Users can delete their own tokens" ON user_oauth_tokens;

CREATE POLICY "Users can view their own tokens" ON user_oauth_tokens
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own tokens" ON user_oauth_tokens
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tokens" ON user_oauth_tokens
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own tokens" ON user_oauth_tokens
  FOR DELETE
  USING (user_id = auth.uid());

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_oauth_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_oauth_tokens_updated_at_trigger ON user_oauth_tokens;
CREATE TRIGGER update_user_oauth_tokens_updated_at_trigger
  BEFORE UPDATE ON user_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_user_oauth_tokens_updated_at();

