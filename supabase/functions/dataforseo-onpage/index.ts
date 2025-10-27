import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function dfsFetch(path: string, body: any, login: string, password: string) {
  const auth = btoa(`${login}:${password}`);
  console.log(`Calling DataForSEO endpoint: ${path}`);
  console.log(`Payload:`, JSON.stringify([body], null, 2));
  
  const res = await fetch(`https://api.dataforseo.com/v3/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${auth}`,
    },
    body: JSON.stringify([body]),
  });
  
  const text = await res.text();
  console.log(`Response status: ${res.status}`);
  console.log(`Response body:`, text);
  
  if (!res.ok) {
    throw new Error(`DataForSEO API error (${res.status}): ${text}`);
  }
  
  try {
    return JSON.parse(text);
  } catch (e) {
    return { rawResponse: text };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("=== DataForSEO OnPage Function Started ===");
    
    const dfsLogin = Deno.env.get("DATAFORSEO_LOGIN");
    const dfsPassword = Deno.env.get("DATAFORSEO_PASSWORD");

    console.log("DataForSEO credentials check:", {
      loginExists: !!dfsLogin,
      passwordExists: !!dfsPassword,
      loginLength: dfsLogin?.length || 0
    });

    if (!dfsLogin || !dfsPassword) {
      throw new Error("DataForSEO credentials not configured");
    }

    const requestBody = await req.json();
    console.log("Request body received:", JSON.stringify(requestBody, null, 2));

    const { 
      type, // "instant", "summary", "parse", or "lighthouse"
      url, // for instant, parse, lighthouse
      target, // for summary (domain or start URL)
      device = "desktop" // for lighthouse
    } = requestBody;

    console.log("Parsed parameters:", { type, url, target, device });

    let data;

    switch (type) {
      case "instant":
        if (!url) {
          throw new Error("url is required for instant pages");
        }
        // Note: DataForSEO OnPage Instant endpoint requires specific formatting
        data = await dfsFetch(
          "on_page/instant_pages",
          { 
            url,
            enable_javascript: false,
            custom_user_agent: null
          },
          dfsLogin,
          dfsPassword
        );
        break;

      case "summary":
        if (!target) {
          throw new Error("target is required for summary");
        }
        data = await dfsFetch(
          "on_page/summary",
          { target },
          dfsLogin,
          dfsPassword
        );
        break;

      case "parse":
        if (!url) {
          throw new Error("url is required for content parsing");
        }
        data = await dfsFetch(
          "on_page/content_parsing/live",
          { url },
          dfsLogin,
          dfsPassword
        );
        break;

      case "lighthouse":
        if (!url) {
          throw new Error("url is required for lighthouse");
        }
        data = await dfsFetch(
          "on_page/lighthouse/live",
          { url, device },
          dfsLogin,
          dfsPassword
        );
        break;

      default:
        throw new Error("type must be 'instant', 'summary', 'parse', or 'lighthouse'");
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("=== DataForSEO OnPage ERROR ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        errorType: error.constructor.name,
        details: "Failed to fetch OnPage data from DataForSEO",
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

