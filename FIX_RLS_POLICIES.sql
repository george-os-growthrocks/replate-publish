-- ============================================================================
-- FIX RLS POLICIES FOR USER_CREDITS TABLE
-- Run this in Supabase SQL Editor to fix 406/403 errors
-- ============================================================================

-- Enable RLS on user_credits table
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can insert their own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can update their own credits" ON user_credits;
DROP POLICY IF EXISTS "Service role can manage all credits" ON user_credits;

-- Create policy for users to view their own credits
CREATE POLICY "Users can view their own credits"
ON user_credits FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create policy for users to insert their own credits (needed for auto-creation)
CREATE POLICY "Users can insert their own credits"
ON user_credits FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create policy for service role to manage all credits
CREATE POLICY "Service role can manage all credits"
ON user_credits FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_credits TO authenticated;
GRANT ALL ON user_credits TO service_role;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- Verify the policies are in place
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_credits';

-- Test query (should work if user is authenticated)
SELECT * FROM user_credits WHERE user_id = auth.uid();

COMMIT;

