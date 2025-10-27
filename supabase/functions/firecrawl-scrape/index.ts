import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("=== Firecrawl Scrape Function Started ===");
    
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    
    console.log("Firecrawl API key check:", {
      keyExists: !!firecrawlKey,
      keyLength: firecrawlKey?.length || 0
    });
    
    if (!firecrawlKey) {
      throw new Error("Firecrawl API key not configured");
    }

    const requestBody = await req.json();
    console.log("Request body received:", JSON.stringify(requestBody, null, 2));

    const { 
      url, 
      formats = ["markdown", "html", "links", "screenshot"],
      onlyMainContent = false,
      includeTags,
      excludeTags
    } = requestBody;

    if (!url) {
      throw new Error("url is required");
    }

    console.log(`Scraping URL with Firecrawl v2: ${url}`, { formats });

    const payload: any = {
      url,
      formats,
      onlyMainContent,
    };

    // Add optional parameters if provided
    if (includeTags) payload.includeTags = includeTags;
    if (excludeTags) payload.excludeTags = excludeTags;

    console.log("Firecrawl payload:", JSON.stringify(payload, null, 2));

    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("Firecrawl API response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("=== Firecrawl API ERROR ===");
      console.error("Status:", response.status);
      console.error("Status Text:", response.statusText);
      console.error("Error body:", errorText);
      throw new Error(`Firecrawl API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log("Firecrawl scrape successful!");
    console.log("Response data keys:", Object.keys(data));
    console.log("Data structure:", JSON.stringify(data, null, 2).substring(0, 1000) + "...");

    // Extract ALL data from Firecrawl v2 response
    const responseData = data.data || data;
    const metadata = responseData.metadata || {};
    const html = responseData.html || "";
    const markdown = responseData.markdown || "";
    const links = responseData.links || [];
    const screenshot = responseData.screenshot || null;
    
    // Parse for basic SEO elements from HTML if available
    const titleMatch = html ? html.match(/<title[^>]*>([^<]+)<\/title>/i) : null;
    const metaDescMatch = html ? html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) : null;
    const h1Matches = html ? html.match(/<h1[^>]*>([^<]+)<\/h1>/gi) : null;
    const imgMatches = html ? html.match(/<img[^>]*>/gi) : null;

    // Count H1s from markdown if HTML not available
    const markdownH1Matches = markdown ? markdown.match(/^# .+$/gm) : null;

    const seoData = {
      // URL and Basic Info
      url,
      sourceURL: metadata.sourceURL || url,
      statusCode: metadata.statusCode || 200,
      
      // Title and Description
      title: titleMatch ? titleMatch[1] : metadata.title || null,
      description: metaDescMatch ? metaDescMatch[1] : metadata.description || null,
      
      // Headings
      h1Count: h1Matches ? h1Matches.length : (markdownH1Matches ? markdownH1Matches.length : 0),
      h1Tags: h1Matches ? h1Matches.map(h => h.replace(/<\/?h1[^>]*>/gi, "").trim()) : (markdownH1Matches || []),
      
      // Counts
      imageCount: imgMatches ? imgMatches.length : 0,
      linkCount: links.length || 0,
      
      // Language and Locale
      language: metadata.language || "unknown",
      
      // Open Graph Data
      ogTitle: metadata.ogTitle || null,
      ogDescription: metadata.ogDescription || null,
      ogImage: metadata.ogImage || null,
      ogUrl: metadata.ogUrl || null,
      ogSiteName: metadata.ogSiteName || null,
      ogLocaleAlternate: metadata.ogLocaleAlternate || [],
      
      // SEO Meta
      keywords: metadata.keywords || null,
      robots: metadata.robots || null,
      
      // Content Formats (ALL available formats)
      markdown,
      html,
      links,
      screenshot,
      
      // Full Metadata
      metadata,
      
      // Additional fields that might be in response
      rawHtml: responseData.rawHtml || null,
      images: responseData.images || [],
      actions: responseData.actions || null,
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: seoData,
        raw: data,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("=== Firecrawl Scrape ERROR ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        errorType: error.constructor.name,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});

