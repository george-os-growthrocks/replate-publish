/**
 * Google OAuth Token Refresh Utility
 * Automatically refreshes expired Google OAuth tokens using the refresh token
 */

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope?: string;
  token_type?: string;
}

/**
 * Refreshes a Google OAuth token if it's expired or about to expire
 * @param userId - The Supabase user ID
 * @param supabaseAdmin - Supabase client with admin/service role permissions
 * @returns void - Updates the token in the database
 * @throws Error if refresh fails or no refresh token exists
 */
export async function refreshGoogleToken(
  userId: string,
  supabaseAdmin: any
): Promise<void> {
  console.log(`🔄 Checking if token refresh needed for user: ${userId}`);

  // Fetch current token data
  const { data: tokenData, error: tokenError } = await supabaseAdmin
    .from('user_oauth_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .maybeSingle();

  if (tokenError) {
    console.error('❌ Error fetching token data:', tokenError);
    throw new Error(`Failed to fetch token data: ${tokenError.message}`);
  }

  if (!tokenData) {
    console.error('❌ No token data found for user');
    throw new Error('No Google OAuth token found. Please sign in with Google.');
  }

  if (!tokenData.refresh_token) {
    console.error('❌ No refresh token available');
    throw new Error('No refresh token available. Please re-authenticate with Google.');
  }

  // Check if token is expired or will expire soon (within 5 minutes)
  const expiresAt = tokenData.expires_at ? new Date(tokenData.expires_at) : null;
  const now = new Date();
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

  if (expiresAt && expiresAt > fiveMinutesFromNow) {
    console.log('✅ Token still valid, no refresh needed');
    console.log(`   Expires at: ${expiresAt.toISOString()}`);
    console.log(`   Current time: ${now.toISOString()}`);
    return; // Token is still valid for at least 5 more minutes
  }

  console.log('🔄 Token expired or expiring soon, refreshing...');
  if (expiresAt) {
    console.log(`   Token expires at: ${expiresAt.toISOString()}`);
  }

  // Get Google OAuth credentials from environment
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    console.error('❌ Missing Google OAuth credentials in environment');
    throw new Error('Google OAuth credentials not configured. Contact support.');
  }

  // Refresh the token via Google OAuth API
  try {
    console.log('📡 Calling Google OAuth token refresh endpoint...');
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Google token refresh failed:', response.status, errorText);
      throw new Error(`Google token refresh failed: ${response.status} ${errorText}`);
    }

    const newTokens: GoogleTokenResponse = await response.json();
    console.log('✅ Received new access token from Google');
    console.log(`   Expires in: ${newTokens.expires_in} seconds`);

    // Calculate new expiry time
    const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);

    // Update database with new token
    const { error: updateError } = await supabaseAdmin
      .from('user_oauth_tokens')
      .update({
        access_token: newTokens.access_token,
        expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', 'google');

    if (updateError) {
      console.error('❌ Error updating token in database:', updateError);
      throw new Error(`Failed to update token: ${updateError.message}`);
    }

    console.log('✅ Token refreshed and updated in database');
    console.log(`   New expiry: ${newExpiresAt.toISOString()}`);
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to refresh Google OAuth token');
  }
}

