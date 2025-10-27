import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODELS_ENDPOINT = "https://generativelanguage.googleapis.com/v1/models";
const PREFERRED = ["gemini-2.5-flash", "gemini-2.5-pro"];

async function pickModel(apiKey: string): Promise<string> {
  console.log("Selecting Gemini model...");
  
  // Try preferred models first
  for (const m of PREFERRED) {
    console.log(`Checking model: ${m}`);
    const meta = await fetch(`${MODELS_ENDPOINT}/${m}?key=${apiKey}`);
    if (meta.ok) {
      console.log(`✓ Selected model: ${m}`);
      return m;
    }
    console.log(`✗ Model ${m} not available`);
  }
  
  // Fallback: list all models and pick a viable one
  console.log("Preferred models not found, listing available models...");
  const res = await fetch(`${MODELS_ENDPOINT}?key=${apiKey}`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`ListModels failed: ${res.status} ${errorText}`);
  }
  
  const { models } = await res.json();
  console.log(`Found ${models?.length || 0} models`);
  
  const candidate = models?.map((x: any) => x.name?.replace(/^models\//, ""))
    .find((n: string) => /gemini-(2(\.5)?)-flash/.test(n) || /gemini-(2(\.5)?)-pro/.test(n));
  
  if (!candidate) {
    throw new Error("No suitable Gemini model found. Available models: " + 
      models?.map((x: any) => x.name).join(", "));
  }
  
  console.log(`✓ Found fallback model: ${candidate}`);
  return candidate;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("=== Gemini Site Audit Function Started ===");
    
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    
    console.log("Gemini API Key check:", {
      keyExists: !!geminiKey,
      keyLength: geminiKey?.length || 0,
      keyPreview: geminiKey ? `${geminiKey.substring(0, 10)}...` : "N/A"
    });
    
    if (!geminiKey) {
      throw new Error("Gemini API key not configured");
    }

    const requestBody = await req.text();
    console.log("Request body received (length):", requestBody.length);
    
    const parsedBody = JSON.parse(requestBody);
    console.log("Request body keys:", Object.keys(parsedBody));
    
    const { 
      domain,
      onPageData,
      gscData,
      technicalIssues 
    } = parsedBody;
    
    console.log("Parsed parameters:", {
      domain,
      hasOnPageData: !!onPageData,
      hasGscData: !!gscData,
      hasTechnicalIssues: !!technicalIssues
    });

    // Build comprehensive prompt for Gemini
    const prompt = `You are an expert SEO consultant analyzing a website. Provide a comprehensive, actionable site audit report.

WEBSITE: ${domain}

TECHNICAL SEO DATA:
${JSON.stringify(onPageData, null, 2)}

GOOGLE SEARCH CONSOLE DATA:
${JSON.stringify(gscData, null, 2)}

TECHNICAL ISSUES DETECTED:
${JSON.stringify(technicalIssues, null, 2)}

Please analyze this data and provide a comprehensive audit report in the following JSON format:

{
  "overallScore": <number 0-100>,
  "summary": "<brief 2-3 sentence executive summary>",
  "categories": [
    {
      "name": "<category name: Technical SEO, Content, Performance, Mobile, Security, etc.>",
      "score": <0-100>,
      "issues": [
        {
          "title": "<issue title>",
          "severity": "<critical|high|medium|low>",
          "description": "<detailed description>",
          "impact": "<business impact>",
          "recommendation": "<specific action to take>"
        }
      ]
    }
  ],
  "quickWins": [
    "<actionable quick win 1>",
    "<actionable quick win 2>",
    "<actionable quick win 3>"
  ],
  "prioritizedActions": [
    {
      "priority": 1,
      "action": "<specific action>",
      "estimatedImpact": "<high|medium|low>",
      "estimatedEffort": "<hours or days>",
      "reason": "<why this is important>"
    }
  ],
  "opportunities": [
    {
      "title": "<opportunity>",
      "description": "<details>",
      "potentialGain": "<estimated impact>"
    }
  ]
}

Focus on:
1. Critical technical issues that hurt rankings
2. Content optimization opportunities based on GSC data
3. Page speed and Core Web Vitals
4. Mobile usability
5. Structured data and schema
6. Internal linking structure
7. Indexability issues

Be specific and actionable. Prioritize by business impact.`;

    console.log("Prompt created (length):", prompt.length);
    console.log("Sending request to Gemini API...");
    
    // Auto-select available Gemini 2.5 model
    const selectedModel = await pickModel(geminiKey);
    const geminiUrl = `${MODELS_ENDPOINT}/${selectedModel}:generateContent?key=${geminiKey}`;
    console.log("Gemini API endpoint:", geminiUrl.replace(geminiKey, "***"));
    console.log("Using model:", selectedModel);
    
    // Use basic v1 API format (no system_instruction or responseMimeType)
    const requestPayload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      }
    };
    
    console.log("Request payload structure:", {
      hasContents: !!requestPayload.contents,
      contentsLength: requestPayload.contents.length,
      hasParts: !!requestPayload.contents[0].parts,
      partsLength: requestPayload.contents[0].parts.length,
      promptLength: requestPayload.contents[0].parts[0].text.length,
      config: requestPayload.generationConfig
    });

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    console.log("Gemini API response status:", geminiResponse.status);
    console.log("Gemini API response headers:", Object.fromEntries(geminiResponse.headers.entries()));

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("=== Gemini API ERROR ===");
      console.error("Status:", geminiResponse.status);
      console.error("Status Text:", geminiResponse.statusText);
      console.error("Error body:", errorText);
      
      // Try to parse error as JSON for better formatting
      try {
        const errorJson = JSON.parse(errorText);
        console.error("Parsed error:", JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.error("Error is not JSON:", errorText);
      }
      
      throw new Error(`Gemini API Error (${geminiResponse.status}): ${errorText}`);
    }

    const responseText = await geminiResponse.text();
    console.log("Gemini response received (length):", responseText.length);
    console.log("Response preview:", responseText.substring(0, 200) + "...");
    
    const geminiData = JSON.parse(responseText);
    console.log("Response structure:", {
      hasCandidates: !!geminiData.candidates,
      candidatesCount: geminiData.candidates?.length || 0,
      hasContent: !!geminiData.candidates?.[0]?.content,
      hasParts: !!geminiData.candidates?.[0]?.content?.parts,
      partsCount: geminiData.candidates?.[0]?.content?.parts?.length || 0
    });

    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("Generated text length:", generatedText.length);
    console.log("Generated text FULL PREVIEW (first 1000 chars):", generatedText.substring(0, 1000));
    console.log("Generated text END (last 200 chars):", generatedText.substring(Math.max(0, generatedText.length - 200)));
    
    // Try to extract JSON from the response
    let analysis;
    try {
      console.log("Attempting to parse JSON from response...");
      
      let jsonText = generatedText.trim();
      
      // Try multiple extraction strategies
      // Strategy 1: Extract from markdown code blocks
      const markdownMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (markdownMatch) {
        console.log("Found markdown code block");
        jsonText = markdownMatch[1].trim();
      }
      
      // Strategy 2: Find JSON object boundaries
      const jsonStart = jsonText.indexOf('{');
      const jsonEnd = jsonText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
        console.log("Extracted JSON by boundaries");
      }
      
      console.log("JSON text to parse (length):", jsonText.length);
      console.log("JSON text preview (first 300 chars):", jsonText.substring(0, 300));
      console.log("JSON text end (last 100 chars):", jsonText.substring(Math.max(0, jsonText.length - 100)));
      
      analysis = JSON.parse(jsonText);
      console.log("✓ Successfully parsed JSON response");
      console.log("Analysis keys:", Object.keys(analysis));
      console.log("Categories count:", analysis.categories?.length || 0);
      console.log("Quick wins count:", analysis.quickWins?.length || 0);
    } catch (parseError: any) {
      console.error("=== JSON PARSE ERROR ===");
      console.error("Parse error:", parseError.message);
      console.error("Error stack:", parseError.stack);
      console.error("Failed to parse text (first 1000 chars):", generatedText.substring(0, 1000));
      
      // Return raw text as fallback with empty arrays to prevent frontend crashes
      analysis = {
        overallScore: 50,
        summary: "Failed to parse Gemini response. " + generatedText.substring(0, 400),
        categories: [],
        quickWins: [],
        prioritizedActions: [],
        opportunities: [],
        rawResponse: generatedText,
        parseError: parseError.message
      };
      console.log("Using fallback analysis structure with empty arrays");
    }

    console.log("=== Site Audit Complete ===");
    console.log("Returning success response");

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        rawResponse: generatedText,
        debug: {
          promptLength: prompt.length,
          responseLength: generatedText.length,
          parsed: !analysis.parseError
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("=== FATAL ERROR IN SITE AUDIT ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        errorType: error.constructor.name,
        errorStack: error.stack,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});

