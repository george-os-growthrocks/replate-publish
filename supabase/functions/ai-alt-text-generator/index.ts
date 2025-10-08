import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type Tone = 'neutral' | 'professional' | 'friendly' | 'playful' | 'authoritative' | 'witty' | 'empathetic';

type AltInput = {
  imageId: string;
  imageUrl?: string;
  filename?: string;
  keywords?: string[];
  language?: string;
  tone?: Tone;
  decorative?: boolean;
  brandRules?: string;
};

type AltVariant = {
  id: string;
  alt: string;
  charCount: number;
  flags: {
    tooLong?: boolean;
    bannedPhrases?: string[];
    missingKw?: string[];
    hasImageOf?: boolean;
  };
  language: string;
  provider: string;
  createdAt: string;
};

type AltResult = {
  input: AltInput;
  variants: AltVariant[];
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { items, projectId } = await req.json();

    if (!items || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({ error: "items array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Alt Text Generator] Processing ${items.length} items`);

    const results: AltResult[] = [];

    for (const item of items as AltInput[]) {
      try {
        // If decorative, return empty alt
        if (item.decorative) {
          const variant: AltVariant = {
            id: crypto.randomUUID(),
            alt: "",
            charCount: 0,
            flags: {},
            language: item.language || 'en',
            provider: 'decorative-bypass',
            createdAt: new Date().toISOString()
          };

          results.push({ input: item, variants: [variant] });
          continue;
        }

        // Generate alt text using AI
        const altText = await generateAltText(item);
        const flags = computeFlags(altText, item.keywords || [], false);

        const variant: AltVariant = {
          id: crypto.randomUUID(),
          alt: altText,
          charCount: altText.length,
          flags,
          language: item.language || 'en',
          provider: 'gemini-vision',
          createdAt: new Date().toISOString()
        };

        results.push({ input: item, variants: [variant] });

        // Store in database if projectId provided
        if (projectId) {
          await supabase.from('alt_text_generations').insert({
            project_id: projectId,
            image_id: item.imageId,
            image_url: item.imageUrl,
            filename: item.filename,
            alt_text: altText,
            language: item.language || 'en',
            tone: item.tone || 'professional',
            keywords: item.keywords || [],
            decorative: false,
            brand_rules: item.brandRules,
            char_count: altText.length,
            flags,
            wcag_compliant: !flags.tooLong && !flags.hasImageOf
          });
        }
      } catch (error) {
        console.error(`[Error] Failed to process item ${item.imageId}:`, error);
        results.push({
          input: item,
          variants: [{
            id: crypto.randomUUID(),
            alt: 'Error generating alt text',
            charCount: 0,
            flags: { bannedPhrases: ['error'] },
            language: item.language || 'en',
            provider: 'error',
            createdAt: new Date().toISOString()
          }]
        });
      }
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('[Error]', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generateAltText(input: AltInput): Promise<string> {
  const geminiKey = Deno.env.get('GEMINI_API_KEY');

  if (!geminiKey) {
    // Fallback to mock generation
    return generateMockAltText(input);
  }

  try {
    const prompt = buildPrompt(input);

    // Use Gemini Vision API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              input.imageUrl ? { inline_data: { mime_type: 'image/jpeg', data: await fetchImageBase64(input.imageUrl) } } : { text: input.filename || 'product image' }
            ]
          }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 100
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return cleanAltText(text, input);
  } catch (error) {
    console.error('[Gemini Error]', error);
    return generateMockAltText(input);
  }
}

function buildPrompt(input: AltInput): string {
  const { keywords, tone, brandRules, language } = input;

  let prompt = `Write concise, WCAG-compliant alt text for this image in ${language || 'English'}.\n\n`;
  prompt += `Rules:\n`;
  prompt += `- Maximum 125 characters (strict limit)\n`;
  prompt += `- Never start with "image of" or "picture of"\n`;
  prompt += `- Describe the essential content and function\n`;
  prompt += `- Tone: ${tone || 'professional'}\n`;

  if (keywords && keywords.length > 0) {
    prompt += `- Naturally include these keywords if relevant: ${keywords.join(', ')}\n`;
  }

  if (brandRules) {
    prompt += `- Brand guidelines: ${brandRules}\n`;
  }

  prompt += `\nOutput only the alt text, no quotes or explanation.`;

  return prompt;
}

function generateMockAltText(input: AltInput): string {
  const { keywords, tone, filename } = input;
  const primaryKw = keywords?.[0] || 'product';

  const templates = {
    professional: `${primaryKw} displayed on neutral background with studio lighting`,
    friendly: `Beautiful ${primaryKw} perfect for everyday use`,
    playful: `Eye-catching ${primaryKw} that stands out`,
    authoritative: `Premium ${primaryKw} featuring superior craftsmanship`,
    witty: `${primaryKw} that'll make you smile`,
    empathetic: `Thoughtfully designed ${primaryKw} for your needs`,
    neutral: `${primaryKw} product image`
  };

  let alt = templates[tone as keyof typeof templates] || templates.neutral;

  // Add context from filename if available
  if (filename && !alt.includes(filename.split('.')[0])) {
    const nameWithoutExt = filename.split('.')[0].replace(/[-_]/g, ' ');
    if (nameWithoutExt.length < 50) {
      alt = `${nameWithoutExt}: ${alt}`;
    }
  }

  return alt.slice(0, 125);
}

function cleanAltText(text: string, input: AltInput): string {
  let cleaned = text.trim();

  // Remove quotes
  cleaned = cleaned.replace(/^["']+|["']+$/g, '');

  // Remove "image of" prefix
  cleaned = cleaned.replace(/^(image of|picture of|photo of)\s+/i, '');

  // Trim to 125 chars
  if (cleaned.length > 125) {
    cleaned = cleaned.slice(0, 122) + '...';
  }

  return cleaned;
}

function computeFlags(
  alt: string,
  keywords: string[],
  decorative: boolean
) {
  if (decorative) return {};

  const trimmed = alt.trim();
  const tooLong = trimmed.length > 140;
  const hasImageOf = /^(image of|picture of|photo of)\b/i.test(trimmed);

  const missingKw = keywords.filter(kw =>
    !new RegExp(`\\b${kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(trimmed)
  );

  const bannedPhrases: string[] = [];
  if (hasImageOf) bannedPhrases.push('image of / picture of');

  return {
    tooLong,
    hasImageOf,
    missingKw: missingKw.length > 0 ? missingKw : undefined,
    bannedPhrases: bannedPhrases.length > 0 ? bannedPhrases : undefined
  };
}

async function fetchImageBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return base64;
  } catch (error) {
    console.error('[Image Fetch Error]', error);
    return '';
  }
}