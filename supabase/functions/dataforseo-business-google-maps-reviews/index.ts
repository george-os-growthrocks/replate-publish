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
    body: JSON.stringify([body])
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`DataForSEO API Error (${path}):`, res.status, errorText);
    throw new Error(`DataForSEO API Error: ${errorText}`);
  }
  return res.json();
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
      cid, // Google Maps business CID (e.g., "11315093427814216011")
      depth = 100, // number of reviews to retrieve
      sort_by = "most_relevant", // most_relevant, newest, highest_rating, lowest_rating
      rating = null // filter by rating (1-5)
    } = await req.json();

    if (!cid) {
      throw new Error("cid (Google Maps business ID) is required");
    }

    const payload = {
      cid,
      depth,
      sort_by,
      ...(rating && { rating })
    };

    const data = await dfsFetch(
      "business_data/google/maps/reviews/task_post",
      payload,
      dfsLogin,
      dfsPassword
    );

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error in dataforseo-business-google-maps-reviews function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});

