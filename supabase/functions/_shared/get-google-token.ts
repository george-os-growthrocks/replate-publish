// Shared utility to get Google OAuth token from database or session
// Import this in any edge function that needs Google API access

export async function getGoogleToken(supabaseClient: any, userId: string): Promise<string | null> {
  console.log('🔍 Looking for stored OAuth token in database...');
  
  const { data: tokenData, error: tokenError } = await supabaseClient
    .from('user_oauth_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();

  if (tokenError) {
    console.error('❌ Error fetching token from database:', tokenError);
    return null;
  }
  
  if (!tokenData) {
    console.log('⚠️ No stored token found in database');
    return null;
  }
  
  console.log('✅ Found stored token in database');
  
  // Check if token is expired
  if (tokenData.expires_at) {
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    if (expiresAt <= now) {
      console.warn('⚠️ Stored token is expired. User needs to re-authenticate.');
      return null;
    }
  }
  
  return tokenData.access_token;
}

export async function getGoogleTokenWithFallback(
  supabaseClient: any, 
  userId: string, 
  requestBodyToken?: string
): Promise<string> {
  // 1. Try request body first (if provided)
  if (requestBodyToken) {
    console.log('✅ Using token from request body');
    return requestBodyToken;
  }
  
  // 2. Try database
  let token = await getGoogleToken(supabaseClient, userId);
  if (token) return token;
  
  // 3. Last resort: try session (rarely works)
  console.log('🔑 Trying to get token from session...');
  const { data: session } = await supabaseClient.auth.getSession();
  token = session?.session?.provider_token;
  console.log('🔑 Provider token from session:', token ? 'Yes' : 'No');
  
  if (!token) {
    throw new Error('No Google access token available. Please sign out and sign in again with Google to grant access to Search Console.');
  }
  
  return token;
}

