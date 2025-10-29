-- Function to manually save OAuth token from session
-- Run this AFTER you've signed in with Google

-- Create a function that you can call to save the current session's provider_token
CREATE OR REPLACE FUNCTION public.save_current_oauth_token()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_provider_token text;
  v_result json;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Note: We can't directly access provider_token from SQL
  -- This needs to be called from an edge function or client with the token
  
  RETURN json_build_object(
    'success', false, 
    'error', 'Use the client-side method to save token',
    'user_id', v_user_id
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.save_current_oauth_token() TO authenticated;
