import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Deno global type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  console.log('🚀 GSC Query function called with method:', req.method);

  if (req.method === 'OPTIONS') {
    console.log('📋 Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 Starting request processing...');
    // Parse request body first
    const body = await req.json();
    const { siteUrl, startDate, endDate, dimensions, rowLimit = 25000, dimensionFilterGroups } = body;
    let providerToken = body.provider_token;

    console.log('📥 Request body:', { siteUrl, startDate, endDate, dimensions, rowLimit, hasProviderToken: !!providerToken });
    console.log('📥 Provider token from request body:', providerToken ? 'Yes' : 'No');

    // If provider_token is provided in body, use it directly (skip user auth)
    if (!providerToken) {
      // No provider_token in body, need to authenticate and get from database
      const authHeader = req.headers.get('Authorization');
      console.log('🔐 Auth header present:', !!authHeader);

      if (!authHeader) {
        throw new Error('No authorization header and no provider_token provided');
      }

      // In Supabase edge functions, we need to decode the JWT manually
      // The Authorization header contains a JWT that we can decode to get user info
      const token = authHeader.replace('Bearer ', '');
      console.log('🔐 Token received, attempting to decode...');

      // For Supabase edge functions, we can use the built-in JWT verification
      // or decode the JWT payload directly since Supabase validates it at the edge
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.sub;

        if (!userId) {
          throw new Error('Invalid token: no user ID found');
        }

        console.log('✅ User authenticated via JWT:', userId);

        // Now we can use the userId to query the database
        // We'll create a new client for database operations
        const dbClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Get provider_token from database
        console.log('🔍 Looking for stored OAuth token in database...');
        const { data: tokenData, error: tokenError } = await dbClient
          .from('user_oauth_tokens')
          .select('access_token, refresh_token, expires_at, scopes')
          .eq('user_id', userId)
          .eq('provider', 'google')
          .single();

        console.log('🔍 Token query result:', {
          hasData: !!tokenData,
          error: tokenError?.message,
          hasAccessToken: !!tokenData?.access_token,
          expiresAt: tokenData?.expires_at
        });

        if (tokenError || !tokenData) {
          throw new Error(`No stored OAuth token found. Token error: ${tokenError?.message || 'No data returned'}`);
        }

        console.log('✅ Found stored token in database');

        // Check if token is expired
        if (tokenData.expires_at) {
          const expiresAt = new Date(tokenData.expires_at);
          const now = new Date();
          const isExpired = expiresAt <= now;
          console.log('⏰ Token expiry check:', {
            expiresAt: expiresAt.toISOString(),
            now: now.toISOString(),
            isExpired
          });

          if (isExpired) {
            throw new Error('OAuth token expired. Please sign in with Google again.');
          }
        }

        providerToken = tokenData.access_token;
      } catch (jwtError) {
        console.error('❌ JWT decoding error:', jwtError);
        throw new Error(`Authentication failed: ${jwtError instanceof Error ? jwtError.message : 'Invalid token'}`);
      }
    }

    if (!providerToken) {
      throw new Error('No Google access token available.');
    }

    console.log('✅ Token available, validating parameters...');
    console.log('📋 Parameters:', { siteUrl, startDate, endDate, dimensions });

    if (!siteUrl || !startDate || !endDate) {
      throw new Error(`Missing required parameters: siteUrl=${!!siteUrl}, startDate=${!!startDate}, endDate=${!!endDate}`);
    }

    const requestBody: {
      startDate: string;
      endDate: string;
      dimensions: string[];
      rowLimit: number;
      startRow: number;
      dimensionFilterGroups?: unknown;
    } = {
      startDate,
      endDate,
      dimensions: dimensions || ['date'],
      rowLimit,
      startRow: 0,
    };

    if (dimensionFilterGroups) {
      requestBody.dimensionFilterGroups = dimensionFilterGroups;
    }

    console.log('🌐 Making GSC API call to:', `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`);
    console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${providerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log('📥 GSC API response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('GSC query API error:', error);
      throw new Error(`Failed to query data from Google Search Console (${response.status}): ${error}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('❌ Error in gsc-query function:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error instanceof Error:', error instanceof Error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('❌ Final error message:', errorMessage);

    return new Response(
      JSON.stringify({
        error: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString(),
        details: {
          errorType: typeof error,
          isErrorInstance: error instanceof Error,
          originalError: error
        }
      }),
      {
        status: 400, // Return 400 for client errors
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
