import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getGoogleToken } from "../_shared/get-google-token.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to query GSC performance data for CTR opportunities
async function queryCTROpportunities(
  accessToken: string,
  siteUrl: string,
  startDate: string,
  endDate: string,
  minImpressions: number = 200,
  maxCtr: number = 0.02
) {
  const requestBody = {
    startDate,
    endDate,
    dimensions: ['query'],
    rowLimit: 25000,
    // Filter for queries with significant impressions but low CTR
    dimensionFilterGroups: [{
      filters: [{
        dimension: 'query',
        operator: 'not',
        expression: '(not set)' // Exclude queries with no impressions
      }]
    }]
  };

  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    throw new Error(`GSC API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Filter and sort by CTR opportunity (high impressions, low CTR)
  const opportunities = (data.rows || [])
    .filter((row: any) => {
      const impressions = row.impressions || 0;
      const ctr = row.ctr || 0;
      return impressions >= minImpressions && ctr <= maxCtr;
    })
    .map((row: any) => ({
      query: row.keys[0],
      impressions: Math.round(row.impressions || 0),
      clicks: Math.round(row.clicks || 0),
      ctr: row.ctr || 0,
      avgPos: row.position || 0
    }))
    .sort((a: any, b: any) => {
      // Sort by opportunity score: (impressions * (1 - ctr)) descending
      const scoreA = a.impressions * (1 - a.ctr);
      const scoreB = b.impressions * (1 - b.ctr);
      return scoreB - scoreA;
    })
    .slice(0, 50); // Return top 50 opportunities

  return opportunities;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Parse query parameters
    const url = new URL(req.url);
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    const minImpr = parseInt(url.searchParams.get('minImpr') || '200');
    const maxCtr = parseFloat(url.searchParams.get('maxCtr') || '0.02');

    if (!start || !end) {
      return new Response(JSON.stringify({ error: 'Start and end dates are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create Supabase client with auth context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get Google access token
    const dbClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const accessToken = await getGoogleToken(dbClient, user.id);
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Google access token not available' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user's GSC property (placeholder for now)
    const siteUrl = 'https://example.com'; // TODO: Get actual GSC property from user

    try {
      // Query CTR opportunities
      const opportunities = await queryCTROpportunities(
        accessToken,
        siteUrl,
        start,
        end,
        minImpr,
        maxCtr
      );

      return new Response(JSON.stringify({ rows: opportunities }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (gscError) {
      console.error('GSC CTR opportunities error:', gscError);
      return new Response(JSON.stringify({
        error: 'Failed to fetch CTR opportunities from GSC',
        details: gscError instanceof Error ? gscError.message : 'Unknown error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('CTR Opportunities API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
