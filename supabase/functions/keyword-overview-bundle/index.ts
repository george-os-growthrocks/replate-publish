import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { keyword, location_code, language_code } = await req.json();

    if (!keyword) {
      return new Response(
        JSON.stringify({ error: 'Keyword is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📊 Keyword Overview Bundle:', { keyword, location_code, language_code });

    // DataForSEO credentials
    const DATAFORSEO_LOGIN = Deno.env.get('DATAFORSEO_LOGIN');
    const DATAFORSEO_PASSWORD = Deno.env.get('DATAFORSEO_PASSWORD');
    const auth = btoa(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`);

    // Call 3 endpoints in parallel for complete overview
    const [overviewRes, kdRes, historyRes] = await Promise.all([
      // 1. Keyword Overview (SV, CPC, Competition, Intent)
      fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_overview/live', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          keywords: [keyword],
          location_code: location_code || 2840,
          language_code: language_code || 'en',
        }]),
      }),

      // 2. Keyword Difficulty
      fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/bulk_keyword_difficulty/live', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          keywords: [keyword],
          location_code: location_code || 2840,
          language_code: language_code || 'en',
        }]),
      }),

      // 3. Historical Search Volume (12-month trend)
      fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/historical_search_volume/live', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          keywords: [keyword],
          location_code: location_code || 2840,
          language_code: language_code || 'en',
        }]),
      }),
    ]);

    const [overviewData, kdData, historyData] = await Promise.all([
      overviewRes.json(),
      kdRes.json(),
      historyRes.json(),
    ]);

    console.log('✅ All API responses received');

    // Extract data
    const overviewItem = overviewData?.tasks?.[0]?.result?.[0]?.items?.[0] || {};
    const kdItem = kdData?.tasks?.[0]?.result?.[0]?.items?.[0] || {};
    const historyItem = historyData?.tasks?.[0]?.result?.[0]?.items?.[0] || {};

    // Merge all data into comprehensive overview
    const result = {
      keyword,
      location_code: location_code || 2840,
      language_code: language_code || 'en',
      search_volume: overviewItem.search_volume || 0,
      keyword_difficulty: kdItem.keyword_difficulty || 0,
      cpc: overviewItem.cpc || 0,
      competition: overviewItem.competition || 0,
      monthly_searches: historyItem.monthly_searches || [],
      search_intent_info: overviewItem.search_intent_info || null,
      impressions_info: overviewItem.impressions_info || null,
      serp_info: overviewItem.serp_info || null,
      clickstream_keyword_info: overviewItem.clickstream_keyword_info || null,
    };

    // Deduct credits (3 API calls = 3 credits)
    // @ts-ignore - RPC function exists at runtime
    await supabase.rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: 3,
      p_feature: 'keyword_overview_bundle',
    });

    await supabase.from('credit_usage_history').insert({
      user_id: user.id,
      feature: 'keyword_overview_bundle',
      credits_used: 3,
      metadata: { keyword, location_code, language_code },
    });

    return new Response(
      JSON.stringify({ overview: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Keyword Overview Bundle Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
