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
      type, // "live", "history", or "intersection"
      target, // for live and history
      targets, // array for intersection
      mode = "as_is", // for live
      limit = 1000,
      filters = [],
      date_from, // for history
      date_to, // for history
      group_by = "month" // for history
    } = await req.json();

    let data;

    switch (type) {
      case "live":
        if (!target) {
          throw new Error("target is required for live backlinks");
        }
        data = await dfsFetch(
          "backlinks/backlinks/live",
          { target, mode, limit, filters },
          dfsLogin,
          dfsPassword
        );
        break;

      case "history":
        if (!target) {
          throw new Error("target is required for backlink history");
        }
        data = await dfsFetch(
          "backlinks/history/live",
          { target, date_from, date_to, group_by },
          dfsLogin,
          dfsPassword
        );
        break;

      case "intersection":
        if (!targets || !Array.isArray(targets)) {
          throw new Error("targets array is required for intersection");
        }
        data = await dfsFetch(
          "backlinks/page_intersection/live",
          { targets, limit },
          dfsLogin,
          dfsPassword
        );
        break;

      default:
        throw new Error("type must be 'live', 'history', or 'intersection'");
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("DataForSEO Backlinks error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to fetch backlink data from DataForSEO"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

