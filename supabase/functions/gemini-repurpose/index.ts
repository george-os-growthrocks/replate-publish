import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODELS_ENDPOINT = "https://generativelanguage.googleapis.com/v1/models";

async function pickModel(geminiKey: string): Promise<string> {
  const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash"];
  
  for (const model of modelsToTry) {
    try {
      const testUrl = `${MODELS_ENDPOINT}/${model}?key=${geminiKey}`;
      const response = await fetch(testUrl);
      if (response.ok) {
        console.log(`✅ Selected model: ${model}`);
        return model;
      }
    } catch (error) {
      console.log(`Model ${model} not available:`, error);
    }
  }
  
  return "gemini-2.5-flash";
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Gemini Repurpose Function Started ===");
    
    // Log all headers for debugging
    const authHeader = req.headers.get('Authorization');
    console.log("Authorization header present:", !!authHeader);
    if (authHeader) {
      console.log("Authorization header preview:", authHeader?.substring(0, 30) + '...');
    }
    
    // Create Supabase client with the JWT token from request
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader ?? '' },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    );

    console.log("Verifying user from JWT...");
    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser(authHeader?.replace('Bearer ', ''));

    console.log("User verification result:", {
      hasUser: !!user,
      hasError: !!userError,
      errorMessage: userError?.message,
      userId: user?.id,
      userEmail: user?.email
    });

    if (userError) {
      console.error("User verification error details:", JSON.stringify(userError));
      return new Response(
        JSON.stringify({ 
          error: "Authentication failed: " + userError.message,
          debug: "JWT token verification failed - token may be expired or invalid"
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!user) {
      console.error("No user found despite no error - auth header was:", authHeader ? "present" : "missing");
      return new Response(
        JSON.stringify({ 
          error: "Authentication required. Please sign in.",
          debug: authHeader ? "Auth header present but no user returned" : "No auth header provided"
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("✅ User verified successfully:", user.email, "ID:", user.id);

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      console.error("GEMINI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Service configuration error. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Parsing request body...");
    const { content, platforms, tone, style, seoData } = await req.json();

    console.log("Received request:", {
      contentLength: content?.length,
      platformsCount: platforms?.length,
      platforms,
      tone,
      style,
      hasSeoData: !!seoData
    });

    if (!content || !platforms || platforms.length === 0) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields: content and platforms" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating content for ${platforms.length} platforms with tone: ${tone}, style: ${style}`);

    const selectedModel = await pickModel(geminiKey);
    const geminiUrl = `${MODELS_ENDPOINT}/${selectedModel}:generateContent?key=${geminiKey}`;

    const generatedContent = [];

    // Generate content for each platform
    for (const platform of platforms) {
      const prompt = generatePlatformPrompt(platform, content, tone, style, seoData);
      
      console.log(`Generating ${platform} content...`);

      console.log(`Calling Gemini API for ${platform}...`);
      console.log(`Prompt length: ${prompt.length} characters`);
      console.log(`Content length in prompt: ${content.length} characters`);
      
      const geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 64,
            maxOutputTokens: 8192, // Increased for long content
            candidateCount: 1,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE"
            }
          ]
        }),
      });

      console.log(`Gemini response status for ${platform}:`, geminiResponse.status);

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error(`❌ Gemini API error for ${platform}:`, errorText);
        console.error(`Status: ${geminiResponse.status}, StatusText: ${geminiResponse.statusText}`);
        console.error(`Prompt length: ${prompt.length}, Content length: ${content.length}`);
        
        // Try to parse error as JSON for more details
        try {
          const errorJson = JSON.parse(errorText);
          console.error(`Gemini error details:`, JSON.stringify(errorJson, null, 2));
        } catch (e) {
          console.error(`Could not parse error as JSON`);
        }
        
        // Don't throw, just skip this platform and continue
        console.warn(`Skipping ${platform} due to API error`);
        continue;
      }

      const geminiData = await geminiResponse.json();
      console.log(`Gemini response for ${platform}:`, JSON.stringify(geminiData).substring(0, 300));
      
      // Check for safety blocks or other issues
      if (geminiData.candidates?.[0]?.finishReason && geminiData.candidates[0].finishReason !== 'STOP') {
        console.warn(`⚠️ Generation stopped with reason: ${geminiData.candidates[0].finishReason}`);
        if (geminiData.candidates[0].safetyRatings) {
          console.warn(`Safety ratings:`, JSON.stringify(geminiData.candidates[0].safetyRatings));
        }
      }
      
      const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!generatedText) {
        console.warn(`No content generated for ${platform}`);
        continue;
      }

      generatedContent.push({
        platform,
        content: generatedText.trim()
      });

      console.log(`✅ Generated ${platform} content (${generatedText.length} chars)`);
    }

    console.log(`\n=== Generation Complete ===`);
    console.log(`Successfully generated content for ${generatedContent.length} platforms`);
    
    if (generatedContent.length === 0) {
      console.error("No content was generated for any platform");
      return new Response(
        JSON.stringify({
          error: "Failed to generate content for any platform. Please try again or select different platforms.",
          generatedContent: []
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        generatedContent,
        platformCount: generatedContent.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("\n=== ERROR in gemini-repurpose ===");
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "Please check the function logs for more information"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generatePlatformPrompt(
  platform: string,
  content: string,
  tone: string,
  style: string,
  seoData: {
    primaryKeyword?: string;
    secondaryKeywords?: string[];
    metaTitle?: string;
    metaDescription?: string;
  }
): string {
  const keywords = [seoData.primaryKeyword, ...(seoData.secondaryKeywords || [])]
    .filter(Boolean)
    .join(', ');

  const prompts: Record<string, string> = {
    'blog': `Act as a Senior SEO & CRO Content Strategist with ${tone} tone and ${style} style.
Transform the provided content into a fully optimized blog article.

Guidelines:
- Target keyword(s): ${keywords || 'N/A'}
- Follow SEO structure: H1 (main keyword), H2 (supporting topics), H3 (FAQs)
- Optimize for Featured Snippets & People Also Ask
- Add meta title (<= 60 chars) and meta description (<= 155 chars)
- Tone: ${tone}, Style: ${style}
- Format with bullet points, tables, and schema-ready FAQ sections
- Target length: 1200-1500 words
- Include E-E-A-T signals (expertise, experience, authority, trustworthiness)
- Use semantic keyword variations and LSI keywords

Content: ${content}

Provide the fully optimized blog article with proper heading structure, meta tags, and strategic keyword placement.`,

    'linkedin': `You are a Senior LinkedIn Content Strategist with ${tone} tone and ${style} style.
Rewrite the content into a LinkedIn post.

Guidelines:
- Start with a bold statement or question to hook
- Short paragraphs, max 3 lines each
- Use storytelling + insights
- Use emojis sparingly (max 2-3)
- Target keywords: ${keywords || 'N/A'}
- Post length: 1,300-2,000 characters for maximum reach
- Use "I/we" perspective for authenticity
- Provide 3-5 actionable insights
- End with a call to engage (ask readers to comment/share)
- Add 3-5 relevant hashtags at the end
- Include credibility signals (data, experience, results)

Content: ${content}

Provide a LinkedIn post optimized for maximum visibility and engagement.`,

    'twitter': `Act as a Senior Twitter Growth Expert with ${tone} tone and ${style} style.
Repurpose the content into a high-impact Twitter thread.

Guidelines:
- Hook tweet = bold, curiosity-driven (max 240 chars)
- Break content into 7-10 short tweets (1 idea each)
- Target keywords: ${keywords || 'N/A'}
- Use thread numbering (1/n, 2/n, etc.)
- Character count: 200-250 per tweet for readability
- Use line breaks, bullet points (•), and strategic emojis (1-2 per tweet)
- Add questions or "RT if you agree" in middle tweets
- Use 1-2 specific hashtags max
- End with CTA: "Follow for more" or engaging question

Content: ${content}

Provide a complete Twitter thread optimized for virality and engagement.`,

    'instagram': `Act as a Senior Instagram Content Strategist with ${tone} tone and ${style} style.
Repurpose the content for Instagram posts and Reels.

Guidelines:
- Hook first slide/line: bold statement or question
- Use emojis, short sentences, high impact visual suggestions
- Include CTA: Save, Share, Comment
- Target keywords: ${keywords || 'N/A'}
- Caption length: 1,500-2,000 characters for best reach
- Use storytelling and first-person narrative
- Short paragraphs (1-2 sentences), strategic line breaks
- 5-10 relevant emojis throughout (contextual, not decorative)
- If carousel: suggest captions per slide (5-7 slides)
- Add 20-30 hashtags at end (mix of high, medium, low competition)
- CTA: "Save this", "Tag someone", "Share to story"

Content: ${content}

Provide complete Instagram content (caption + hashtags + visual suggestions).`,

    'youtube': `Act as a Senior Video Content Strategist with ${tone} tone and ${style} style.
Repurpose the content into a YouTube video script.

Guidelines:
- Hook in first 5 seconds
- Duration: 8-12 minutes script
- Break into intro, main points (3-5), outro CTA
- Conversational & energetic tone
- Target keywords: ${keywords || 'N/A'}
- Include compelling description (first 2 lines visible before "show more")
- Add timestamps for key sections
- Use 3-5 relevant hashtags
- CTA: Subscribe or like
- Suggest B-roll, text overlays, visual ideas

Content: ${content}

Provide complete YouTube script + description optimized for engagement.`,

    'newsletter': `Act as a Senior Email Marketing Strategist with ${tone} tone and ${style} style.
Create newsletter content from this content.

Guidelines:
- Catchy subject line suggestion (<50 chars)
- Personal greeting
- Clear sections with subheadings
- Conversational, friendly tone
- Target keywords: ${keywords || 'N/A'}
- Add value with tips or insights
- Strong CTA (clear next action)
- Professional sign-off
- P.S. section with extra value or urgency
- Mobile-friendly formatting (short paragraphs)

Content: ${content}

Provide complete newsletter content with subject line, body, and CTA.`,

    'reddit': `Act as a Senior Redditor with ${tone} tone and ${style} style who knows how to spark discussions.
Rewrite the content for Reddit.

Guidelines:
- Avoid sounding like marketing; be authentic, transparent, and helpful
- Provide practical value, answer questions, or share a guide
- Use casual formatting (bullet points, bold text sparingly)
- End with an open-ended question to encourage comments
- Target keywords: ${keywords || 'N/A'}
- Use peer-to-peer tone, conversational style
- Short paragraphs, easy to scan
- Be authentic and helpful, not promotional
- Start with a question or relatable hook

Content: ${content}

Provide a Reddit-friendly post that sparks genuine discussion.`,

    'podcast': `Act as a Senior Podcast Content Creator with ${tone} tone and ${style} style.
Transform the content into a podcast episode script.

Guidelines:
- Episode length: 20-30 minutes
- Engaging intro hook (first 30 seconds)
- Clear segment breakdown with timestamps
- Conversational, authentic tone
- Target keywords: ${keywords || 'N/A'}
- Include transition phrases between segments
- Add calls to action (subscribe, review, share)
- Outro with summary and next episode tease
- Note places for ad breaks or sponsor mentions

Content: ${content}

Provide complete podcast script with timing and segment structure.`,

    'medium': `Act as a Senior Medium Writer with ${tone} tone and ${style} style.
Transform the content into a compelling Medium article.

Guidelines:
- Engaging title that sparks curiosity (under 60 characters)
- Strong opening hook in first paragraph
- Use personal narrative and storytelling
- Target keywords: ${keywords || 'N/A'}
- Length: 1,000-1,500 words (7-10 minute read)
- Use subheadings (H2/H3) every 2-3 paragraphs
- Include pull quotes or highlighted text for key insights
- Add 1-2 images or visual break suggestions
- Conversational yet insightful tone
- End with thought-provoking conclusion
- Use first-person perspective where appropriate
- Add 3-5 relevant tags (Medium's tagging system)

Content: ${content}

Provide a complete Medium article optimized for reader engagement and distribution.`,

    'quora': `Act as a Quora Expert with ${tone} tone and ${style} style.
Transform the content into an authoritative Quora answer.

Guidelines:
- Direct, concise answer to the implied question
- Length: 300-600 words (detailed but scannable)
- Start with a clear, direct answer summary
- Use bullet points or numbered lists
- Target keywords: ${keywords || 'N/A'}
- Include credibility signals (experience, data, sources)
- Conversational yet expert tone
- Break into sections with bold subheadings
- Use examples or case studies
- End with actionable takeaway
- Avoid promotional language; focus on value
- Use "I" perspective when sharing experience

Content: ${content}

Provide a Quora answer that demonstrates expertise and provides genuine value.`,

    'tiktok': `Act as a Senior TikTok Content Strategist with ${tone} tone and ${style} style.
Transform the content into TikTok video scripts.

Guidelines:
- Hook in first 3 seconds (bold statement/question)
- Script duration: 30-60 seconds
- Short, punchy sentences
- Target keywords: ${keywords || 'N/A'}
- Use text overlay suggestions (3-5 key phrases)
- Include trending sound/music suggestions
- Add visual directions (transitions, effects)
- Conversational, energetic delivery
- End with strong CTA (follow, like, comment)
- Use popular hashtags (3-5 relevant + trending)
- Include caption suggestions (150-200 characters)
- Suggest B-roll or visual ideas
- Fast-paced, mobile-first content

Content: ${content}

Provide complete TikTok script with visual directions, text overlays, and caption.`
  };

  return prompts[platform] || `Transform this content for ${platform} using ${tone} tone and ${style} style:\n\n${content}`;
}

