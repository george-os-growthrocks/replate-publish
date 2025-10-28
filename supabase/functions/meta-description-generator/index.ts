import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { content, keyword, url } = await req.json();

    if (!content && !url) {
      throw new Error('Either content or URL is required');
    }

    console.log('Meta description generation request:', { hasContent: !!content, url });

    // Prepare the content
    let textContent = content;

    // If URL is provided, fetch the content (basic implementation)
    if (url && !content) {
      try {
        const response = await fetch(url);
        const html = await response.text();
        
        // Extract text from HTML (basic - remove tags)
        textContent = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 5000); // Limit to first 5000 chars
      } catch (error) {
        console.error('Error fetching URL:', error);
        throw new Error('Failed to fetch content from URL');
      }
    }

    if (!textContent) {
      throw new Error('No content available to generate meta description');
    }

    // Use Gemini AI to generate meta descriptions
    const prompt = `You are an SEO expert. Generate 5 different meta descriptions for the following content.

${keyword ? `Target Keyword: ${keyword}\n` : ''}
Content:
${textContent.substring(0, 2000)}

Requirements:
1. Each meta description should be 150-160 characters
2. Include the target keyword naturally${keyword ? ` (${keyword})` : ''}
3. Be compelling and encourage clicks
4. Use action words
5. Make each variation different in tone (professional, casual, urgency, benefit-focused, question-based)

Format your response as a JSON array of objects with this structure:
[
  {
    "text": "meta description here",
    "length": 155,
    "style": "professional",
    "hasKeyword": true
  }
]

IMPORTANT: Return ONLY the JSON array, no other text.`;

    // Call Gemini AI
    const aiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + Deno.env.get('GEMINI_API_KEY'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1000,
        }
      })
    });

    if (!aiResponse.ok) {
      throw new Error('AI generation failed');
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No response from AI');
    }

    console.log('AI Response:', generatedText);

    // Parse the JSON response
    let variations;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       generatedText.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, generatedText];
      
      const jsonText = jsonMatch[1] || generatedText;
      variations = JSON.parse(jsonText.trim());
    } catch (error) {
      console.error('JSON parsing error:', error);
      // Fallback: create variations from the text
      variations = [{
        text: generatedText.substring(0, 160),
        length: Math.min(generatedText.length, 160),
        style: 'generated',
        hasKeyword: keyword ? generatedText.toLowerCase().includes(keyword.toLowerCase()) : false
      }];
    }

    // Validate and ensure all variations meet requirements
    const validatedVariations = variations.map((v: any) => ({
      text: v.text.substring(0, 160),
      length: Math.min(v.text.length, 160),
      style: v.style || 'standard',
      hasKeyword: keyword ? v.text.toLowerCase().includes(keyword.toLowerCase()) : true,
      pixelWidth: Math.round(v.text.length * 6.5), // Approximate pixel width
      ctrPrediction: calculateCTRPrediction(v.text, keyword),
    }));

    console.log('Generated variations:', validatedVariations.length);

    return new Response(
      JSON.stringify({
        variations: validatedVariations,
        keyword: keyword || null,
        sourceUrl: url || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Meta Description Generation Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Simple CTR prediction based on best practices
function calculateCTRPrediction(text: string, keyword?: string): string {
  let score = 50; // Base score

  // Length check (optimal: 150-160)
  const length = text.length;
  if (length >= 150 && length <= 160) {
    score += 15;
  } else if (length >= 140 && length < 150) {
    score += 10;
  } else if (length > 160) {
    score -= 10;
  }

  // Keyword presence
  if (keyword && text.toLowerCase().includes(keyword.toLowerCase())) {
    score += 10;
  }

  // Action words
  const actionWords = ['discover', 'learn', 'get', 'find', 'see', 'explore', 'start', 'try', 'join', 'unlock'];
  if (actionWords.some(word => text.toLowerCase().includes(word))) {
    score += 10;
  }

  // Numbers
  if (/\d+/.test(text)) {
    score += 5;
  }

  // Question mark
  if (text.includes('?')) {
    score += 5;
  }

  // Power words
  const powerWords = ['best', 'ultimate', 'complete', 'expert', 'proven', 'guaranteed', 'free'];
  if (powerWords.some(word => text.toLowerCase().includes(word))) {
    score += 5;
  }

  // Cap at 100
  score = Math.min(score, 100);

  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Needs Improvement';
}

