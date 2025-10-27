import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function dfsFetch(path: string, body: any, login: string, password: string) {
  const auth = btoa(`${login}:${password}`);
  const url = `https://api.dataforseo.com/v3/${path}`;
  const requestBody = [body];
  
  console.log('[DFS Domain Competitors] Request:', {
    url,
    method: 'POST',
    body: requestBody
  });
  
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${auth}`,
    },
    body: JSON.stringify(requestBody)
  });
  
  const responseText = await res.text();
  console.log('[DFS Domain Competitors] Response:', {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok,
    body: responseText
  });
  
  if (!res.ok) {
    console.error(`DataForSEO API Error (${path}):`, res.status, responseText);
    throw new Error(`DataForSEO API Error: ${responseText}`);
  }
  
  return JSON.parse(responseText);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const dfsLogin = Deno.env.get("DATAFORSEO_LOGIN");
    const dfsPassword = Deno.env.get("DATAFORSEO_PASSWORD");

    if (!dfsLogin || !dfsPassword) {
      console.error('[DFS Domain Competitors] Missing credentials');
      throw new Error("DataForSEO credentials not configured");
    }

    const requestBody = await req.json();
    console.log('[DFS Domain Competitors] Received request body:', requestBody);

    const { 
      target, // domain to analyze
      location_code = 2840,
      language_code = "en",
      limit = 100,
      offset = 0,
      filters = null
    } = requestBody;

    if (!target) {
      console.error('[DFS Domain Competitors] Missing target domain');
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

    console.log('[DFS Domain Competitors] Prepared payload:', payload);

    const data = await dfsFetch(
      "dataforseo_labs/google/competitors_domain/live",
      payload,
      dfsLogin,
      dfsPassword
    );

    console.log('[DFS Domain Competitors] Success! Returning data');

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

