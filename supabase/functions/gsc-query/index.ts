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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header provided');

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

    // Parse request body
    const body = await req.json();
    const { siteUrl, startDate, endDate, dimensions, rowLimit = 25000, dimensionFilterGroups } = body;

    // Try to get provider_token from database first
    let provider_token = body.provider_token;
    
    if (!provider_token) {
      console.log('🔍 Looking for stored OAuth token in database...');
      const { data: tokenData, error: tokenError } = await supabaseClient
        .from('user_oauth_tokens')
        .select('access_token, refresh_token, expires_at')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single();

      if (tokenError) {
        console.error('❌ Error fetching token from database:', tokenError);
      } else if (tokenData) {
        console.log('✅ Found stored token in database');
        provider_token = tokenData.access_token;
        
        // Check if token is expired
        if (tokenData.expires_at) {
          const expiresAt = new Date(tokenData.expires_at);
          const now = new Date();
          if (expiresAt <= now) {
            console.warn('⚠️ Stored token is expired. User needs to re-authenticate.');
            provider_token = null;
          }
        }
      } else {
        console.log('⚠️ No stored token found in database');
      }
    }

    // Last resort: try to get from session
    if (!provider_token) {
      console.log('🔑 Trying to get token from session...');
      const { data: session } = await supabaseClient.auth.getSession();
      provider_token = session?.session?.provider_token;
      console.log('🔑 Provider token from session:', provider_token ? 'Yes' : 'No');
    }

    if (!provider_token) {
      throw new Error('No Google access token available. Please sign out and sign in again with Google to grant access to Search Console.');
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
          'Authorization': `Bearer ${provider_token}`,
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
