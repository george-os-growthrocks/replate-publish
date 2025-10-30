import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import * as jose from "https://deno.land/x/jose@v5.2.0/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
};

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 GSC OAuth Start - VERSION 3 - NO AUTH');
    console.log('Request URL:', req.url);

    // Extract user_id from query parameter (user is authenticated on frontend)
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      console.log('❌ No user_id parameter found in URL');
      return new Response(
        JSON.stringify({ error: 'Missing user_id parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Using user_id:', userId);

    // Create signed state JWT (short-lived, 10 minutes)
    const jwtSecret = new TextEncoder().encode(
      Deno.env.get('SUPABASE_JWT_SECRET') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const state = await new jose.SignJWT({ user_id: userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(jwtSecret);

    console.log('🔑 Created signed state JWT');

    // Build Google OAuth URL
    const params = new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
      redirect_uri: Deno.env.get('GOOGLE_REDIRECT_URI') ?? '',
      response_type: 'code',
      scope: [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/webmasters.readonly',
      ].join(' '),
      access_type: 'offline',
      prompt: 'consent', // Force consent to get refresh token
      state,
    });

    const oauthUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
    console.log('🔗 Built Google OAuth URL');

    // Return success response with redirect URL
    return new Response(
      JSON.stringify({
        message: 'OAuth URL generated successfully',
        redirect_url: oauthUrl,
        state: state
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('💥 Error in gsc-oauth-start:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to start OAuth flow'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

