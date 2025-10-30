import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODELS_ENDPOINT = "https://generativelanguage.googleapis.com/v1/models";
const PREFERRED = ["gemini-2.5-flash", "gemini-2.5-pro"];

async function pickModel(apiKey: string): Promise<string> {
  console.log("Selecting Gemini model for keyword insights...");
  
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
    const { keyword, currentPosition, clicks, impressions, ctr, positionChange } = await req.json();

    console.log("=== Keyword Insights Request ===");
    console.log("Keyword:", keyword);
    console.log("Position:", currentPosition);
    console.log("Clicks:", clicks);
    console.log("Impressions:", impressions);
    console.log("CTR:", ctr);
    console.log("Position Change:", positionChange);

    // Get Gemini API key from environment
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      console.log('⚠️ No Gemini API key found, using fallback insights');
      return new Response(
        JSON.stringify({
          insights: getFallbackInsights(keyword, currentPosition, clicks, impressions, ctr, positionChange)
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Auto-select Gemini 2.5 model
    const selectedModel = await pickModel(GEMINI_API_KEY);
    const geminiUrl = `${MODELS_ENDPOINT}/${selectedModel}:generateContent?key=${GEMINI_API_KEY}`;
    console.log("Using model:", selectedModel);

    // Create the SEO analysis prompt for Gemini
    const prompt = `You are the WORLD'S BEST SEO CONSULTANT analyzing a specific keyword's performance. Based on the following data for the keyword "${keyword}", provide 5-7 DETAILED, ACTIONABLE SEO recommendations.

KEYWORD PERFORMANCE DATA:
- Current Position: ${currentPosition.toFixed(1)}
- Monthly Clicks: ${clicks}
- Monthly Impressions: ${impressions}
- Click-Through Rate: ${(ctr * 100).toFixed(2)}%
- Position Change (vs previous period): ${positionChange ? positionChange.toFixed(1) : 'N/A'}

YOUR ANALYSIS MUST INCLUDE:
1. CTR Analysis: Calculate expected CTR for this position (pos 1-3: 25-35%, pos 4-10: 10-20%, pos 11-20: 5-10%, pos 21+: 2-5%). Is this keyword underperforming?
2. Ranking Potential: Based on impressions vs clicks, is this a high-opportunity keyword?
3. Keyword Intent: Is this commercial (buy, best, review) or informational (how, what, why)?
4. Ranking Stability: Is the position change significant? What does it indicate?
5. SERP Competition: What might be affecting CTR (featured snippets, ads, local pack)?

PROVIDE INSIGHTS IN THIS EXACT JSON FORMAT (NO MARKDOWN, NO CODE BLOCKS):
[
  {
    "title": "Clear, actionable title (max 60 chars)",
    "description": "Detailed explanation with specific metrics and reasoning (max 200 chars)",
    "priority": "high" | "medium" | "low",
    "impact": "high" | "medium" | "low",
    "category": "on_page_seo" | "content" | "technical_seo" | "link_building" | "user_experience"
  }
]

REQUIREMENTS:
- Return ONLY a valid JSON array
- NO markdown, NO code blocks, NO extra text
- Each insight must have all 5 fields
- priority and impact must be: "high", "medium", or "low"
- category must be one of the 5 listed options
- Focus on actionable recommendations specific to THIS keyword's data
- Be specific with numbers and expected outcomes

Example good insight:
{
  "title": "Optimize Title Tag - CTR 8% Below Expected",
  "description": "Position ${currentPosition.toFixed(1)} should have 15-20% CTR but yours is ${(ctr * 100).toFixed(1)}%. Add power words like 'Complete Guide' or '2025' to improve CTR by estimated 5-7 percentage points.",
  "priority": "high",
  "impact": "high",
  "category": "on_page_seo"
}`;

    console.log("Prompt length:", prompt.length);

    try {
      // Call Gemini API
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
        })
      });

      console.log("Gemini response status:", geminiResponse.status);

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('Gemini API error:', errorText);
        throw new Error(`Gemini API error: ${geminiResponse.status}`);
      }

      const geminiData = await geminiResponse.json();
      
      console.log("Gemini response keys:", Object.keys(geminiData));
      console.log("Has candidates?:", !!geminiData.candidates);
      console.log("Finish reason:", geminiData.candidates?.[0]?.finishReason);
      
      const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        console.error('❌ No content generated by Gemini');
        console.error('Full response:', JSON.stringify(geminiData, null, 2));
        throw new Error('No content generated by Gemini');
      }

      console.log("Generated text length:", generatedText.length);
      console.log("Generated text preview:", generatedText.substring(0, 300));

      // Parse the JSON response
      let insights;
      try {
        let jsonText = generatedText.trim();
        
        // Strategy 1: Extract from markdown code blocks
        const markdownMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (markdownMatch) {
          console.log("Found markdown code block");
          jsonText = markdownMatch[1].trim();
        }
        
        // Strategy 2: Find JSON array boundaries
        const arrayStart = jsonText.indexOf('[');
        const arrayEnd = jsonText.lastIndexOf(']');
        if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
          jsonText = jsonText.substring(arrayStart, arrayEnd + 1);
          console.log("Extracted JSON array by boundaries");
        }
        
        console.log("JSON text to parse (length):", jsonText.length);
        
        insights = JSON.parse(jsonText);
        console.log("✓ Successfully parsed insights JSON");
        console.log("Insights count:", insights.length);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', generatedText);
        throw new Error('Invalid JSON response from Gemini');
      }

      // Validate the insights structure
      if (!Array.isArray(insights)) {
        throw new Error('Gemini response is not an array');
      }

      // Validate each insight has required fields
      const validInsights = insights.filter((insight: any) =>
        insight.title &&
        insight.description &&
        ['high', 'medium', 'low'].includes(insight.priority) &&
        ['high', 'medium', 'low'].includes(insight.impact) &&
        ['on_page_seo', 'content', 'technical_seo', 'link_building', 'user_experience'].includes(insight.category)
      );

      console.log("Valid insights count:", validInsights.length);

      if (validInsights.length === 0) {
        throw new Error('No valid insights generated');
      }

      return new Response(
        JSON.stringify({ insights: validInsights }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);
      // Fall back to static insights
      return new Response(
        JSON.stringify({
          insights: getFallbackInsights(keyword, currentPosition, clicks, impressions, ctr, positionChange)
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

  } catch (error: any) {
    console.error('Error in keyword-insights function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Enhanced fallback insights with sophisticated calculations
function getFallbackInsights(keyword: string, position: number, clicks: number, impressions: number, ctr: number, positionChange?: number) {
  const insights: Array<{
    type?: string;
    title: string;
    description: string;
    priority: string;
    impact: string;
    category: string;
  }> = [];

  // Calculate expected CTR based on position
  let expectedCTR = 0;
  if (position <= 3) expectedCTR = 0.25;
  else if (position <= 10) expectedCTR = 0.15;
  else if (position <= 20) expectedCTR = 0.08;
  else expectedCTR = 0.03;

  const ctrGap = ctr - expectedCTR;
  const ctrGapPercent = expectedCTR > 0 ? (ctrGap / expectedCTR) * 100 : 0;

  // 1. Title optimization based on CTR gap
  if (ctrGap < 0) {
    insights.push({
      title: "Optimize Title Tag for Better CTR",
      description: `Your CTR is ${Math.abs(ctrGapPercent).toFixed(1)}% below expected for position ${position.toFixed(1)}. Use power words like "Complete Guide", "Best", or add year "2025". Current: ${(ctr * 100).toFixed(2)}%`,
      priority: ctrGapPercent < -50 ? "high" : "medium",
      impact: "high",
      category: "on_page_seo"
    });
  }

  // 2. Content depth analysis
  const clickThroughRate = clicks / impressions;
  if (clickThroughRate < 0.02 && impressions > 1000) {
    insights.push({
      title: "Enhance Content Depth & Quality",
      description: `Only ${(clickThroughRate * 100).toFixed(1)}% of ${impressions.toLocaleString()} impressions convert. Add comprehensive content, FAQs, and fully address user intent for "${keyword}".`,
      priority: clickThroughRate < 0.01 ? "high" : "medium",
      impact: "high",
      category: "content"
    });
  }

  // 3. Position stability analysis
  if (positionChange && Math.abs(positionChange) > 2) {
    insights.push({
      title: "Address Ranking Volatility",
      description: `Position changed by ${positionChange > 0 ? '+' : ''}${positionChange.toFixed(1)} recently. Focus on consistent content updates and technical SEO to stabilize rankings.`,
      priority: Math.abs(positionChange) > 5 ? "high" : "medium",
      impact: "medium",
      category: "technical_seo"
    });
  }

  // 4. Internal linking for authority
  if (position > 5 && clicks > 50) {
    insights.push({
      title: "Strengthen Internal Link Structure",
      description: `With ${clicks} monthly clicks at position ${position.toFixed(1)}, improve internal linking to distribute authority and enhance user journey through related content.`,
      priority: "medium",
      impact: "medium",
      category: "technical_seo"
    });
  }

  // 5. Schema markup for rich results
  if (position <= 10) {
    insights.push({
      title: "Implement Schema Markup",
      description: `Position ${position.toFixed(1)} makes you eligible for rich results. Add structured data (Article, FAQ, HowTo) to enhance SERP appearance and boost CTR.`,
      priority: position <= 3 ? "high" : "low",
      impact: "medium",
      category: "technical_seo"
    });
  }

  // 6. Mobile optimization
  if (position > 10 && impressions > 500) {
    insights.push({
      title: "Optimize for Mobile Experience",
      description: `Ranking at ${position.toFixed(1)} with ${impressions.toLocaleString()} impressions suggests mobile optimization could significantly impact rankings and UX.`,
      priority: "high",
      impact: "high",
      category: "technical_seo"
    });
  }

  // 7. User experience improvements
  if (ctr < 0.05 && impressions > 200) {
    insights.push({
      title: "Improve Page User Experience",
      description: `Low ${(ctr * 100).toFixed(2)}% CTR with ${impressions.toLocaleString()} impressions indicates UX issues. Focus on faster loading, better design, and clearer value proposition.`,
      priority: ctr < 0.02 ? "high" : "medium",
      impact: "high",
      category: "user_experience"
    });
  }

  // Sort by priority and impact
  const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
  insights.sort((a, b) => {
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return priorityOrder[b.impact] - priorityOrder[a.impact];
  });

  console.log(`Generated ${insights.length} fallback insights`);
  return insights.slice(0, 6); // Return top 6 insights
}
