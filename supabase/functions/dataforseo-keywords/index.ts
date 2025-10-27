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
      type, // "ideas", "suggestions", or "volume"
      keywords, // string[] for ideas/volume, string for suggestions
      keyword, // string for suggestions
      location_code = 2840,
      language_code = "en"
    } = await req.json();

    let data;

    switch (type) {
      case "ideas":
        if (!keywords || !Array.isArray(keywords)) {
          throw new Error("keywords array is required for ideas");
        }
        data = await dfsFetch(
          "dataforseo_labs/google/keyword_ideas/live",
          { keywords, location_code, language_code },
          dfsLogin,
          dfsPassword
        );
        break;

      case "suggestions":
        if (!keyword) {
          throw new Error("keyword is required for suggestions");
        }
        data = await dfsFetch(
          "dataforseo_labs/google/keyword_suggestions/live",
          { keyword, location_code, language_code },
          dfsLogin,
          dfsPassword
        );
        break;

      case "volume":
        if (!keywords || !Array.isArray(keywords)) {
          throw new Error("keywords array is required for volume");
        }
        data = await dfsFetch(
          "keywords_data/google_ads/search_volume/live",
          { keywords, location_code, language_code },
          dfsLogin,
          dfsPassword
        );
        break;

      default:
        throw new Error("type must be 'ideas', 'suggestions', or 'volume'");
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("DataForSEO Keywords error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to fetch keyword data from DataForSEO"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

