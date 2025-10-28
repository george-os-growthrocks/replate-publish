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

    const { propertyId, reportType, dateRange, userId } = await req.json();

    if (!propertyId) {
      return new Response(
        JSON.stringify({ error: 'Property ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching GA4 report:', { propertyId, reportType, dateRange });

    // Check cache first
    const { data: cachedData } = await supabase
      .from('ga4_reports_cache')
      .select('report_data')
      .eq('user_id', user.id)
      .eq('property_id', propertyId)
      .eq('report_type', reportType || 'traffic')
      .eq('date_range', dateRange || 'last7days')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedData) {
      console.log('Returning cached GA4 data');
      return new Response(
        JSON.stringify({ 
          data: cachedData.report_data,
          cached: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's OAuth token
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_oauth_tokens')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (tokenError || !tokenData?.access_token) {
      return new Response(
        JSON.stringify({ error: 'Google Analytics not connected', needsAuth: true }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare date range
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();
    
    switch (dateRange) {
      case 'today':
        startDate = today;
        break;
      case 'yesterday':
        startDate = new Date(today.getTime() - 86400000);
        endDate = new Date(today.getTime() - 86400000);
        break;
      case 'last7days':
        startDate = new Date(today.getTime() - 7 * 86400000);
        break;
      case 'last30days':
        startDate = new Date(today.getTime() - 30 * 86400000);
        break;
      case 'last90days':
        startDate = new Date(today.getTime() - 90 * 86400000);
        break;
      default:
        startDate = new Date(today.getTime() - 7 * 86400000);
    }

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    // Build GA4 Data API request based on report type
    let requestBody: any = {
      dateRanges: [{
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
      }],
      dimensions: [],
      metrics: []
    };

    switch (reportType) {
      case 'traffic':
        requestBody.dimensions = [{ name: 'date' }];
        requestBody.metrics = [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' }
        ];
        break;
      
      case 'realtime':
        requestBody.dimensions = [{ name: 'unifiedScreenName' }];
        requestBody.metrics = [
          { name: 'activeUsers' }
        ];
        requestBody.minuteRanges = [{ startMinutesAgo: 30, endMinutesAgo: 0 }];
        delete requestBody.dateRanges;
        break;
      
      case 'pages':
        requestBody.dimensions = [{ name: 'pagePath' }, { name: 'pageTitle' }];
        requestBody.metrics = [
          { name: 'screenPageViews' },
          { name: 'activeUsers' },
          { name: 'averageSessionDuration' }
        ];
        requestBody.limit = 20;
        requestBody.orderBys = [{ metric: { metricName: 'screenPageViews' }, desc: true }];
        break;
      
      case 'events':
        requestBody.dimensions = [{ name: 'eventName' }];
        requestBody.metrics = [
          { name: 'eventCount' },
          { name: 'activeUsers' }
        ];
        requestBody.limit = 20;
        requestBody.orderBys = [{ metric: { metricName: 'eventCount' }, desc: true }];
        break;
      
      case 'sources':
        requestBody.dimensions = [{ name: 'sessionSource' }, { name: 'sessionMedium' }];
        requestBody.metrics = [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'screenPageViews' }
        ];
        requestBody.limit = 20;
        requestBody.orderBys = [{ metric: { metricName: 'sessions' }, desc: true }];
        break;
      
      default:
        requestBody.dimensions = [{ name: 'date' }];
        requestBody.metrics = [
          { name: 'activeUsers' },
          { name: 'sessions' }
        ];
    }

    // Fetch from GA4 Data API
    const endpoint = reportType === 'realtime' 
      ? `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`
      : `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('GA4 Data API error:', errorData);
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Token expired, please reconnect', needsAuth: true }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`GA4 Data API error: ${response.statusText}`);
    }

    const reportData = await response.json();

    // Cache the report
    await supabase.from('ga4_reports_cache').insert({
      user_id: user.id,
      property_id: propertyId,
      report_type: reportType || 'traffic',
      date_range: dateRange || 'last7days',
      report_data: reportData,
      expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour
    });

    // Deduct credits
    if (userId) {
      const creditAmount = reportType === 'realtime' ? 3 : 2;
      
      await supabase.rpc('deduct_credits', {
        p_user_id: userId,
        p_amount: creditAmount,
        p_feature: `ga4_${reportType || 'traffic'}`
      });

      await supabase.from('credit_usage_history').insert({
        user_id: userId,
        feature: `ga4_${reportType || 'traffic'}`,
        credits_used: creditAmount,
        metadata: { propertyId, dateRange }
      });
    }

    return new Response(
      JSON.stringify({ 
        data: reportData,
        cached: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ga4-fetch-report:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
