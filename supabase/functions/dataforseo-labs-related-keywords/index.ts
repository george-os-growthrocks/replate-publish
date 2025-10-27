import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function dfsFetch(path: string, body: any, login: string, password: string) {
  const auth = btoa(`${login}:${password}`);
  const res = await fetch(`https://api.dataforseo.com/v3/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${auth}`,
    },
    body: JSON.stringify([body]),
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DataForSEO API error: ${text}`);
  }
  
  return await res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const dfsLogin = Deno.env.get("DATAFORSEO_LOGIN");
    const dfsPassword = Deno.env.get("DATAFORSEO_PASSWORD");

    if (!dfsLogin || !dfsPassword) {
      throw new Error("DataForSEO credentials not configured");
    }

    const { 
      keyword, // single seed keyword
      location_code = 2840,
      language_code = "en",
      depth = 3, // 1-4, how far to expand
      include_serp_info = true,
      limit = 700,
      offset = 0,
      filters = null
    } = await req.json();

    if (!keyword) {
      throw new Error("keyword is required");
    }

    const payload = {
      keyword,
      location_code,
      language_code,
      depth,
      include_serp_info,
      limit,
      offset,
      ...(filters && { filters })
    };

    const data = await dfsFetch(
      "dataforseo_labs/google/related_keywords/live",
      payload,
      dfsLogin,
      dfsPassword
    );

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("DataForSEO Labs Related Keywords error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to fetch related keywords from DataForSEO Labs"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

