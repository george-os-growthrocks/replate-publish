import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getGoogleToken } from "../_shared/get-google-token.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to compute uplift summary
function summarizeUplift(pre: any[], post: any[]): any {
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const preClicks = sum(pre.map(p => p.clicks || 0));
  const postClicks = sum(post.map(p => p.clicks || 0));
  const preImpr = sum(pre.map(p => p.impressions || 0));
  const postImpr = sum(post.map(p => p.impressions || 0));
  const preCtr = preImpr > 0 ? preClicks / preImpr : 0;
  const postCtr = postImpr > 0 ? postClicks / postImpr : 0;
  const prePos = pre.length ? sum(pre.map(p => p.position || 0)) / pre.length : 0;
  const postPos = post.length ? sum(post.map(p => p.position || 0)) / post.length : 0;

  const clicksPct = preClicks ? (postClicks - preClicks) / preClicks : 0;
  const imprPct = preImpr ? (postImpr - preImpr) / preImpr : 0;
  const ctrPct = preCtr ? (postCtr - preCtr) / preCtr : 0;
  const posPct = prePos ? (prePos - postPos) / prePos : 0; // improvement when going down

  // Rough significance heuristic
  const sample = Math.min(pre.length, post.length);
  const effect = Math.abs(clicksPct) + Math.abs(ctrPct) * 0.7;
  let significance: 'low' | 'medium' | 'high' = 'low';
  if (sample >= 14 && effect > 0.15) significance = 'medium';
  if (sample >= 21 && effect > 0.30) significance = 'high';

  return {
    clicks: { delta: postClicks - preClicks, pct: clicksPct },
    impressions: { delta: postImpr - preImpr, pct: imprPct },
    ctr: { delta: postCtr - preCtr, pct: ctrPct },
    position: { delta: postPos - prePos, pct: posPct },
    significance,
  };
}

// Helper function to query GSC performance data
async function queryGSCPerformance(
  accessToken: string,
  siteUrl: string,
  startDate: string,
  endDate: string,
  dimension: 'page' | 'query' = 'page',
  target?: string
) {
  const requestBody = {
    startDate,
    endDate,
    dimensions: [dimension === 'query' ? 'query' : 'page', 'date'],
    rowLimit: 25000,
    ...(target && dimension === 'page' && { dimensionFilterGroups: [{
      filters: [{
        dimension: 'page',
        operator: 'contains',
        expression: target
      }]
    }]})
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

  return (data.rows || []).map((row: any) => ({
    date: row.keys[1], // date is second dimension
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
    ...(dimension === 'query' ? { query: row.keys[0] } : { page: row.keys[0] })
  }));
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
    // Get test ID from URL
    const url = new URL(req.url);
    const testId = url.pathname.split('/').pop();

    if (!testId) {
      return new Response(JSON.stringify({ error: 'Test ID required' }), {
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

    // Fetch test definition
    const { data: test, error: testError } = await supabaseClient
      .from('seo_tests')
      .select('*')
      .eq('id', testId)
      .eq('user_id', user.id)
      .single();

    if (testError || !test) {
      return new Response(JSON.stringify({ error: 'Test not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if results are already cached
    const { data: existingResults, error: resultsError } = await supabaseClient
      .from('test_results')
      .select('*')
      .eq('test_id', testId)
      .maybeSingle();

    if (existingResults && !resultsError) {
      return new Response(JSON.stringify({
        pre: existingResults.pre_data,
        post: existingResults.post_data,
        summary: existingResults.summary
      }), {
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

    // Get user's GSC property (assume first one for now)
    const { data: properties, error: propError } = await dbClient
      .from('user_oauth_tokens')
      .select('scopes')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .maybeSingle();

    if (propError || !properties?.scopes) {
      return new Response(JSON.stringify({ error: 'No GSC properties found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract property URL from scopes (GSC scopes contain the property URL)
    const gscScope = properties.scopes.find((scope: string) =>
      scope.includes('https://www.googleapis.com/auth/webmasters')
    );

    if (!gscScope) {
      return new Response(JSON.stringify({ error: 'No GSC access found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // For now, use a placeholder property URL - in production you'd need to store/lookup actual properties
    const siteUrl = 'https://example.com'; // TODO: Get actual GSC property from user

    try {
      let preData: any[] = [];
      let postData: any[] = [];

      if (test.type === 'time') {
        const def = test.definition as any;
        const dimension = def.scope === 'query' ? 'query' : 'page';

        // Fetch pre and post period data
        [preData, postData] = await Promise.all([
          queryGSCPerformance(accessToken, siteUrl, def.preStart, def.preEnd, dimension, def.target),
          queryGSCPerformance(accessToken, siteUrl, def.postStart, def.postEnd, dimension, def.target)
        ]);

      } else if (test.type === 'split') {
        // Split test logic would go here
        // For MVP, implement basic split testing
        const def = test.definition as any;
        // TODO: Implement split test logic
        preData = [];
        postData = [];
      }

      // Compute summary
      const summary = summarizeUplift(preData, postData);

      // Cache results
      const { error: insertError } = await supabaseClient
        .from('test_results')
        .insert({
          test_id: testId,
          pre_data: preData,
          post_data: postData,
          summary
        });

      if (insertError) {
        console.error('Error caching test results:', insertError);
      }

      // Update test status to completed
      await supabaseClient
        .from('seo_tests')
        .update({ status: 'completed' })
        .eq('id', testId);

      return new Response(JSON.stringify({
        pre: preData,
        post: postData,
        summary
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (gscError) {
      console.error('GSC API error:', gscError);

      // Update test status to error
      await supabaseClient
        .from('seo_tests')
        .update({
          status: 'error',
          error_message: gscError instanceof Error ? gscError.message : 'GSC API error'
        })
        .eq('id', testId);

      return new Response(JSON.stringify({ error: 'Failed to fetch GSC data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Test Results API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
