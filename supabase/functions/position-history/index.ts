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

    const { keyword, location_code, language_code, date_from, date_to } = await req.json();

    if (!keyword) {
      return new Response(
        JSON.stringify({ error: 'Keyword is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📊 Position History:', { keyword, location_code, language_code, date_from, date_to });

    const DATAFORSEO_LOGIN = Deno.env.get('DATAFORSEO_LOGIN');
    const DATAFORSEO_PASSWORD = Deno.env.get('DATAFORSEO_PASSWORD');
    const auth = btoa(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`);

    // Default: Last 30 days
    const defaultDateTo = new Date().toISOString().split('T')[0];
    const defaultDateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get historical SERPs
    const historyRes = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/historical_serps/live', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        keyword,
        location_code: location_code || 2840,
        language_code: language_code || 'en',
        date_from: date_from || defaultDateFrom,
        date_to: date_to || defaultDateTo,
      }]),
    });

    const historyData = await historyRes.json();
    interface HistoryItem {
      date: string;
      items?: Array<{
        rank_absolute?: number;
        rank_group?: number;
        url?: string;
        domain?: string;
        title?: string;
        type?: string;
        position?: string;
      }>;
    }

    const items = (historyData?.tasks?.[0]?.result?.[0]?.items || []) as HistoryItem[];

    console.log(`✅ Found ${items.length} historical SERP snapshots`);

    // Process historical data
    const processedHistory = items.map((item) => ({
      date: item.date,
      items: (item.items || []).map((serpItem) => ({
        rank_absolute: serpItem.rank_absolute,
        rank_group: serpItem.rank_group,
        url: serpItem.url,
        domain: serpItem.domain,
        title: serpItem.title,
        type: serpItem.type,
      })),
      ads: (item.items || [])
        .filter((serpItem) => serpItem.type === 'paid')
        .map((adItem) => ({
          position: adItem.position,
          title: adItem.title,
          advertiser_domain: adItem.domain,
          url: adItem.url,
        })),
    }));

    // Extract unique domains for tracking
    const allDomains = new Set<string>();
    processedHistory.forEach((snapshot) => {
      snapshot.items.forEach((item) => {
        if (item.domain) allDomains.add(item.domain);
      });
    });

    console.log(`✅ Tracking ${allDomains.size} unique domains`);

    // Deduct credits (1 API call)
    // @ts-ignore - RPC function exists at runtime
    await supabase.rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: 1,
      p_feature: 'position_history',
    });

    await supabase.from('credit_usage_history').insert({
      user_id: user.id,
      feature: 'position_history',
      credits_used: 1,
      metadata: { keyword, location_code, language_code, snapshots: items.length },
    });

    return new Response(
      JSON.stringify({
        history: processedHistory,
        domains: Array.from(allDomains),
        snapshot_count: items.length,
        date_range: {
          from: date_from || defaultDateFrom,
          to: date_to || defaultDateTo,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Position History Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
