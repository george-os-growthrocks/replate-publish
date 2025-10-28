import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// OpenRouter API configuration (unified access to all models)
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Model mappings for OpenRouter
const LLM_MODELS = {
  chatgpt: "openai/gpt-4o",
  claude: "anthropic/claude-3.5-sonnet",
  gemini: "google/gemini-2.0-flash-exp:free",
  perplexity: "perplexity/sonar-pro",
};

async function queryLLM(model: string, query: string): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const modelId = LLM_MODELS[model as keyof typeof LLM_MODELS];
  if (!modelId) {
    throw new Error(`Unknown model: ${model}`);
  }

  console.log(`Querying ${model} via OpenRouter: ${query.substring(0, 50)}...`);

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://anotherseoguru.com",
        "X-Title": "AnotherSEOGuru LLM Citation Tracker",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. Provide accurate, up-to-date information with sources when possible.",
          },
          {
            role: "user",
            content: query,
          },
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || JSON.stringify(data.error));
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response from OpenRouter");
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error(`Error querying ${model} via OpenRouter:`, error);
    throw error;
  }
}

function analyzeCitation(domain: string, response: string) {
  // Remove protocol and www for matching
  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").toLowerCase();
  const responseLower = response.toLowerCase();

  // Check if domain is mentioned
  const isCited = responseLower.includes(cleanDomain);

  if (!isCited) {
    return {
      is_cited: false,
      citation_position: null,
      citation_context: null,
      competitors_cited: extractDomains(response, cleanDomain),
    };
  }

  // Find position (how early in response)
  const position = findDomainPosition(response, cleanDomain);

  // Extract context (sentence containing domain)
  const context = extractContext(response, cleanDomain);

  // Find competitors
  const competitors = extractDomains(response, cleanDomain);

  return {
    is_cited: true,
    citation_position: position,
    citation_context: context,
    competitors_cited: competitors,
  };
}

function findDomainPosition(text: string, domain: string): number {
  // Split into sentences/sections
  const sections = text.split(/\n+|\.(?=\s)/);
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].toLowerCase().includes(domain.toLowerCase())) {
      return i + 1;
    }
  }
  return 0;
}

function extractContext(text: string, domain: string): string {
  // Get the sentence containing the domain
  const sentences = text.split(/(?<=[.!?])\s+/);
  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(domain.toLowerCase())) {
      return sentence.trim().substring(0, 500); // Limit length
    }
  }
  return "";
}

function extractDomains(text: string, excludeDomain: string): string[] {
  // Regex to find URLs/domains
  const domainRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/g;
  const matches = text.match(domainRegex) || [];

  // Clean and filter
  const domains = matches
    .map((d) => d.replace(/^(https?:\/\/)?(www\.)?/, "").toLowerCase())
    .filter((d) => d !== excludeDomain.toLowerCase() && d.length > 3);

  // Return unique domains
  return [...new Set(domains)].slice(0, 10); // Limit to top 10
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Verify authentication
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    const { action, project_id, domain, queries, models } = await req.json();

    if (action === "track") {
      // Track citations for given queries across selected models
      const results = [];
      const today = new Date().toISOString().split("T")[0];

      for (const query of queries) {
        for (const model of models) {
          console.log(`[${model}] Querying: "${query}"`);

          try {
            // Query the LLM
            const response = await queryLLM(model, query);

            // Analyze citation
            const analysis = analyzeCitation(domain, response);

            // Save to database
            const { data, error } = await supabaseClient
              .from("llm_citations")
              .upsert(
                {
                  project_id,
                  domain,
                  query,
                  llm_model: model,
                  is_cited: analysis.is_cited,
                  citation_position: analysis.citation_position,
                  citation_context: analysis.citation_context,
                  full_response: response.substring(0, 5000), // Limit storage
                  competitors_cited: analysis.competitors_cited,
                  tracked_date: today,
                },
                {
                  onConflict: "project_id,query,llm_model,tracked_date",
                }
              );

            if (error) {
              console.error("Database error:", error);
              throw error;
            }

            results.push({
              query,
              model,
              success: true,
              ...analysis,
            });

            console.log(`[${model}] ${query}: ${analysis.is_cited ? "✅ CITED" : "❌ Not cited"}`);
          } catch (error) {
            console.error(`[${model}] Error:`, error.message);
            results.push({
              query,
              model,
              success: false,
              error: error.message,
            });
          }
        }
      }

      // Update daily stats for each model
      for (const model of models) {
        try {
          const { data: stats } = await supabaseClient
            .from("llm_citations")
            .select("is_cited, citation_position")
            .eq("project_id", project_id)
            .eq("llm_model", model)
            .eq("tracked_date", today);

          if (stats && stats.length > 0) {
            const totalQueries = stats.length;
            const totalCitations = stats.filter((s) => s.is_cited).length;
            const citationRate = (totalCitations / totalQueries) * 100;
            const avgPosition =
              stats.filter((s) => s.citation_position).length > 0
                ? stats
                    .filter((s) => s.citation_position)
                    .reduce((sum, s) => sum + s.citation_position!, 0) /
                  stats.filter((s) => s.citation_position).length
                : 0;

            await supabaseClient.from("llm_citation_history").upsert(
              {
                project_id,
                llm_model: model,
                total_queries_tracked: totalQueries,
                total_citations: totalCitations,
                citation_rate: Math.round(citationRate * 100) / 100,
                avg_position: Math.round(avgPosition * 100) / 100,
                date: today,
              },
              {
                onConflict: "project_id,llm_model,date",
              }
            );
          }
        } catch (error) {
          console.error(`Error updating stats for ${model}:`, error);
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_history") {
      // Get recent citation history
      const { data, error } = await supabaseClient
        .from("llm_citations")
        .select("*")
        .eq("project_id", project_id)
        .order("tracked_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_trends") {
      // Get aggregated trends
      const { data, error } = await supabaseClient
        .from("llm_citation_history")
        .select("*")
        .eq("project_id", project_id)
        .order("date", { ascending: false })
        .limit(90); // Last 90 days

      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_competitors") {
      // Get competitor stats
      const { data, error } = await supabaseClient
        .from("llm_competitors")
        .select("*")
        .eq("project_id", project_id)
        .order("total_mentions", { ascending: false })
        .limit(20);

      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "save_query") {
      // Save a tracking query template
      const { query_template, category, target_keywords } = await req.json();

      const { data, error } = await supabaseClient
        .from("llm_tracking_queries")
        .insert({
          project_id,
          query_template,
          category,
          target_keywords,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_queries") {
      // Get saved tracking queries
      const { data, error } = await supabaseClient
        .from("llm_tracking_queries")
        .select("*")
        .eq("project_id", project_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

