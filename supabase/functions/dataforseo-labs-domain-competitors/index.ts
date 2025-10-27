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
      target, // domain to analyze
      location_code = 2840,
      language_code = "en",
      limit = 100,
      offset = 0,
      filters = null
    } = await req.json();

    if (!target) {
      throw new Error("target domain is required");
    }

    const payload = {
      target,
      location_code,
      language_code,
      limit,
      offset,
      ...(filters && { filters })
    };

    const data = await dfsFetch(
      "dataforseo_labs/google/domain_competitors/live",
      payload,
      dfsLogin,
      dfsPassword
    );

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error in dataforseo-labs-domain-competitors function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});

