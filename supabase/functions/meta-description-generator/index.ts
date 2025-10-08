import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type Tone = 'neutral' | 'professional' | 'friendly' | 'playful' | 'urgent' | 'authoritative' | 'witty' | 'empathetic';

type GenerateInput = {
  title: string;
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
  text: string;
  charCount: number;
  pixelWidth: number;
  keywordCoverage: { [kw: string]: boolean };
  readingEase?: number;
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
  promptTokenUsage?: number;
  completionTokenUsage?: number;
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

    const { input, projectId, action = 'generate', variantId } = await req.json();

    if (!input || !input.title) {
      return new Response(
        JSON.stringify({ error: "input.title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Meta Generator] ${action} for: ${input.title}`);

    let result: GenerationResult;

    if (action === 'rewrite' && variantId) {
      result = await rewriteVariant(variantId, input);
    } else {
      result = await generateMetaDescriptions(input);
    }

    // Store in database if projectId provided
    if (projectId && result.variants.length > 0) {
      const bestVariant = result.variants[0];

      const { data: metaDesc, error: insertError } = await supabase
        .from('meta_descriptions')
        .insert({
          project_id: projectId,
          page_url: input.url,
          page_title: input.title,
          description_text: bestVariant.text,
          language: input.language || 'en',
          tone: input.tone,
          audience: input.audience,
          brand: input.brand,
          keywords: input.keywords,
          guidelines: input.guidelines,
          char_count: bestVariant.charCount,
          pixel_width_desktop: bestVariant.pixelWidth,
          pixel_width_mobile: estimatePixelWidth(bestVariant.text, 'mobile'),
          char_target: input.charTarget || 155,
          pixel_target: input.pixelTarget || { device: 'desktop', px: 920 },
          keyword_coverage: bestVariant.keywordCoverage,
          reading_ease: bestVariant.readingEase,
          flags: bestVariant.flags,
          provider: result.model || 'gemini',
          prompt_tokens: result.promptTokenUsage || 0,
          completion_tokens: result.completionTokenUsage || 0,
          status: 'draft'
        })
        .select()
        .single();

      if (insertError) {
        console.error('[DB Error]', insertError);
      } else {
        // Store additional variants
        for (let i = 1; i < result.variants.length; i++) {
          const variant = result.variants[i];
          await supabase.from('meta_description_variants').insert({
            meta_description_id: metaDesc.id,
            variant_text: variant.text,
            char_count: variant.charCount,
            pixel_width: variant.pixelWidth,
            keyword_coverage: variant.keywordCoverage,
            reading_ease: variant.readingEase,
            flags: variant.flags
          });
        }
      }
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

async function generateMetaDescriptions(input: GenerateInput): Promise<GenerationResult> {
  const geminiKey = Deno.env.get('GEMINI_API_KEY');

  if (!geminiKey) {
    return generateMockDescriptions(input);
  }

  try {
    const prompt = buildGeneratePrompt(input);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 500,
            topP: 0.95
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return parseGeneratedDescriptions(text, input);
  } catch (error) {
    console.error('[Gemini Error]', error);
    return generateMockDescriptions(input);
  }
}

function buildGeneratePrompt(input: GenerateInput): string {
  const { title, keywords, tone, audience, brand, language, charTarget, guidelines } = input;

  let prompt = `You are an expert SEO copywriter. Generate 5 compelling meta descriptions in ${language || 'English'}.\n\n`;
  prompt += `Page Title: ${title}\n`;
  prompt += `Keywords: ${keywords.join(', ')}\n`;
  prompt += `Tone: ${tone}\n`;
  if (audience) prompt += `Target Audience: ${audience}\n`;
  if (brand) prompt += `Brand: ${brand}\n`;
  if (guidelines) prompt += `Guidelines: ${guidelines}\n`;
  prompt += `\nRequirements:\n`;
  prompt += `- Maximum ${charTarget || 155} characters (strict)\n`;
  prompt += `- Include primary keyword "${keywords[0]}" naturally\n`;
  prompt += `- Clear value proposition\n`;
  prompt += `- Soft call-to-action\n`;
  prompt += `- No quotes or special characters\n`;
  prompt += `- Benefit-focused and CTR-optimized\n`;
  prompt += `\nOutput Format (JSON):\n`;
  prompt += `{"variants": ["description 1", "description 2", "description 3", "description 4", "description 5"]}\n`;

  return prompt;
}

function parseGeneratedDescriptions(text: string, input: GenerateInput): GenerationResult {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : text;
    const parsed = JSON.parse(jsonText);

    const descriptions = parsed.variants || [];
    const variants: Variant[] = [];

    for (const desc of descriptions) {
      const cleaned = cleanDescription(desc);
      if (cleaned.length === 0) continue;

      const variant = createVariant(cleaned, input);
      variants.push(variant);
    }

    // Deduplicate
    const deduplicated = deduplicateVariants(variants);

    return {
      input,
      variants: deduplicated.slice(0, 5),
      model: 'gemini-pro'
    };
  } catch (error) {
    console.error('[Parse Error]', error);
    return generateMockDescriptions(input);
  }
}

function generateMockDescriptions(input: GenerateInput): GenerationResult {
  const { title, keywords, tone, brand, charTarget = 155 } = input;
  const primary = keywords[0] || 'products';

  const templates = {
    professional: [
      `Discover ${primary} at ${brand || 'our store'}. Expert solutions with proven results. Shop now for quality and reliability.`,
      `${brand || 'We'} offer premium ${primary} designed for ${title.toLowerCase()}. Get started today with our trusted solutions.`,
      `Expert ${primary} services and products. Transform your ${title.toLowerCase()} with our proven approach. Learn more.`
    ],
    friendly: [
      `Looking for ${primary}? We've got you covered! Explore our ${title.toLowerCase()} collection and find your perfect match.`,
      `${primary} made easy! Check out our ${title.toLowerCase()} selection and discover something special today.`
    ],
    urgent: [
      `Don't miss out on ${primary}! Limited-time offers on ${title.toLowerCase()}. Shop now before it's too late!`,
      `Act now! Premium ${primary} available. Transform your ${title.toLowerCase()} today with exclusive deals.`
    ]
  };

  const toneTemplates = templates[tone as keyof typeof templates] || templates.professional;
  const variants: Variant[] = [];

  for (let i = 0; i < 5; i++) {
    const template = toneTemplates[i % toneTemplates.length];
    let desc = template.slice(0, charTarget);

    // Add variation
    if (i > 0) {
      desc = desc.replace(/\.$/, ` ${i % 2 === 0 ? 'Free shipping' : 'Expert support'} included.`);
    }

    desc = desc.slice(0, charTarget);
    variants.push(createVariant(desc, input));
  }

  return {
    input,
    variants: deduplicateVariants(variants),
    model: 'mock'
  };
}

async function rewriteVariant(variantId: string, input: GenerateInput): Promise<GenerationResult> {
  // Simplified rewrite - in production, fetch original and adjust
  return generateMetaDescriptions(input);
}

function createVariant(text: string, input: GenerateInput): Variant {
  const cleaned = cleanDescription(text);
  const charCount = cleaned.length;
  const pixelWidth = estimatePixelWidth(cleaned, 'desktop');
  const keywordCoverage = calculateKeywordCoverage(cleaned, input.keywords);
  const readingEase = calculateReadingEase(cleaned);
  const flags = validateDescription(cleaned, input);

  return {
    id: crypto.randomUUID(),
    text: cleaned,
    charCount,
    pixelWidth,
    keywordCoverage,
    readingEase,
    flags,
    createdAt: new Date().toISOString()
  };
}

function cleanDescription(text: string): string {
  return text
    .replace(/^["']+|["']+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function estimatePixelWidth(text: string, device: 'desktop' | 'mobile'): number {
  // Average char width: desktop ~7.5px, mobile ~6.5px
  const avgWidth = device === 'desktop' ? 7.5 : 6.5;
  return Math.round(text.length * avgWidth);
}

function calculateKeywordCoverage(text: string, keywords: string[]): { [kw: string]: boolean } {
  const lower = text.toLowerCase();
  const coverage: { [kw: string]: boolean } = {};

  for (const kw of keywords) {
    coverage[kw] = new RegExp(`\\b${kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(lower);
  }

  return coverage;
}

function calculateReadingEase(text: string): number {
  // Simplified Flesch Reading Ease
  const words = text.split(/\s+/).length;
  const sentences = (text.match(/[.!?]+/g) || ['']).length;
  const syllables = text.split(/\s+/).reduce((sum, word) => sum + countSyllables(word), 0);

  const avgWordsPerSentence = words / Math.max(sentences, 1);
  const avgSyllablesPerWord = syllables / Math.max(words, 1);

  const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  return Math.max(0, Math.min(100, score));
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length === 0) return 0;

  const vowels = 'aeiouy';
  let count = 0;
  let prevWasVowel = false;

  for (const char of word) {
    const isVowel = vowels.includes(char);
    if (isVowel && !prevWasVowel) count++;
    prevWasVowel = isVowel;
  }

  if (word.endsWith('e')) count--;
  return Math.max(count, 1);
}

function validateDescription(text: string, input: GenerateInput): any {
  const charCount = text.length;
  const pixelWidth = estimatePixelWidth(text, input.pixelTarget?.device || 'desktop');
  const charTarget = input.charTarget || 155;
  const pixelTarget = input.pixelTarget?.px || 920;

  const coverage = calculateKeywordCoverage(text, input.keywords);
  const missingKw = Object.entries(coverage)
    .filter(([_, covered]) => !covered)
    .map(([kw]) => kw);

  return {
    overChars: charCount > charTarget,
    overPixels: pixelWidth > pixelTarget,
    missingKw: missingKw.length > 0 ? missingKw : undefined
  };
}

function deduplicateVariants(variants: Variant[]): Variant[] {
  const seen = new Set<string>();
  return variants.filter(v => {
    const normalized = v.text.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}