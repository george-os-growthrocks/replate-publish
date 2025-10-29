import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Compute Authority Score (0-100)
function computeAuthorityScore(data: {
  referringDomains: number;
  backlinks: number;
  dofollowRatio: number;
  estimatedTraffic: number;
}): number {
  const rdScore = Math.min(100, (Math.log10(data.referringDomains + 1) / 4) * 100);
  const blScore = Math.min(100, (Math.log10(data.backlinks + 1) / 6) * 100);
  const dfScore = data.dofollowRatio * 100;
  const trafficScore = Math.min(100, (Math.log10(data.estimatedTraffic + 1) / 5) * 100);
  
  return Math.round(
    rdScore * 0.40 +
    blScore * 0.25 +
    dfScore * 0.15 +
    trafficScore * 0.20
  );
}

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

    const { keyword, location_code, language_code, depth } = await req.json();

    if (!keyword) {
      return new Response(
        JSON.stringify({ error: 'Keyword is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 SERP Enriched:', { keyword, location_code, language_code, depth });

    const DATAFORSEO_LOGIN = Deno.env.get('DATAFORSEO_LOGIN');
    const DATAFORSEO_PASSWORD = Deno.env.get('DATAFORSEO_PASSWORD');
    const auth = btoa(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`);

    const depthValue = depth || 10; // Top 10 results by default

    // Step 1: Get SERP
    console.log('📊 Step 1: Fetching SERP...');
    const serpRes = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        keyword,
        location_code: location_code || 2840,
        language_code: language_code || 'en',
        depth: depthValue,
      }]),
    });

    interface SerpItem {
      type: string;
      url: string;
      domain: string;
      title?: string;
      rank_absolute?: number;
      rank_group?: number;
      position?: string;
    }

    const serpData = await serpRes.json();
    const serpItems = (serpData?.tasks?.[0]?.result?.[0]?.items || []) as SerpItem[];
    
    // Filter to organic results only
    const organicItems = serpItems.filter((item) => item.type === 'organic');
    console.log(`✅ Found ${organicItems.length} organic results`);

    if (organicItems.length === 0) {
      return new Response(
        JSON.stringify({ items: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Enrich each URL with backlinks + traffic data
    console.log('🔗 Step 2: Enriching with backlinks + traffic data...');
    
    const enrichedItems = await Promise.all(
      organicItems.slice(0, 10).map(async (item) => {
        try {
          // Get backlinks summary for this URL
          const [backlinksRes, trafficRes] = await Promise.all([
            fetch('https://api.dataforseo.com/v3/backlinks/summary/live', {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify([{
                target: item.url,
                internal_list_limit: 1,
                backlinks_status_type: 'all',
              }]),
            }),

            // Get traffic estimation for domain
            fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/bulk_traffic_estimation/live', {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify([{
                targets: [item.domain],
                location_code: location_code || 2840,
                language_code: language_code || 'en',
              }]),
            }),
          ]);

          const backlinksData = await backlinksRes.json();
          const trafficData = await trafficRes.json();

          const backlinksInfo = backlinksData?.tasks?.[0]?.result?.[0] || {};
          const trafficInfo = trafficData?.tasks?.[0]?.result?.[0]?.items?.[0] || {};

          const backlinks = backlinksInfo.backlinks || 0;
          const referringDomains = backlinksInfo.referring_domains || 0;
          const dofollow = backlinksInfo.dofollow || 0;
          const etv = trafficInfo.etv || 0;

          // Compute authority score
          const authorityScore = computeAuthorityScore({
            referringDomains,
            backlinks,
            dofollowRatio: backlinks > 0 ? dofollow / backlinks : 0,
            estimatedTraffic: etv,
          });

          return {
            ...item,
            backlinks: {
              backlinks,
              referring_domains: referringDomains,
              dofollow,
              nofollow: backlinksInfo.nofollow || 0,
            },
            traffic: {
              etv,
              estimated_paid_traffic_cost: trafficInfo.estimated_paid_traffic_cost || 0,
            },
            authority_score: authorityScore,
          };
        } catch (error) {
          console.error(`Error enriching ${item.url}:`, error);
          return {
            ...item,
            backlinks: null,
            traffic: null,
            authority_score: 0,
          };
        }
      })
    );

    console.log('✅ Enrichment complete!');

    // Deduct credits: 1 (SERP) + 2×10 (backlinks+traffic for 10 URLs) = 21 credits
    const creditsUsed = 1 + (enrichedItems.length * 2);
    // @ts-ignore - RPC function exists at runtime
    await supabase.rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: creditsUsed,
      p_feature: 'serp_enriched',
    });

    await supabase.from('credit_usage_history').insert({
      user_id: user.id,
      feature: 'serp_enriched',
      credits_used: creditsUsed,
      metadata: { keyword, location_code, language_code, items_enriched: enrichedItems.length },
    });

    return new Response(
      JSON.stringify({ items: enrichedItems }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ SERP Enriched Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
