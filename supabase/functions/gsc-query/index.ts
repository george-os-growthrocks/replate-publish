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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body first
    const body = await req.json();
    const { siteUrl, startDate, endDate, dimensions, rowLimit = 25000, dimensionFilterGroups } = body;
    let providerToken = body.provider_token;

    console.log('📥 Provider token from request body:', providerToken ? 'Yes' : 'No');

    // If provider_token is provided in body, use it directly (skip user auth)
    if (!providerToken) {
      // No provider_token in body, need to authenticate and get from database
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('No authorization header and no provider_token provided');
      }

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader },
          },
        }
      );

      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (userError) throw new Error(`Auth error: ${userError.message}`);
      if (!user) throw new Error('Unauthorized - no user found');

      console.log('✅ User authenticated:', user.id);
      
      // Get provider_token from database
      console.log('🔍 Looking for stored OAuth token in database...');
      const { data: tokenData, error: tokenError } = await supabaseClient
        .from('user_oauth_tokens')
        .select('access_token, refresh_token, expires_at')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single();

      if (tokenError || !tokenData) {
        throw new Error('No stored OAuth token found. Please sign in with Google.');
      }

      console.log('✅ Found stored token in database');
      
      // Check if token is expired
      if (tokenData.expires_at) {
        const expiresAt = new Date(tokenData.expires_at);
        const now = new Date();
        if (expiresAt <= now) {
          throw new Error('OAuth token expired. Please sign in with Google again.');
        }
      }
      
      providerToken = tokenData.access_token;
    }

    if (!providerToken) {
      throw new Error('No Google access token available.');
    }

    if (!siteUrl || !startDate || !endDate) {
      throw new Error('Missing required parameters');
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

    if (!response.ok) {
      const error = await response.text();
      console.error('GSC query API error:', error);
      throw new Error(`Failed to query data from Google Search Console (${response.status})`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in gsc-query function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString(),
      }), 
      {
        status: 400, // Return 400 for client errors
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
