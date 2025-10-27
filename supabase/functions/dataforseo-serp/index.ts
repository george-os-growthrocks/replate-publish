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
    body: JSON.stringify([body]), // DataForSEO expects array of tasks
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
      keyword, 
      location_code = 2840, // USA default
      language_code = "en",
      device = "desktop",
      se = "google",
      se_type = "organic"
    } = await req.json();

    if (!keyword) {
      throw new Error("keyword is required");
    }

    const payload = {
      keyword,
      location_code,
      language_code,
      device,
      se,
      se_type,
    };

    const data = await dfsFetch(
      `serp/${se}/${se_type}/live/advanced`,
      payload,
      dfsLogin,
      dfsPassword
    );

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("DataForSEO SERP error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to fetch SERP data from DataForSEO"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

