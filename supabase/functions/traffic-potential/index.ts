import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CTR curve by position
const CTR_CURVE: { [key: number]: number } = {
  1: 0.3945, 2: 0.1831, 3: 0.1065, 4: 0.0718, 5: 0.0547,
  6: 0.0421, 7: 0.0332, 8: 0.0268, 9: 0.0221, 10: 0.0184,
  11: 0.0156, 12: 0.0133, 13: 0.0115, 14: 0.0100, 15: 0.0088,
  16: 0.0078, 17: 0.0069, 18: 0.0062, 19: 0.0056, 20: 0.0050,
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

    const { target_url, location_code, language_code } = await req.json();

    if (!target_url) {
      return new Response(
        JSON.stringify({ error: 'Target URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📈 Traffic Potential:', { target_url, location_code, language_code });

    const DATAFORSEO_LOGIN = Deno.env.get('DATAFORSEO_LOGIN');
    const DATAFORSEO_PASSWORD = Deno.env.get('DATAFORSEO_PASSWORD');
    const auth = btoa(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`);

    // Get ranked keywords for this URL
    const rankedRes = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        target: target_url,
        location_code: location_code || 2840,
        language_code: language_code || 'en',
        include_subdomains: false,
        limit: 1000,
        order_by: ['etv,desc'], // Order by estimated traffic value
      }]),
    });

    interface RankedKeyword {
      keyword?: string;
      keyword_data?: {
        keyword?: string;
        keyword_info?: {
          search_volume?: number;
        };
      };
      rank_absolute?: number;
      rank_group?: number;
    }

    const rankedData = await rankedRes.json();
    const items = (rankedData?.tasks?.[0]?.result?.[0]?.items || []) as RankedKeyword[];

    console.log(`✅ Found ${items.length} ranked keywords`);

    if (items.length === 0) {
      return new Response(
        JSON.stringify({
          traffic_potential: 0,
          parent_topic: null,
          ranked_keywords_count: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate Traffic Potential: Sum of (CTR × Search Volume) for all keywords
    let trafficPotential = 0;
    items.forEach((item) => {
      const rank = item.rank_absolute || item.rank_group || 100;
      const searchVolume = item.keyword_data?.keyword_info?.search_volume || 0;
      const ctr = CTR_CURVE[rank] || 0;
      trafficPotential += searchVolume * ctr;
    });

    // Find Parent Topic: Highest volume keyword in top 10 positions
    const topKeywords = items
      .filter((item) => {
        const rank = item.rank_absolute || item.rank_group || 100;
        return rank <= 10;
      })
      .sort((a, b) => {
        const volA = a.keyword_data?.keyword_info?.search_volume || 0;
        const volB = b.keyword_data?.keyword_info?.search_volume || 0;
        return volB - volA;
      });

    const parentTopic = topKeywords.length > 0 ? {
      keyword: topKeywords[0].keyword_data?.keyword || topKeywords[0].keyword || '',
      search_volume: topKeywords[0].keyword_data?.keyword_info?.search_volume || 0,
      rank: topKeywords[0].rank_absolute || topKeywords[0].rank_group || 0,
    } : null;

    console.log('✅ Traffic Potential:', Math.round(trafficPotential));
    console.log('✅ Parent Topic:', parentTopic?.keyword || 'None');

    // Deduct credits (1 API call)
    // @ts-ignore - RPC function exists at runtime
    await supabase.rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: 1,
      p_feature: 'traffic_potential',
    });

    await supabase.from('credit_usage_history').insert({
      user_id: user.id,
      feature: 'traffic_potential',
      credits_used: 1,
      metadata: { target_url, location_code, language_code },
    });

    return new Response(
      JSON.stringify({
        traffic_potential: Math.round(trafficPotential),
        parent_topic: parentTopic,
        ranked_keywords_count: items.length,
        top_keywords: topKeywords.slice(0, 10).map((item) => ({
          keyword: item.keyword_data?.keyword || item.keyword,
          search_volume: item.keyword_data?.keyword_info?.search_volume || 0,
          rank: item.rank_absolute || item.rank_group,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Traffic Potential Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
