-- Fix OAuth scopes column name inconsistency
-- This migration ensures the column is named 'scopes' (plural) not 'scope' (singular)

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
        UPDATE user_oauth_tokens SET scopes = ARRAY[scopes] WHERE scopes IS NOT NULL;
    END IF;

    -- Add the scopes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_oauth_tokens'
        AND column_name = 'scopes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE user_oauth_tokens ADD COLUMN scopes TEXT[];
    END IF;
END $$;
