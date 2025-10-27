import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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

    const { provider_token, siteUrl, startDate, endDate, dimensions, rowLimit = 25000, dimensionFilterGroups } = await req.json();

    if (!provider_token) {
      throw new Error('No Google access token provided. Please sign out and sign in again with Google.');
    }

    if (!siteUrl || !startDate || !endDate) {
      throw new Error('Missing required parameters');
    }

    const requestBody: any = {
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
  } catch (error) {
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
        status: 200, // Return 200 so the client can read the error details
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
