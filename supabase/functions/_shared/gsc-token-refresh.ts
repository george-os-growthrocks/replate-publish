/**
 * GSC Token Refresh Helper
 * Ensures fresh Google access tokens for API calls by auto-refreshing when needed
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

interface TokenData {
  access_token: string;
  refresh_token: string | null;
  expires_at: string;
}

interface RefreshResponse {
  access_token: string;
  expires_in: number;
  scope?: string;
  token_type?: string;
}

/**
 * Get a fresh Google access token for the user
 * Auto-refreshes if token expires within 5 minutes
 * 
 * @param supabaseAdmin - Supabase client with service role key
 * @param userId - User ID to get token for
 * @returns Fresh access token
 * @throws Error if token refresh fails or no refresh token available
 */
export async function getFreshGoogleToken(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<string> {
  console.log('🔍 Getting Google token for user:', userId);

  // Get current token from database
  const { data: tokenData, error: fetchError } = await supabaseAdmin
    .from('user_oauth_tokens')
    .select('access_token, refresh_token, encrypted_refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();

  if (fetchError || !tokenData) {
    console.error('❌ No Google token found for user:', userId);
    throw new Error('Google Search Console not connected. Please connect your account first.');
  }

  const token = tokenData as TokenData & { encrypted_refresh_token?: string };

  // Check if token is still valid (with 5-minute buffer)
  const expiresAt = new Date(token.expires_at);
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

  if (expiresAt > fiveMinutesFromNow) {
    console.log('✅ Existing token is still valid');
    return token.access_token;
  }

  // Token expired or expiring soon, need to refresh
  console.log('🔄 Token expired or expiring soon, refreshing...');

  // Get refresh token (try encrypted first, fallback to plaintext for backward compatibility)
  let refreshToken: string | null = null;
  
  if (token.encrypted_refresh_token) {
    // Decrypt refresh token using pgcrypto function
    try {
      const encryptionKey = Deno.env.get('REFRESH_TOKEN_ENCRYPTION_KEY') ?? 'CHANGE_THIS_KEY_IN_PRODUCTION_USE_ENV_VAR';
      const { data: decrypted } = await supabaseAdmin.rpc('decrypt_refresh_token', {
        encrypted_token: token.encrypted_refresh_token,
        encryption_key: encryptionKey
      });
      refreshToken = decrypted;
    } catch (error) {
      console.error('❌ Failed to decrypt refresh token:', error);
    }
  } else if (token.refresh_token) {
    // Fallback to plaintext (for backward compatibility)
    refreshToken = token.refresh_token;
  }

  if (!refreshToken) {
    console.error('❌ No refresh token available for user:', userId);
    throw new Error('No refresh token available. Please reconnect your Google Search Console account.');
  }

  // Refresh the token
  try {
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error('❌ Token refresh failed:', errorText);
      throw new Error('Failed to refresh Google token. Please reconnect your account.');
    }

    const refreshData: RefreshResponse = await refreshResponse.json();
    console.log('✅ Token refreshed successfully');

    // Calculate new expiry
    const newExpiresAt = new Date(Date.now() + (refreshData.expires_in ?? 3600) * 1000).toISOString();

    // Update token in database
    const { error: updateError } = await supabaseAdmin
      .from('user_oauth_tokens')
      .update({
        access_token: refreshData.access_token,
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', 'google');

    if (updateError) {
      console.error('❌ Failed to update token in database:', updateError);
      // Don't throw - we have the token, just log the error
    } else {
      console.log('✅ Token updated in database');
    }

    return refreshData.access_token;

  } catch (error) {
    console.error('💥 Error refreshing token:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to refresh Google token. Please reconnect your account.'
    );
  }
}

/**
 * Check if user has Google Search Console connected
 * 
 * @param supabaseAdmin - Supabase client with service role key
 * @param userId - User ID to check
 * @returns boolean indicating if GSC is connected
 */
export async function hasGoogleTokens(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('user_oauth_tokens')
    .select('id')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();

  return !error && !!data;
}

/**
 * Revoke Google tokens (for disconnect/logout)
 * 
 * @param supabaseAdmin - Supabase client with service role key
 * @param userId - User ID to revoke tokens for
 */
export async function revokeGoogleTokens(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<void> {
  console.log('🗑️ Revoking Google tokens for user:', userId);

  // Get current token
  const { data: tokenData } = await supabaseAdmin
    .from('user_oauth_tokens')
    .select('access_token')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();

  if (tokenData) {
    // Revoke token with Google
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${tokenData.access_token}`, {
        method: 'POST',
      });
      console.log('✅ Token revoked with Google');
    } catch (error) {
      console.error('⚠️ Failed to revoke token with Google:', error);
      // Continue anyway - we'll delete from our DB
    }
  }

  // Delete from database
  const { error: deleteError } = await supabaseAdmin
    .from('user_oauth_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'google');

  if (deleteError) {
    console.error('❌ Failed to delete token from database:', deleteError);
    throw new Error('Failed to disconnect Google Search Console');
  }

  console.log('✅ Tokens removed from database');
}

