import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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
        JSON.stringify({ error: 'keyword is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 💰 CREDIT LIMIT CHECK - Prevent draining account
    const MIN_REQUIRED_CREDITS = 10; // Minimum credits to proceed
    const { data: creditsData, error: creditsError } = await supabase
      .from('user_credits')
      .select('available_credits')
      .eq('user_id', user.id)
      .single();

    if (!creditsError && creditsData) {
      const availableCredits = creditsData.available_credits || 0;
      console.log('💰 Available credits:', availableCredits);
      
      if (availableCredits < MIN_REQUIRED_CREDITS) {
        return new Response(
          JSON.stringify({ 
            error: `Insufficient credits. You need at least ${MIN_REQUIRED_CREDITS} credits to use this feature. Your current balance: ${availableCredits}. Please purchase more credits.` 
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const dfsLogin = Deno.env.get("DATAFORSEO_LOGIN");
    const dfsPassword = Deno.env.get("DATAFORSEO_PASSWORD");
    if (!dfsLogin || !dfsPassword) {
      return new Response(
        JSON.stringify({ error: 'Service credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const auth = btoa(`${dfsLogin}:${dfsPassword}`);

    // 💰 COST OPTIMIZATION: Call CHEAP Google Ads API FIRST (saves money!)
    console.log('💰 Calling Google Ads API first (cheaper) to save credits...');
    const googleAdsVolumeRes = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live', {
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
    });

    const googleAdsVolumeData: any = await googleAdsVolumeRes.json();
    const googleAdsTask: any = googleAdsVolumeData?.tasks?.[0];
    const googleAdsResult: any = googleAdsTask?.result?.[0] || {};
    const hasGoogleAdsData = googleAdsResult.search_volume && googleAdsResult.monthly_searches?.length > 0;
    
    console.log('💰 Google Ads data available:', hasGoogleAdsData);
    console.log('💰 Google Ads search_volume:', googleAdsResult.search_volume);
    console.log('💰 Google Ads monthly_searches:', googleAdsResult.monthly_searches?.length || 0, 'months');

    // Only call expensive Labs APIs if Google Ads doesn't have monthly_searches
    const shouldCallLabsHistory = !hasGoogleAdsData;

    // Call Keyword Difficulty (still needed) - but skip expensive Labs Overview
    const kdRes = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/bulk_keyword_difficulty/live', {
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
    });

    // Only call expensive Labs Historical API if Google Ads doesn't have monthly_searches
    const historyResPromise = shouldCallLabsHistory ? 
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
      }) :
      Promise.resolve(new Response(JSON.stringify({ tasks: [] }), { status: 200 }));

    const historyRes = await historyResPromise;

    const [kdData, historyData] = await Promise.all([
      kdRes.json(),
      historyRes.json(),
    ]);
    
    console.log('💰 Cost saved by skipping expensive Labs APIs! 💰');

    // Extract data - prioritize Google Ads
    const overviewItem: any = {}; // Skip Labs Overview - use Google Ads instead
    const kdItem: any = kdData?.tasks?.[0]?.result?.[0]?.items?.[0] || {};
    const historyTask: any = historyData?.tasks?.[0];
    const historyResult: any = historyTask?.result?.[0];
    const historyItem: any = historyResult?.items?.[0] || {};
    const googleAdsItem: any = googleAdsResult || {};

    // Try to get monthly_searches from Labs History first, then fallback to Google Ads
    let monthlySearches: any[] = 
      historyItem.monthly_searches || 
      historyItem.search_volume_history || 
      historyItem.historical_search_volume ||
      historyItem.monthly_search_volume ||
      historyResult?.monthly_searches ||
      [];

    // Fallback to Google Ads monthly_searches (already has it!)
    if (monthlySearches.length === 0 && hasGoogleAdsData) {
      console.log('💰 Using Google Ads monthly_searches (saves credits!)');
      monthlySearches = googleAdsItem.monthly_searches || [];
    }
    
    console.log('📊 Monthly Searches Found:', monthlySearches.length, 'items');

    // Merge all data - prioritize Google Ads for search_volume and CPC
    const searchVolume = overviewItem.search_volume || googleAdsItem.search_volume || 0;
    const cpc = overviewItem.cpc || googleAdsItem.cpc || googleAdsItem.high_top_of_page_bid || googleAdsItem.low_top_of_page_bid || 0;
    const competition = overviewItem.competition || (googleAdsItem.competition ? 
      (googleAdsItem.competition === 'HIGH' ? 'HIGH' : googleAdsItem.competition === 'MEDIUM' ? 'MEDIUM' : 'LOW') : 
      (googleAdsItem.competition_index >= 75 ? 'HIGH' : googleAdsItem.competition_index >= 50 ? 'MEDIUM' : 'LOW')) || 'MEDIUM';
    
    console.log('📊 Search Volume:', searchVolume);
    console.log('📊 CPC:', cpc);
    
    const result = {
      keyword,
      location_code: location_code || 2840,
      language_code: language_code || 'en',
      search_volume: searchVolume,
      keyword_difficulty: kdItem.keyword_difficulty || 0,
      cpc: cpc,
      competition: competition,
      monthly_searches: monthlySearches || [],
      search_intent_info: overviewItem.search_intent_info || null,
      impressions_info: overviewItem.impressions_info || null,
      serp_info: overviewItem.serp_info || null,
      clickstream_keyword_info: overviewItem.clickstream_keyword_info || null,
      _debug: {
        history_api_status: historyTask?.status_code,
        history_api_message: historyTask?.status_message,
        monthly_searches_found: monthlySearches.length,
        used_google_ads: hasGoogleAdsData,
      }
    };

    return new Response(JSON.stringify({ overview: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
