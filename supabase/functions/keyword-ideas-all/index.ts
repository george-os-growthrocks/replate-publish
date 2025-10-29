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

    const { keyword, location_code, language_code, limit } = await req.json();

    if (!keyword) {
      return new Response(
        JSON.stringify({ error: 'Keyword is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('💡 Keyword Ideas All:', { keyword, location_code, language_code, limit });

    const DATAFORSEO_LOGIN = Deno.env.get('DATAFORSEO_LOGIN');
    const DATAFORSEO_PASSWORD = Deno.env.get('DATAFORSEO_PASSWORD');
    const auth = btoa(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`);

    const limitValue = limit || 100;

    // Call 3 endpoints in parallel
    const [suggestionsRes, relatedRes, autocompleteRes] = await Promise.all([
      // 1. Keyword Suggestions (Matching terms)
      fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          keyword,
          location_code: location_code || 2840,
          language_code: language_code || 'en',
          limit: limitValue,
        }]),
      }),

      // 2. Related Keywords
      fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/related_keywords/live', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          keyword,
          location_code: location_code || 2840,
          language_code: language_code || 'en',
          depth: 1,
          limit: limitValue,
        }]),
      }),

      // 3. Autocomplete Suggestions
      fetch('https://api.dataforseo.com/v3/serp/google/autocomplete/live', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          keyword,
          location_code: location_code || 2840,
          language_code: language_code || 'en',
        }]),
      }),
    ]);

    const [suggestionsData, relatedData, autocompleteData] = await Promise.all([
      suggestionsRes.json(),
      relatedRes.json(),
      autocompleteRes.json(),
    ]);

    console.log('✅ All Ideas API responses received');

    // Extract items
    const matching = suggestionsData?.tasks?.[0]?.result?.[0]?.items || [];
    const related = relatedData?.tasks?.[0]?.result?.[0]?.items || [];
    const autocomplete = autocompleteData?.tasks?.[0]?.result?.[0]?.items || [];

    // Filter questions from matching + related
    const questionRegex = /^(what|how|why|when|where|who|which|can|will|should|is|are|do|does|has|have)/i;
    const allKeywords = [...matching, ...related];
    const questions = allKeywords.filter(item => {
      const kw = item.keyword || item.keyword_data?.keyword || '';
      return questionRegex.test(kw);
    });

    // Extract autocomplete suggestions (just strings)
    const suggestions = autocomplete.map((item: { keyword?: string }) => item.keyword || '').filter(Boolean);

    // Deduct credits (3 API calls = 3 credits)
    // @ts-ignore - RPC function exists at runtime
    await supabase.rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: 3,
      p_feature: 'keyword_ideas_all',
    });

    await supabase.from('credit_usage_history').insert({
      user_id: user.id,
      feature: 'keyword_ideas_all',
      credits_used: 3,
      metadata: { keyword, location_code, language_code },
    });

    return new Response(
      JSON.stringify({
        matching: matching.slice(0, limitValue),
        related: related.slice(0, limitValue),
        questions: questions.slice(0, 50),
        suggestions: suggestions.slice(0, 20),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Keyword Ideas All Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
