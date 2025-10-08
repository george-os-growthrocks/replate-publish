import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type Tone = 'neutral' | 'professional' | 'friendly' | 'playful' | 'urgent' | 'authoritative' | 'witty' | 'empathetic';

type GenerateInput = {
  category: string;
  url?: string;
  keywords: string[];
  tone: Tone;
  audience?: string;
  brand?: string;
  language?: string;
  charTarget?: number;
  pixelTarget?: { device: 'desktop' | 'mobile'; px: number };
  guidelines?: string;
};

type Variant = {
  id: string;
  hero: string;
  plpFooter: string;
  metaTitle: string;
  metaDescription: string;
  internalLinks: string[];
  charCountMeta: number;
  pixelWidthMeta: number;
  flags: {
    overChars?: boolean;
    overPixels?: boolean;
    missingKw?: string[];
  };
  createdAt: string;
};

type GenerationResult = {
  input: GenerateInput;
  variants: Variant[];
  model?: string;
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

    const { input, projectId } = await req.json();

    if (!input || !input.category) {
      return new Response(
        JSON.stringify({ error: "input.category is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Category Generator] Processing ${input.category}`);

    // Generate content using AI
    const result = await generateCategoryContent(input);

    // Store in database if projectId provided
    if (projectId && result.variants.length > 0) {
      const v = result.variants[0];
      await supabase.from('category_descriptions').insert({
        project_id: projectId,
        category_name: input.category,
        url: input.url,
        hero_paragraph: v.hero,
        plp_footer: v.plpFooter,
        meta_title: v.metaTitle,
        meta_description: v.metaDescription,
        internal_links: v.internalLinks,
        keywords: input.keywords,
        tone: input.tone,
        language: input.language || 'en',
        audience: input.audience,
        brand: input.brand,
        char_count_meta: v.charCountMeta,
        pixel_width_meta: v.pixelWidthMeta,
        flags: v.flags,
        status: 'draft'
      });
    }

    return new Response(
      JSON.stringify(result),
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

async function generateCategoryContent(input: GenerateInput): Promise<GenerationResult> {
  const geminiKey = Deno.env.get('GEMINI_API_KEY');

  if (!geminiKey) {
    return generateMockContent(input);
  }

  try {
    const prompt = buildPrompt(input);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return parseGeneratedContent(text, input);
  } catch (error) {
    console.error('[Gemini Error]', error);
    return generateMockContent(input);
  }
}

function buildPrompt(input: GenerateInput): string {
  const { category, keywords, tone, audience, brand, guidelines, language } = input;

  let prompt = `You are an expert SEO copywriter. Generate category page content for an e-commerce website.\n\n`;
  prompt += `Category: ${category}\n`;
  prompt += `Primary keywords: ${keywords.join(', ')}\n`;
  prompt += `Tone: ${tone}\n`;
  prompt += `Language: ${language || 'English'}\n`;

  if (audience) prompt += `Target audience: ${audience}\n`;
  if (brand) prompt += `Brand: ${brand}\n`;
  if (guidelines) prompt += `Guidelines: ${guidelines}\n`;

  prompt += `\nGenerate the following (use JSON format):\n`;
  prompt += `{\n`;
  prompt += `  "metaTitle": "SEO meta title (≤60 chars)",\n`;
  prompt += `  "metaDescription": "SEO meta description (≤155 chars)",\n`;
  prompt += `  "hero": "Hero paragraph (80-140 words, benefit-focused)",\n`;
  prompt += `  "plpFooter": "PLP footer (180-260 words, semantic-rich, include long-tail keywords)",\n`;
  prompt += `  "internalLinks": ["anchor text 1", "anchor text 2", ...]\n`;
  prompt += `}\n\n`;
  prompt += `Rules:\n`;
  prompt += `- Include primary keywords naturally\n`;
  prompt += `- No promotional fluff\n`;
  prompt += `- Focus on benefits and use cases\n`;
  prompt += `- Avoid "image of" style descriptions\n`;
  prompt += `- Generate 3-7 internal link anchor texts\n`;

  return prompt;
}

function parseGeneratedContent(text: string, input: GenerateInput): GenerationResult {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/```\s*([\s\S]*?)```/);
    const jsonText = jsonMatch ? jsonMatch[1] : text;

    const parsed = JSON.parse(jsonText);

    const metaDescription = parsed.metaDescription || '';
    const charCount = metaDescription.length;
    const pixelWidth = estimatePixelWidth(metaDescription);
    const flags = validateMeta(metaDescription, input.keywords, input.charTarget || 155, input.pixelTarget?.px);

    const variant: Variant = {
      id: crypto.randomUUID(),
      hero: parsed.hero || '',
      plpFooter: parsed.plpFooter || '',
      metaTitle: parsed.metaTitle || `${input.category} | ${input.brand || 'Shop'} 2025`,
      metaDescription,
      internalLinks: parsed.internalLinks || [],
      charCountMeta: charCount,
      pixelWidthMeta: pixelWidth,
      flags,
      createdAt: new Date().toISOString()
    };

    return { input, variants: [variant], model: 'gemini-pro' };
  } catch (error) {
    console.error('[Parse Error]', error);
    return generateMockContent(input);
  }
}

function generateMockContent(input: GenerateInput): GenerationResult {
  const { category, keywords, brand, tone } = input;
  const primary = keywords[0] || category;

  const metaDescription = `Discover ${category.toLowerCase()}: curated picks in premium materials and trending styles. Shop ${primary} — fast shipping & easy returns.`;

  const variant: Variant = {
    id: crypto.randomUUID(),
    hero: `Meet ${category.toLowerCase()} built for comfort, style, and real-life wear. From everyday staples to limited drops, our edit balances fabric feel with versatile fits. Filter by color, size, or cut to dial in your look and get back to living.`,
    plpFooter: `Building a capsule around ${category.toLowerCase()}? Start with the essentials, then layer seasonal textures and shades. Explore silhouettes designed to move with you — and lean on our fit guides when you need a second opinion. New arrivals land weekly, so check back for fresh colors and collabs. Browse by size, coverage, color, or set type to get the perfect match.`,
    metaTitle: `${category} | ${brand || 'Shop New Arrivals'} 2025`,
    metaDescription,
    internalLinks: [
      `${category} size guide`,
      `${primary} best sellers`,
      `New ${category.toLowerCase()} arrivals`
    ],
    charCountMeta: metaDescription.length,
    pixelWidthMeta: estimatePixelWidth(metaDescription),
    flags: validateMeta(metaDescription, keywords, input.charTarget || 155, input.pixelTarget?.px),
    createdAt: new Date().toISOString()
  };

  return { input, variants: [variant], model: 'mock' };
}

function validateMeta(
  metaDescription: string,
  keywords: string[],
  charTarget: number,
  pixelTargetPx?: number
) {
  const charCount = metaDescription.trim().length;
  const pixelWidth = estimatePixelWidth(metaDescription);

  const missingKw = keywords.filter(kw =>
    !new RegExp(`\\b${kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(metaDescription)
  );

  return {
    overChars: charCount > charTarget,
    overPixels: pixelTargetPx ? pixelWidth > pixelTargetPx : false,
    missingKw: missingKw.length > 0 ? missingKw : undefined
  };
}

function estimatePixelWidth(text: string): number {
  // Rough estimate: average char width in Arial 14px is ~7.5px
  return Math.round(text.length * 7.5);
}