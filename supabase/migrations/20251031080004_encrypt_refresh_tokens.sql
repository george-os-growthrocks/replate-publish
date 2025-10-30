-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted_refresh_token column
ALTER TABLE user_oauth_tokens
ADD COLUMN IF NOT EXISTS encrypted_refresh_token BYTEA;

-- Function to encrypt refresh token
CREATE OR REPLACE FUNCTION encrypt_refresh_token()
RETURNS TRIGGER AS $$
BEGIN
  -- Only encrypt if refresh_token is provided and not already encrypted
  IF NEW.refresh_token IS NOT NULL AND NEW.encrypted_refresh_token IS NULL THEN
    -- Get encryption key from environment or use a secure default
    -- In production, use: Deno.env.get('REFRESH_TOKEN_ENCRYPTION_KEY')
    -- For now, using a placeholder - MUST be changed in production
    NEW.encrypted_refresh_token = pgp_sym_encrypt(
      NEW.refresh_token,
      COALESCE(
        current_setting('app.refresh_token_key', true),
        'CHANGE_THIS_KEY_IN_PRODUCTION_USE_ENV_VAR'
      )
    );
    -- Clear plaintext refresh_token
    NEW.refresh_token = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-encrypt on insert/update
DROP TRIGGER IF EXISTS encrypt_refresh_token_trigger ON user_oauth_tokens;
CREATE TRIGGER encrypt_refresh_token_trigger
  BEFORE INSERT OR UPDATE ON user_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_refresh_token();

-- Function to decrypt refresh token (for Edge Functions)
CREATE OR REPLACE FUNCTION decrypt_refresh_token(encrypted_token BYTEA, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_token, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migrate existing plaintext refresh tokens to encrypted
DO $$
DECLARE
  token_record RECORD;
  encryption_key TEXT;
BEGIN
  encryption_key := COALESCE(
    current_setting('app.refresh_token_key', true),
    'CHANGE_THIS_KEY_IN_PRODUCTION_USE_ENV_VAR'
  );
  
  FOR token_record IN 
    SELECT id, refresh_token 
    FROM user_oauth_tokens 
    WHERE refresh_token IS NOT NULL 
      AND encrypted_refresh_token IS NULL
  LOOP
    UPDATE user_oauth_tokens
    SET encrypted_refresh_token = pgp_sym_encrypt(token_record.refresh_token, encryption_key),
        refresh_token = NULL
    WHERE id = token_record.id;
  END LOOP;
  
  RAISE NOTICE 'Migrated % refresh tokens to encrypted format', 
    (SELECT COUNT(*) FROM user_oauth_tokens WHERE encrypted_refresh_token IS NOT NULL);
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION decrypt_refresh_token(BYTEA, TEXT) TO service_role;

-- Comments
COMMENT ON COLUMN user_oauth_tokens.encrypted_refresh_token IS 'Encrypted refresh token using pgcrypto';
COMMENT ON FUNCTION encrypt_refresh_token() IS 'Automatically encrypts refresh_token before storing';
COMMENT ON FUNCTION decrypt_refresh_token(BYTEA, TEXT) IS 'Decrypts refresh token for Edge Functions (service role only)';

-- Security notes
COMMENT ON TABLE user_oauth_tokens IS 'OAuth tokens with encrypted refresh tokens. 
IMPORTANT: Set app.refresh_token_key in postgresql.conf or use ALTER DATABASE ... SET app.refresh_token_key = ''your-secret-key'';
In production, generate a secure random key: openssl rand -base64 32';

RAISE NOTICE '⚠️  IMPORTANT: Set encryption key in production!';
RAISE NOTICE 'Method 1: ALTER DATABASE your_db SET app.refresh_token_key = ''your-secure-key'';';
RAISE NOTICE 'Method 2: Add to postgresql.conf: app.refresh_token_key = ''your-secure-key''';
RAISE NOTICE 'Generate key: openssl rand -base64 32';

