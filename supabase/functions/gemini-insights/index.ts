import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODELS_ENDPOINT = "https://generativelanguage.googleapis.com/v1/models";
const PREFERRED = ["gemini-2.5-flash", "gemini-2.5-pro"];

async function pickModel(apiKey: string): Promise<string> {
  console.log("Selecting Gemini model for insights...");
  
  // Try preferred models first
  for (const m of PREFERRED) {
    const meta = await fetch(`${MODELS_ENDPOINT}/${m}?key=${apiKey}`);
    if (meta.ok) {
      console.log(`✓ Selected model: ${m}`);
      return m;
    }
  }
  
  // Fallback: list all models
  const res = await fetch(`${MODELS_ENDPOINT}?key=${apiKey}`);
  if (!res.ok) throw new Error(`ListModels failed: ${res.status}`);
  
  const { models } = await res.json();
  const candidate = models?.map((x: any) => x.name?.replace(/^models\//, ""))
    .find((n: string) => /gemini-(2(\.5)?)-flash/.test(n) || /gemini-(2(\.5)?)-pro/.test(n));
  
  if (!candidate) throw new Error("No suitable Gemini model found");
  
  console.log(`✓ Found fallback model: ${candidate}`);
  return candidate;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header provided');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    if (!user) throw new Error('Unauthorized - no user found');

    const { provider_token, siteUrl, startDate, endDate } = await req.json();

    if (!provider_token) {
      throw new Error('No Google access token provided. Please sign out and sign in again with Google.');
    }

    if (!siteUrl || !startDate || !endDate) {
      throw new Error('Missing required parameters');
    }

    console.log("=== AI Insights Generation Started ===");
    console.log("Site:", siteUrl);
    console.log("Date range:", startDate, "to", endDate);

    // Fetch query data
    const gscResponse = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider_token}`,
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
      const errorText = await gscResponse.text();
      console.error('GSC API error:', errorText);
      throw new Error('Failed to fetch GSC data');
    }

    const gscData = await gscResponse.json();
    console.log("GSC data rows:", gscData.rows?.length || 0);

    // Prepare data for Gemini analysis
    const topQueries = gscData.rows?.slice(0, 50).map((row: any) => ({
      query: row.keys[0],
      page: row.keys[1],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    })) || [];

    console.log("Top queries for analysis:", topQueries.length);

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    console.log("Gemini API key configured:", !!GEMINI_API_KEY);

    // Auto-select Gemini 2.5 model
    const selectedModel = await pickModel(GEMINI_API_KEY);
    const geminiUrl = `${MODELS_ENDPOINT}/${selectedModel}:generateContent?key=${GEMINI_API_KEY}`;
    console.log("Using model:", selectedModel);

    const prompt = `You are the WORLD'S BEST SEO MANAGER with 20+ years of experience optimizing enterprise websites. You have generated millions in revenue through strategic SEO improvements. Analyze this Google Search Console data for ${siteUrl} (${startDate} to ${endDate}).

SEARCH CONSOLE DATA:
${JSON.stringify(topQueries, null, 2)}

YOUR TASK:
Provide 8-12 DETAILED, ACTIONABLE, EXPERT-LEVEL SEO insights that will generate MASSIVE traffic and revenue gains. Think like a $500/hour SEO consultant.

You MUST return ONLY valid JSON in this EXACT format (no markdown, no code blocks, no extra text):

{
  "actions": [
    {
      "type": "CTR_TEST",
      "title": "A/B test power words in title tags for [specific keywords]",
      "rationale": "Pages rank in position 1-3 but CTR is 40% below industry benchmarks. Fixing this = instant 2,000+ monthly visits.",
      "impact": "HIGH",
      "effort": "LOW",
      "items": [
        {
          "query": "actual keyword from data",
          "page": "actual URL from data",
          "suggestion": "Current title: '[example]'. Test: '[example with power words]'. Expected CTR lift: +5.2% = 340 monthly clicks"
        }
      ]
    },
    {
      "type": "CONSOLIDATE_PAGES",
      "title": "Merge 3 competing pages for '[keyword cluster]' to stop cannibalization",
      "rationale": "Same query ranks on 3 URLs (positions 5, 12, 18). Consolidating signals = jump to position 2-3. Potential: +1,200 monthly visits.",
      "impact": "HIGH",
      "effort": "MEDIUM",
      "items": [
        {
          "query": "specific cannibalizing query",
          "page": "URL #1 (keep this - has most authority)",
          "suggestion": "301 redirect URL #2 and URL #3 to this page. Update internal links. Add comprehensive content from other pages."
        }
      ]
    },
    {
      "type": "CREATE_CONTENT",
      "title": "Expand thin content on high-potential pages ranking 11-20",
      "rationale": "5 pages stuck in positions 11-17 with 50K+ monthly impressions. Adding 1,500+ words of expert content = top 5 rankings. Est: +3,500 monthly visits.",
      "impact": "HIGH",
      "effort": "MEDIUM",
      "items": [
        {
          "query": "specific query",
          "page": "URL",
          "suggestion": "Current: 450 words. Competitors average 2,100 words. Add: comparison tables, expert tips, FAQ schema, internal links to [related pages]."
        }
      ]
    },
    {
      "type": "FIX_TECHNICAL",
      "title": "Fix technical issues blocking crawling/indexing on key pages",
      "rationale": "Pattern suggests render-blocking resources or slow load times hurting rankings. Technical fixes = immediate rank recovery.",
      "impact": "MEDIUM",
      "effort": "LOW",
      "items": [
        {
          "query": "affected query",
          "page": "URL",
          "suggestion": "Check: Core Web Vitals, render-blocking JS/CSS, mobile usability, structured data errors. Run Lighthouse audit."
        }
      ]
    },
    {
      "type": "ADD_INTERNAL_LINKS",
      "title": "Strategic internal linking to boost [specific pages]",
      "rationale": "High-value pages lack internal link equity. Adding contextual links from related pages = rank boost in 2-3 weeks.",
      "impact": "MEDIUM",
      "effort": "LOW",
      "items": [
        {
          "query": "target query",
          "page": "URL to boost",
          "suggestion": "Add 5-8 contextual internal links from: [specific high-authority pages on your site]. Use anchor text variations of '[keyword]'."
        }
      ]
    }
  ]
}

CRITICAL REQUIREMENTS:
1. Return ONLY the JSON object - NO markdown code blocks, NO extra text, NO explanations outside the JSON
2. Use ACTUAL data from the provided queries (real URLs, real keywords, real numbers)
3. Be HYPER-SPECIFIC: Include exact titles to test, exact redirect plans, exact word counts, exact anchor text
4. Calculate REAL IMPACT: "Est. +X monthly visits", "Expected CTR lift: +X%", "Potential revenue: $X"
5. Provide 8-12 insights covering ALL opportunity types
6. Every suggestion must be immediately actionable with clear next steps
7. Think business ROI: What will generate revenue FASTEST?

ANALYZE FOR:
- CTR optimization opportunities (position 1-10, CTR below expected)
- Keyword cannibalization (same query, multiple URLs)
- Content gaps (position 11-30, high impressions)
- Quick wins (position 4-7, one push to top 3)
- Declining pages (need immediate attention)
- Internal linking opportunities (boost related pages)
- Title/meta optimization (low CTR despite good position)
- Featured snippet opportunities (position 1-3)

Remember: You're a $500/hour SEO consultant. Show your expertise. Be specific. Focus on revenue impact.`;

    console.log("Prompt length:", prompt.length);

    // Call Gemini API directly
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 8192,
          topP: 0.95,
        }
      }),
    });

    console.log("Gemini response status:", geminiResponse.status);

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    
    // Detailed logging of Gemini response structure
    console.log("=== GEMINI RESPONSE STRUCTURE ===");
    console.log("Full response keys:", Object.keys(geminiData));
    console.log("Has candidates?:", !!geminiData.candidates);
    console.log("Candidates length:", geminiData.candidates?.length || 0);
    if (geminiData.candidates && geminiData.candidates.length > 0) {
      console.log("First candidate keys:", Object.keys(geminiData.candidates[0]));
      console.log("Has content?:", !!geminiData.candidates[0].content);
      if (geminiData.candidates[0].content) {
        console.log("Content keys:", Object.keys(geminiData.candidates[0].content));
        console.log("Has parts?:", !!geminiData.candidates[0].content.parts);
        console.log("Parts length:", geminiData.candidates[0].content.parts?.length || 0);
      }
      console.log("Finish reason:", geminiData.candidates[0].finishReason);
    }
    console.log("Full response:", JSON.stringify(geminiData).substring(0, 1000));
    console.log("================================");
    
    const insightsText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    console.log("Insights text length:", insightsText?.length || 0);
    console.log("Insights text preview:", insightsText?.substring(0, 300));

    if (!insightsText) {
      console.error("❌ CRITICAL: No insights text found in Gemini response");
      console.error("Possible reasons:");
      console.error("1. Safety filters blocked content");
      console.error("2. Empty response from Gemini");
      console.error("3. Unexpected response structure");
      console.error("Full Gemini data:", JSON.stringify(geminiData, null, 2));
      throw new Error('No insights generated - check logs for response structure');
    }

    // Parse the JSON response from Gemini with robust extraction
    let insights;
    let usedFallback = false;
    
    try {
      console.log("Attempting to parse JSON insights...");
      
      let jsonText = insightsText.trim();
      
      // Strategy 1: Extract from markdown code blocks
      const markdownMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (markdownMatch) {
        console.log("Found markdown code block");
        jsonText = markdownMatch[1].trim();
      }
      
      // Strategy 2: Find JSON object boundaries
      const jsonStart = jsonText.indexOf('{');
      const jsonEnd = jsonText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
        console.log("Extracted JSON by boundaries");
      }
      
      console.log("JSON text to parse (length):", jsonText.length);
      console.log("JSON text preview:", jsonText.substring(0, 200));
      
      insights = JSON.parse(jsonText);
      console.log("✓ Successfully parsed insights JSON");
      console.log("Actions count:", insights.actions?.length || 0);
      
    } catch (e) {
      console.error('=== JSON PARSE ERROR ===');
      console.error('Parse error:', e);
      console.error('Failed to parse text:', insightsText.substring(0, 500));
      
      // Enhanced intelligent fallback with comprehensive SEO insights
      usedFallback = true;
      console.log("⚠️ Gemini JSON parse failed - generating comprehensive fallback insights");
      
      const lowCtrQueries = topQueries
        .filter(q => q.position < 12 && q.impressions > 50 && q.ctr < 0.10)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 10);
      
      const contentGaps = topQueries
        .filter(q => q.position > 10 && q.position < 30 && q.impressions > 30)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 8);
      
      const quickWins = topQueries
        .filter(q => q.position >= 4 && q.position <= 7 && q.impressions > 100)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 6);
      
      const topPositions = topQueries
        .filter(q => q.position <= 3 && q.ctr < 0.15 && q.impressions > 50)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 8);
      
      // Find potential cannibalization
      const queryMap = new Map();
      topQueries.forEach(q => {
        if (!queryMap.has(q.query)) {
          queryMap.set(q.query, []);
        }
        queryMap.get(q.query).push(q);
      });
      const cannibalizedQueries = Array.from(queryMap.entries())
        .filter(([_, pages]) => pages.length > 1)
        .slice(0, 5);
      
      const actions: any[] = [];
      
      // 1. CTR Optimization for Top Positions
      if (topPositions.length > 0) {
        const estimatedGain = Math.round(topPositions.reduce((sum, q) => sum + q.impressions * 0.05, 0));
        actions.push({
          type: "CTR_TEST",
          title: "A/B test title tags for top-ranking pages (Position 1-3)",
          rationale: `${topPositions.length} pages in positions 1-3 with CTR below 15%. Est. gain: +${estimatedGain} monthly clicks`,
          impact: "HIGH",
          effort: "LOW",
          items: topPositions.map(q => ({
            query: q.query,
            page: q.page,
            suggestion: `Position ${q.position.toFixed(1)}, ${q.impressions} impressions, ${(q.ctr * 100).toFixed(1)}% CTR (expected: ${(15 - q.ctr * 100).toFixed(1)}% higher). Test power words, numbers, or urgency in title tag`
          })),
        });
      }
      
      // 2. Quick Wins
      if (quickWins.length > 0) {
        const estimatedGain = Math.round(quickWins.reduce((sum, q) => sum + q.impressions * 0.15, 0));
        actions.push({
          type: "CREATE_CONTENT",
          title: "Push position 4-7 pages to top 3 (quick wins)",
          rationale: `${quickWins.length} pages in the 'almost there' zone. One push to top 3 = +${estimatedGain} monthly clicks`,
          impact: "HIGH",
          effort: "MEDIUM",
          items: quickWins.map(q => ({
            query: q.query,
            page: q.page,
            suggestion: `Position ${q.position.toFixed(1)}, ${q.impressions} impressions. Add 500-800 words, update title/H1 with exact keyword, add comparison tables, FAQ schema`
          })),
        });
      }
      
      // 3. Low CTR in Top 10
      if (lowCtrQueries.length > 0) {
        const estimatedGain = Math.round(lowCtrQueries.reduce((sum, q) => sum + q.impressions * 0.08, 0));
        actions.push({
            type: "CTR_TEST",
          title: "Optimize meta descriptions for low-CTR top 10 rankings",
          rationale: `${lowCtrQueries.length} queries in top 10 with CTR <10%. Meta improvements = +${estimatedGain} clicks/month`,
          impact: "HIGH",
          effort: "LOW",
          items: lowCtrQueries.map(q => ({
            query: q.query,
            page: q.page,
            suggestion: `Position ${q.position.toFixed(1)}, ${(q.ctr * 100).toFixed(1)}% CTR. Test meta with: benefits, CTA, year, or social proof. Target: ${(q.position <= 5 ? 15 : 10)}% CTR`
          })),
        });
      }
      
      // 4. Content Gaps
      if (contentGaps.length > 0) {
        const estimatedGain = Math.round(contentGaps.reduce((sum, q) => sum + q.impressions * 0.20, 0));
        actions.push({
          type: "CREATE_CONTENT",
          title: "Expand content for position 11-30 high-impression queries",
          rationale: `${contentGaps.length} pages with high visibility but stuck below top 10. Content boost = +${estimatedGain} clicks/month`,
          impact: "MEDIUM",
          effort: "MEDIUM",
          items: contentGaps.map(q => ({
            query: q.query,
            page: q.page,
            suggestion: `Position ${q.position.toFixed(1)}, ${q.impressions} impressions. Add 1,200+ words covering: user intent, related questions, expert tips, media. Analyze top 3 competitors' content`
          })),
        });
      }
      
      // 5. Cannibalization
      if (cannibalizedQueries.length > 0) {
        actions.push({
          type: "CONSOLIDATE_PAGES",
          title: "Fix keyword cannibalization issues",
          rationale: `${cannibalizedQueries.length} queries ranking on 2+ pages. Consolidating = stronger ranking signals and higher positions`,
          impact: "MEDIUM",
          effort: "MEDIUM",
          items: cannibalizedQueries.map(([query, pages]) => ({
            query,
            page: pages[0].page,
            suggestion: `Query ranks on ${pages.length} pages (positions: ${pages.map(p => p.position.toFixed(1)).join(', ')}). Keep best page (${pages[0].page}), 301 redirect others, or differentiate intent`
          })),
        });
      }
      
      // 6. Internal Linking
      const highImpression = topQueries.filter(q => q.impressions > 200).slice(0, 5);
      if (highImpression.length > 0) {
        actions.push({
          type: "ADD_INTERNAL_LINKS",
          title: "Strategic internal linking to high-impression pages",
          rationale: `${highImpression.length} pages with strong visibility need link equity boost for ranking improvements`,
            impact: "MEDIUM",
            effort: "LOW",
          items: highImpression.map(q => ({
            query: q.query,
            page: q.page,
            suggestion: `Position ${q.position.toFixed(1)}, ${q.impressions} impressions. Add 5-8 contextual internal links from related pages using keyword-rich anchors`
          })),
        });
      }
      
      insights = { actions };
      console.log(`Generated ${actions.length} fallback insights with ${actions.reduce((sum, a) => sum + a.items.length, 0)} total recommendations`);
    }

    console.log("=== AI Insights Complete ===");
    
    return new Response(JSON.stringify({
      ...insights,
      debug: {
        modelUsed: selectedModel,
        dataRows: topQueries.length,
        geminiResponseLength: insightsText?.length || 0,
        geminiResponsePreview: insightsText?.substring(0, 500),
        geminiResponseEnd: insightsText?.substring(Math.max(0, (insightsText?.length || 0) - 200)),
        parsedSuccessfully: !usedFallback,
        usedFallback: usedFallback,
        actionsCount: insights.actions?.length || 0,
        totalRecommendations: insights.actions?.reduce((sum: number, a: any) => sum + (a.items?.length || 0), 0) || 0,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in gemini-insights function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString(),
      }), 
      {
        status: 200, // Return 200 so the client can read the error details
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
