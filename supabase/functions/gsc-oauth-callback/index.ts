import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import * as jose from "https://deno.land/x/jose@v5.2.0/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔙 GSC OAuth Callback - Processing OAuth return');

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('❌ OAuth error:', error);
      const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:8080';
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${appUrl}/connections/google/error?error=${encodeURIComponent(error)}`,
        },
      });
    }

    if (!code || !state) {
      console.error('❌ Missing code or state parameter');
      const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:8080';
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${appUrl}/connections/google/error?error=missing_parameters`,
        },
      });
    }

    console.log('✅ Received OAuth code');

    // Verify state JWT
    const jwtSecret = new TextEncoder().encode(
      Deno.env.get('SUPABASE_JWT_SECRET') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let userId: string;
    try {
      const { payload } = await jose.jwtVerify(state, jwtSecret);
      userId = payload.user_id as string;
      console.log('✅ State JWT verified, user_id:', userId);
    } catch (jwtError) {
      console.error('❌ Invalid state JWT:', jwtError);
      const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:8080';
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${appUrl}/connections/google/error?error=invalid_state`,
        },
      });
    }

    // Exchange code for tokens
    console.log('🔄 Exchanging code for tokens...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: Deno.env.get('GOOGLE_REDIRECT_URI') ?? '',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', errorText);
      const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:8080';
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${appUrl}/connections/google/error?error=token_exchange_failed`,
        },
      });
    }

    const tokens = await tokenResponse.json();
    console.log('✅ Tokens received:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();

    // Store tokens in database using service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('💾 Storing tokens in database...');

    // Note: In production, you should encrypt the refresh_token
    // For now, storing as-is but this should be encrypted using pgcrypto
    const { error: upsertError } = await supabaseAdmin
      .from('user_oauth_tokens')
      .upsert({
        user_id: userId,
        provider: 'google',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: expiresAt,
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider',
      });

    if (upsertError) {
      console.error('❌ Error storing tokens:', upsertError);
      const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:8080';
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${appUrl}/connections/google/error?error=storage_failed`,
        },
      });
    }

    console.log('✅ Tokens stored successfully');

    // Redirect back to onboarding to complete property selection
    const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:8080';
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${appUrl}/onboarding?gsc_connected=true`,
      },
    });

  } catch (error) {
    console.error('💥 Error in gsc-oauth-callback:', error);
    const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:8080';
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${appUrl}/connections/google/error?error=unknown`,
      },
    });
  }
});

