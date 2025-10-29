-- Fix user_credits RLS policies to allow INSERT
-- This ensures users can create their own credits record if missing

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can insert own credits" ON user_credits;
DROP POLICY IF EXISTS "Service role can manage credits" ON user_credits;

-- Recreate policies with INSERT permission
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits" ON user_credits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credits" ON user_credits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage credits" ON user_credits
  FOR ALL USING (auth.role() = 'service_role');

-- Grant INSERT permission
GRANT INSERT ON user_credits TO authenticated;

