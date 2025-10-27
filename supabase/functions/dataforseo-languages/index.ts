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
      api = "serp", // serp, keywords_data, business_data, etc.
      se = "google", // search engine
      filters = null // filter languages by name, code, etc.
    } = await req.json();

    const payload = {
      ...(filters && { filters })
    };

    const path = `${api}/${se}/languages`;

    const data = await dfsFetch(
      path,
      payload,
      dfsLogin,
      dfsPassword
    );

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error in dataforseo-languages function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});

