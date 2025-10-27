import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword } = await req.json();

    if (!keyword || typeof keyword !== "string") {
      return new Response(
        JSON.stringify({ error: "Keyword is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use DataForSEO to check SERP for AI Overview
    const DATAFORSEO_LOGIN = Deno.env.get("DATAFORSEO_LOGIN");
    const DATAFORSEO_PASSWORD = Deno.env.get("DATAFORSEO_PASSWORD");

    if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
      throw new Error("DataForSEO credentials not configured");
    }

    const auth = btoa(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`);

    // Check SERP for AI Overview
    const serpResponse = await fetch(
      "https://api.dataforseo.com/v3/serp/google/organic/live/advanced",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            keyword: keyword,
            location_code: 2840, // USA
            language_code: "en",
            device: "desktop",
            os: "windows",
          },
        ]),
      }
    );

    if (!serpResponse.ok) {
      throw new Error(`DataForSEO API error: ${serpResponse.statusText}`);
    }

    const serpData = await serpResponse.json();

    if (!serpData.tasks || serpData.tasks.length === 0 || serpData.tasks[0].status_code !== 20000) {
      throw new Error("Failed to fetch SERP data");
    }

    const items = serpData.tasks[0].result[0]?.items || [];

    // Check for AI Overview (featured_snippet, ai_overview, or similar types)
    const aiOverviewItems = items.filter(
      (item: any) =>
        item.type === "ai_overview" ||
        item.type === "featured_snippet" ||
        item.type === "knowledge_graph" ||
        item.type === "answer_box"
    );

    const hasAiOverview = aiOverviewItems.length > 0;

    // Extract featured sites
    const featuredSites: string[] = [];
    aiOverviewItems.forEach((item: any) => {
      if (item.url) {
        try {
          const domain = new URL(item.url).hostname.replace("www.", "");
          if (!featuredSites.includes(domain)) {
            featuredSites.push(domain);
          }
        } catch (e) {
          console.error("Error parsing URL:", e);
        }
      }
      // Check for links in content
      if (item.links) {
        item.links.forEach((link: any) => {
          if (link.url) {
            try {
              const domain = new URL(link.url).hostname.replace("www.", "");
              if (!featuredSites.includes(domain)) {
                featuredSites.push(domain);
              }
            } catch (e) {
              console.error("Error parsing link URL:", e);
            }
          }
        });
      }
    });

    // Generate recommendations
    const recommendations: string[] = [];

    if (hasAiOverview) {
      recommendations.push(
        "✅ Structure your content with clear, concise answers to common questions"
      );
      recommendations.push(
        "✅ Use FAQ schema markup to help Google understand your content structure"
      );
      recommendations.push(
        "✅ Create comprehensive, authoritative content that covers the topic in-depth"
      );
      recommendations.push(
        "✅ Include relevant statistics, data, and credible sources to build trust"
      );
      recommendations.push(
        "✅ Optimize your page for the specific question or intent behind this keyword"
      );
      
      if (featuredSites.length > 0) {
        recommendations.push(
          `💡 Analyze content from ${featuredSites.slice(0, 3).join(", ")} to understand what Google values for this query`
        );
      }
    } else {
      recommendations.push(
        "✅ This keyword may not trigger AI Overviews yet - focus on traditional SEO optimization"
      );
      recommendations.push(
        "✅ Create high-quality content targeting this keyword to rank organically"
      );
      recommendations.push(
        "✅ Build topic authority by covering related keywords and subtopics comprehensively"
      );
      recommendations.push(
        "✅ Monitor this keyword regularly as AI Overview triggers can change over time"
      );
    }

    const result = {
      keyword,
      hasAiOverview,
      featuredSites,
      recommendations,
      competitorCount: featuredSites.length,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in check-ai-overview:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

