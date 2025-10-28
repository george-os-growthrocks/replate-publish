import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { load } from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the webpage
    const response = await fetch(targetUrl.toString(), {
      headers: {
        "User-Agent": "AnotherSEOGuru-Bot/1.0 (SEO Analysis Tool)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = load(html);

    // Extract all heading tags
    const h1Tags: string[] = [];
    const h2Tags: string[] = [];
    const h3Tags: string[] = [];
    const h4Tags: string[] = [];
    const h5Tags: string[] = [];
    const h6Tags: string[] = [];

    $("h1").each((_, el) => {
      const text = $(el).text().trim();
      if (text) h1Tags.push(text);
    });

    $("h2").each((_, el) => {
      const text = $(el).text().trim();
      if (text) h2Tags.push(text);
    });

    $("h3").each((_, el) => {
      const text = $(el).text().trim();
      if (text) h3Tags.push(text);
    });

    $("h4").each((_, el) => {
      const text = $(el).text().trim();
      if (text) h4Tags.push(text);
    });

    $("h5").each((_, el) => {
      const text = $(el).text().trim();
      if (text) h5Tags.push(text);
    });

    $("h6").each((_, el) => {
      const text = $(el).text().trim();
      if (text) h6Tags.push(text);
    });

    // Analyze and generate recommendations
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check H1
    if (h1Tags.length === 0) {
      issues.push("❌ No H1 tag found - every page should have exactly one H1");
    } else if (h1Tags.length > 1) {
      issues.push(`⚠️ Multiple H1 tags found (${h1Tags.length}) - use only one H1 per page`);
    }

    // Check H2
    if (h2Tags.length === 0) {
      issues.push("⚠️ No H2 tags found - use H2s to structure your content");
    }

    // Generate recommendations
    if (h1Tags.length === 1) {
      recommendations.push("✅ Perfect! You have exactly one H1 tag");
      
      // Check H1 length
      if (h1Tags[0].length > 70) {
        recommendations.push("💡 Consider shortening your H1 tag (currently over 70 characters)");
      }
    }

    if (h2Tags.length >= 3 && h2Tags.length <= 8) {
      recommendations.push("✅ Good use of H2 tags for content structure");
    } else if (h2Tags.length > 8) {
      recommendations.push("💡 You have many H2 tags - consider using H3s for subsections");
    }

    if (h3Tags.length > 0) {
      recommendations.push("✅ Using H3 tags for subsections improves readability");
    }

    // Check for heading hierarchy issues
    if (h3Tags.length > 0 && h2Tags.length === 0) {
      issues.push("⚠️ Found H3 tags but no H2 tags - maintain proper hierarchy");
    }

    if (h4Tags.length > 0 && h3Tags.length === 0) {
      issues.push("⚠️ Found H4 tags but no H3 tags - maintain proper hierarchy");
    }

    // General recommendations
    recommendations.push("💡 Include target keywords naturally in your headings");
    recommendations.push("💡 Keep headings concise and descriptive (under 70 characters)");
    recommendations.push("💡 Use a logical hierarchy: H1 → H2 → H3");

    const result = {
      h1Count: h1Tags.length,
      h2Count: h2Tags.length,
      h3Count: h3Tags.length,
      h4Count: h4Tags.length,
      h5Count: h5Tags.length,
      h6Count: h6Tags.length,
      h1Tags: h1Tags.slice(0, 10), // Limit to first 10
      h2Tags: h2Tags.slice(0, 20), // Limit to first 20
      h3Tags: h3Tags.slice(0, 30), // Limit to first 30
      issues,
      recommendations,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in analyze-headings:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

