-- Fix RLS policy for tracked_keywords table to allow inserts
-- The original policy was missing WITH CHECK clause which is required for INSERT operations

DROP POLICY IF EXISTS "Users can manage their tracked keywords" ON tracked_keywords;

CREATE POLICY "Users can manage their tracked keywords"
  ON tracked_keywords FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

