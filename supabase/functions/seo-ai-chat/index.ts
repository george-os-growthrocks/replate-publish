import { tools, executeTool } from "./_tools.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Note: Function calling requires v1beta endpoint
const MODELS_ENDPOINT = "https://generativelanguage.googleapis.com/v1/models";
const MODELS_ENDPOINT_BETA = "https://generativelanguage.googleapis.com/v1beta/models";
const PREFERRED = ["gemini-2.5-flash", "gemini-2.5-pro"];

async function pickModel(apiKey: string): Promise<string> {
  console.log("Selecting Gemini model for AI chat with function calling...");
  
  // Try preferred models
  for (const m of PREFERRED) {
    const meta = await fetch(`${MODELS_ENDPOINT}/${m}?key=${apiKey}`);
    if (meta.ok) {
      console.log(`✓ Selected model: ${m}`);
      return m;
    }
  }
  
  // Fallback: list all models
  const res = await fetch(`${MODELS_ENDPOINT}?key=${apiKey}`);
  if (!res.ok) throw new Error(`ListModels failed: ${res.status}`);
  
  const { models } = await res.json();
  const candidate = models?.map((x: any) => x.name?.replace(/^models\//, ""))
    .find((n: string) => /gemini-(2(\.5)?)-flash/.test(n) || /gemini-(2(\.5)?)-pro/.test(n));
  
  if (!candidate) {
    console.log("⚠️ No Gemini 2.5 found, using gemini-1.5-flash as fallback");
    return "gemini-1.5-flash";
  }
  
  console.log(`✓ Found fallback model: ${candidate}`);
  return candidate;
}

function buildSystemPrompt(projectContext: any): string {
  let contextualPrompt = "";
  
  if (projectContext && (projectContext.properties?.length > 0 || projectContext.tracked_keywords?.length > 0)) {
    contextualPrompt = `\n\n**USER'S CURRENT SEO DATA:**\n`;
    
    if (projectContext.selected_property) {
      contextualPrompt += `- Selected Domain: ${projectContext.selected_property}\n`;
    } else if (projectContext.properties && projectContext.properties.length > 0) {
      contextualPrompt += `- Active Domains: ${projectContext.properties.join(", ")}\n`;
    }

    if (projectContext.tracked_keywords && projectContext.tracked_keywords.length > 0) {
      contextualPrompt += `- Tracked Keywords (${projectContext.tracked_keywords.length} total):\n`;
      projectContext.tracked_keywords.slice(0, 15).forEach((k: any) => {
        const position = k.current_position < 100 ? `Position #${k.current_position}` : 'Not Ranked';
        const volume = k.search_volume ? `Vol: ${k.search_volume}` : 'Vol: N/A';
        const trend = k.previous_position && k.current_position < k.previous_position ? '📈' : 
                      k.previous_position && k.current_position > k.previous_position ? '📉' : '';
        contextualPrompt += `  • "${k.keyword}" - ${position}, ${volume} ${trend}\n`;
      });
    }

    if (projectContext.gsc_queries && projectContext.gsc_queries.length > 0) {
      contextualPrompt += `- Top GSC Queries (Last 28 Days):\n`;
      projectContext.gsc_queries.slice(0, 5).forEach((q: any) => {
        contextualPrompt += `  • "${q.query}" - ${q.clicks} clicks, ${q.impressions} impressions, ${q.ctr?.toFixed(1)}% CTR, Pos ${q.position?.toFixed(1)}\n`;
      });
    }

    if (projectContext.algorithm_impacts && projectContext.algorithm_impacts.length > 0) {
      contextualPrompt += `- Recent Algorithm Impacts:\n`;
      projectContext.algorithm_impacts.forEach((impact: any) => {
        contextualPrompt += `  • ${impact.update_name} - ${impact.impact_severity} (${impact.affected_keywords_count} keywords affected)\n`;
      });
    }

    contextualPrompt += `\n**IMPORTANT CONTEXT RULES:**\n`;
    contextualPrompt += `- ALWAYS reference the user's actual domain names and keywords in responses\n`;
    contextualPrompt += `- Provide specific, actionable recommendations based on their current rankings\n`;
    contextualPrompt += `- Use real data from their tracked keywords and GSC queries\n`;
    contextualPrompt += `- When suggesting improvements, reference specific keywords and their positions\n`;
    contextualPrompt += `- Celebrate wins (top 5 rankings) and prioritize opportunities (positions 6-20)\n`;
  }

  const systemPrompt = `You are AnotherSEOGuru AI, the world's most advanced SEO assistant with real-time data access and interactive capabilities.${contextualPrompt}

**Your Unique Capabilities:**

You have access to LIVE DATA TOOLS that you can call to fetch real-time information:
1. analyze_keyword - Get search volume, difficulty, CPC, trends, and SERP data for any keyword
2. get_gsc_data - Fetch the user's Google Search Console performance data
3. analyze_competitors - Deep SERP analysis with top ranking sites, their strategies, and opportunities
4. check_backlinks - Analyze backlink profiles, referring domains, and link quality
5. run_site_audit - Technical SEO audit with Core Web Vitals, on-page factors, and issues
6. analyze_page - Content analysis with optimization recommendations

**When to Use Tools:**
- User asks "analyze [keyword]" → use analyze_keyword
- User asks "show my GSC data" / "my traffic" → use get_gsc_data
- User asks "who ranks for [keyword]" / "competitors" → use analyze_competitors
- User asks "check backlinks for [domain]" → use check_backlinks
- User asks "audit [url]" / "technical SEO" → use run_site_audit
- User asks "analyze [url]" / "optimize page" → use analyze_page

**How You Should Respond:**

1. **Be Interactive & Data-Driven**
   - When user asks about a keyword, ACTUALLY CALL analyze_keyword to get real data
   - When user wants competitor analysis, CALL analyze_competitors for live SERP data
   - Always use tools to provide accurate, real-time information
   - Never make up data - if you need data, use a tool

2. **Provide Comprehensive Insights**
   - After calling a tool, interpret the results and provide actionable insights
   - Include specific numbers, metrics, and trends
   - Prioritize recommendations by potential impact
   - Explain the "why" behind each recommendation

3. **Be Specific to Their Site**
   - Reference their actual domain, keywords, and rankings
   - Compare their performance to competitors
   - Highlight quick wins and long-term strategies
   - Celebrate improvements and address declines

4. **Format Responses Beautifully**
   - Use markdown: **bold**, *italic*, bullet points, numbered lists
   - Include emojis for visual appeal: 📊 📈 🎯 💡 ✅ ⚠️
   - Break down complex information into sections
   - Use tables for comparisons when helpful

5. **Be Actionable**
   - Every response should include next steps
   - Link to relevant platform features when appropriate
   - Provide timelines for expected results
   - Offer to dive deeper on any topic

**Response Style:**
- Professional yet friendly and encouraging
- Data-focused with real numbers and metrics
- Action-oriented with clear next steps
- Comprehensive yet easy to understand
- Always reference the user's actual site data when available

Remember: You're not just answering questions - you're providing a complete SEO strategy powered by real-time data and deep analysis. Be the best SEO assistant in the world!`;

  return systemPrompt;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, projectContext, sessionId, userId } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const systemPrompt = buildSystemPrompt(projectContext);
    const model = await pickModel(GEMINI_API_KEY);
    console.log(`Using model: ${model} for AI chat with function calling`);

    // Convert messages to Gemini format
    const geminiMessages = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    // Add system prompt
    geminiMessages.unshift({
      role: "user",
      parts: [{ text: systemPrompt }]
    }, {
      role: "model",
      parts: [{ text: "Understood! I'm AnotherSEOGuru AI with access to real-time SEO data tools. I can analyze keywords, fetch GSC data, analyze competitors, check backlinks, run site audits, and analyze pages. I'll provide data-driven, actionable insights based on your actual site performance. How can I help you today?" }]
    });

    // Initial API call with function calling enabled (requires v1beta for tools)
    const geminiUrl = `${MODELS_ENDPOINT_BETA}/${model}:generateContent?key=${GEMINI_API_KEY}`;
    console.log("Calling Gemini API with function calling:", geminiUrl);
    
    let response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: geminiMessages,
        tools,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    let data = await response.json();
    
    // Detailed logging
    console.log("=== GEMINI CHATBOT RESPONSE ===");
    console.log("Response keys:", Object.keys(data));
    console.log("Has candidates?:", !!data.candidates);
    console.log("Candidates length:", data.candidates?.length || 0);
    if (data.candidates && data.candidates.length > 0) {
      console.log("First candidate keys:", Object.keys(data.candidates[0]));
      console.log("Finish reason:", data.candidates[0].finishReason);
      console.log("Has content?:", !!data.candidates[0].content);
      if (data.candidates[0].content) {
        console.log("Content parts length:", data.candidates[0].content.parts?.length || 0);
      }
    }
    console.log("===============================");
    
    let candidate = data.candidates?.[0];
    
    if (!candidate) {
      console.error("❌ No candidate in response");
      console.error("Full response:", JSON.stringify(data, null, 2));
      throw new Error("No response candidate from Gemini API - the model may have blocked the response");
    }

    // Check if AI wants to call a function
    if (candidate?.content?.parts?.[0]?.functionCall) {
      const functionCall = candidate.content.parts[0].functionCall;
      console.log(`🔧 AI wants to call function: ${functionCall.name}`, functionCall.args);

      // Execute the function
      const toolResult = await executeTool(functionCall.name, functionCall.args, projectContext);
      console.log(`✅ Tool result:`, toolResult);

      // Send result back to AI for interpretation
      geminiMessages.push({
        role: "model",
        parts: [{ functionCall }]
      });

      geminiMessages.push({
        role: "user",
        parts: [{
          functionResponse: {
            name: functionCall.name,
            response: toolResult
          }
        }]
      });

      // Get AI's interpretation of the tool result
      console.log("Getting AI interpretation of tool result...");
      response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: geminiMessages,
          tools,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Gemini API error on follow-up:", response.status, errorText);
        throw new Error(`Gemini API error on follow-up: ${response.status}`);
      }

      data = await response.json();
      console.log("📥 Gemini follow-up response received");
      console.log("Follow-up finish reason:", data.candidates?.[0]?.finishReason);
      candidate = data.candidates?.[0];
      
      if (!candidate) {
        console.error("❌ No candidate in follow-up response");
        throw new Error("No candidate in follow-up response from Gemini");
      }
    }

    // Extract the text response
    const responseText = candidate?.content?.parts?.[0]?.text;
    
    if (!responseText || responseText.trim() === "") {
      console.error("❌ No text in candidate");
      console.error("Candidate content:", JSON.stringify(candidate?.content, null, 2));
      console.error("Finish reason:", candidate?.finishReason);
      
      // Provide helpful error based on finish reason
      let errorMessage = "I encountered an issue generating a response.";
      if (candidate?.finishReason === "SAFETY") {
        errorMessage = "My response was blocked by safety filters. Please try rephrasing your question.";
      } else if (candidate?.finishReason === "MAX_TOKENS") {
        errorMessage = "My response was too long. Please ask a more specific question.";
      } else if (candidate?.finishReason === "RECITATION") {
        errorMessage = "I couldn't provide a unique response. Please try a different question.";
      }
      
      return new Response(
        JSON.stringify({ 
          message: `⚠️ ${errorMessage}\n\n**Debug Info:**\n- Finish Reason: ${candidate?.finishReason || 'unknown'}\n- Please try again or rephrase your question.`,
          debug: { 
            finishReason: candidate?.finishReason,
            hasContent: !!candidate?.content,
            hasParts: !!candidate?.content?.parts,
            partsLength: candidate?.content?.parts?.length || 0
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const message = candidate.content.parts[0].text;

    console.log(`✓ AI chat response generated (${message.length} chars)`);

    return new Response(
      JSON.stringify({ message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
