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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { siteUrl, startDate, endDate } = await req.json();

    if (!siteUrl || !startDate || !endDate) {
      throw new Error('Missing required parameters');
    }

    // First, fetch GSC data for analysis
    const { data: { session } } = await supabaseClient.auth.getSession();
    const providerToken = session?.provider_token;

    if (!providerToken) {
      throw new Error('No Google access token found');
    }

    // Fetch query data
    const gscResponse = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${providerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ['query', 'page'],
          rowLimit: 1000,
        }),
      }
    );

    if (!gscResponse.ok) {
      throw new Error('Failed to fetch GSC data');
    }

    const gscData = await gscResponse.json();

    // Prepare data for Gemini analysis
    const topQueries = gscData.rows?.slice(0, 50).map((row: any) => ({
      query: row.keys[0],
      page: row.keys[1],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    })) || [];

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Call Gemini via Lovable AI Gateway
    const geminiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert SEO analyst. Analyze Search Console data and provide actionable insights. Return ONLY valid JSON matching the schema.',
          },
          {
            role: 'user',
            content: `Analyze this Search Console data for ${siteUrl} (${startDate} to ${endDate}):

${JSON.stringify(topQueries, null, 2)}

Provide SEO insights in this exact JSON format:
{
  "actions": [
    {
      "type": "CTR_TEST" | "CONSOLIDATE_PAGES" | "CREATE_CONTENT" | "FIX_TECHNICAL" | "ADD_INTERNAL_LINKS",
      "title": "Brief title (max 60 chars)",
      "rationale": "Why this matters (max 150 chars)",
      "impact": "LOW" | "MEDIUM" | "HIGH",
      "effort": "LOW" | "MEDIUM" | "HIGH",
      "items": [{"query": "example", "page": "url", "suggestion": "action"}]
    }
  ]
}

Focus on:
1. Quick-win CTR tests (position < 12, high impressions, low CTR)
2. Cannibalization (same query -> multiple pages)
3. Content gaps (position > 20, high impressions)
4. Technical issues patterns
5. Internal linking opportunities

Return 3-5 prioritized actions with concrete recommendations.`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const insightsText = geminiData.choices?.[0]?.message?.content;

    if (!insightsText) {
      throw new Error('No insights generated');
    }

    // Parse the JSON response from Gemini
    let insights;
    try {
      insights = JSON.parse(insightsText);
    } catch (e) {
      console.error('Failed to parse Gemini response:', insightsText);
      // Return a fallback structure if parsing fails
      insights = {
        actions: [
          {
            type: "CTR_TEST",
            title: "Optimize high-impression, low-CTR queries",
            rationale: "Several queries show high impressions but low click-through rates",
            impact: "MEDIUM",
            effort: "LOW",
            items: topQueries.slice(0, 3),
          },
        ],
      };
    }

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in gemini-insights function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
