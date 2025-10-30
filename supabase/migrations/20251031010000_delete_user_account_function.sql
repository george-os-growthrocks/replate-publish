-- Function to safely delete user account and all associated data
-- This function requires SECURITY DEFINER to delete auth.users

CREATE OR REPLACE FUNCTION delete_user_account(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check: Only allow users to delete their own account
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'You can only delete your own account';
  END IF;
  
  -- Delete user data from all tables (respecting foreign key constraints)
  -- Tables with ON DELETE CASCADE will be handled automatically
  -- Note: LLM tables (llm_citations, etc.) are linked via project_id and will cascade from seo_projects deletion
  
  -- Explicitly delete from tables that have user_id (those without ON DELETE CASCADE on auth.users)
  DELETE FROM usage_meters WHERE user_id = target_user_id;
  DELETE FROM seats WHERE user_id = target_user_id OR seat_user_id = target_user_id;
  DELETE FROM add_ons WHERE user_id = target_user_id;
  DELETE FROM overage_events WHERE user_id = target_user_id;
  
  -- Delete seo_projects first - this will cascade to:
  -- - llm_citations (via project_id ON DELETE CASCADE)
  -- - llm_tracking_queries (via project_id ON DELETE CASCADE)
  -- - llm_citation_history (via project_id ON DELETE CASCADE)
  -- - llm_competitors (via project_id ON DELETE CASCADE)
  -- - tracked_keywords (if they reference project_id)
  DELETE FROM seo_projects WHERE user_id = target_user_id;
  
  DELETE FROM user_profiles WHERE user_id = target_user_id;
  DELETE FROM user_subscriptions WHERE user_id = target_user_id;
  DELETE FROM user_credits WHERE user_id = target_user_id;
  DELETE FROM credit_transactions WHERE user_id = target_user_id;
  DELETE FROM user_oauth_tokens WHERE user_id = target_user_id;
  DELETE FROM user_feature_access WHERE user_id = target_user_id;
  DELETE FROM free_tool_usage WHERE user_id = target_user_id;
  DELETE FROM industry_intelligence WHERE user_id = target_user_id;
  DELETE FROM user_activity_log WHERE user_id = target_user_id;
  DELETE FROM chatbot_conversations WHERE user_id = target_user_id;
  
  -- Delete from tables that may or may not exist, or may not have user_id column
  -- Catch any errors (undefined_table, undefined_column, etc.) and continue
  
  BEGIN
    DELETE FROM ai_overview_rankings WHERE user_id = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Table or column doesn't exist, skip
  END;
  
  BEGIN
    DELETE FROM chatgpt_citations WHERE user_id = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    DELETE FROM atp_queries_cache WHERE user_id = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    DELETE FROM analysis_history WHERE user_id = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    DELETE FROM google_analytics_connections WHERE user_id = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    DELETE FROM google_analytics_reports WHERE user_id = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    DELETE FROM dataforseo_rate_limits WHERE user_id = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Delete keyword_rankings and tracked_keywords (they have user_id and ON DELETE CASCADE)
  BEGIN
    DELETE FROM keyword_rankings WHERE user_id = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    DELETE FROM tracked_keywords WHERE user_id = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Delete auth user (requires admin/service role)
  -- This will cascade to all tables with ON DELETE CASCADE
  DELETE FROM auth.users WHERE id = target_user_id;
  
  -- Note: Some tables may still have data if they don't have foreign keys
  -- The function above explicitly deletes them to be safe
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't expose sensitive details
    RAISE WARNING 'Error deleting user account %: %', target_user_id, SQLERRM;
    RAISE;
END;
$$;

-- Grant execute permission to authenticated users on their own account
GRANT EXECUTE ON FUNCTION delete_user_account(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION delete_user_account(UUID) IS 'Safely deletes a user account and all associated data. Can only be called by the user themselves or with admin privileges.';

