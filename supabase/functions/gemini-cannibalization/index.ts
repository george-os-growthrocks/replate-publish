import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODELS_ENDPOINT = "https://generativelanguage.googleapis.com/v1/models";
const PREFERRED = ["gemini-2.5-flash", "gemini-2.5-pro"];

async function pickModel(apiKey: string): Promise<string> {
  console.log("Selecting Gemini model for cannibalization analysis...");
  
  for (const m of PREFERRED) {
    const meta = await fetch(`${MODELS_ENDPOINT}/${m}?key=${apiKey}`);
    if (meta.ok) {
      console.log(`✓ Selected model: ${m}`);
      return m;
    }
  }
  
  const res = await fetch(`${MODELS_ENDPOINT}?key=${apiKey}`);
  if (!res.ok) throw new Error(`ListModels failed: ${res.status}`);
  
  const { models } = await res.json();
  const candidate = models?.map((x: any) => x.name?.replace(/^models\//, ""))
    .find((n: string) => /gemini-(2(\.5)?)-flash/.test(n) || /gemini-(2(\.5)?)-pro/.test(n));
  
  if (!candidate) throw new Error("No suitable Gemini model found");
  
  console.log(`✓ Found fallback model: ${candidate}`);
  return candidate;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Gemini Cannibalization Action Plan Started ===");
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header provided');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    if (!user) throw new Error('Unauthorized - no user found');

    const { data: cannibalizationData } = await req.json();
    
    console.log("Cannibalization data:", JSON.stringify(cannibalizationData, null, 2));

    if (!cannibalizationData || cannibalizationData.type !== 'consolidation') {
      throw new Error('Invalid request: Expected consolidation data');
    }

    const { query, primaryPage, supportingPages, metrics } = cannibalizationData;

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const selectedModel = await pickModel(GEMINI_API_KEY);
    const geminiUrl = `${MODELS_ENDPOINT}/${selectedModel}:generateContent?key=${GEMINI_API_KEY}`;
    console.log("Using model:", selectedModel);

    const prompt = `You are a WORLD-CLASS SEO CONSULTANT specializing in keyword cannibalization fixes. You have helped Fortune 500 companies consolidate thousands of pages and recover millions in lost traffic.

CANNIBALIZATION ISSUE:
The keyword "${query}" is ranking on ${supportingPages.length + 1} different pages, splitting ranking signals and causing poor performance.

PAGES COMPETING FOR "${query}":
Primary Candidate (Keep): ${primaryPage}
${supportingPages.map((page: string, idx: number) => `Competing Page ${idx + 1}: ${page}`).join('\n')}

DETAILED METRICS:
${JSON.stringify(metrics, null, 2)}

YOUR TASK:
Create a COMPREHENSIVE, STEP-BY-STEP action plan to fix this cannibalization issue and consolidate ranking signals. This is for an experienced SEO professional - be specific, technical, and actionable.

Return ONLY valid JSON in this format (NO markdown, NO code blocks):

{
  "insight": "# Cannibalization Action Plan: ${query}\n\n## 📊 SITUATION ANALYSIS\n\n### Current State\n- **Query:** \"${query}\"\n- **Competing Pages:** ${supportingPages.length + 1} pages\n- **Total Lost Opportunity:** [calculate based on metrics]\n- **Primary Issue:** Search engines can't determine which page to rank, splitting link equity and relevance signals\n\n### Page Performance Breakdown\n[For each page, analyze: position, clicks, impressions, CTR, identify which has the best metrics]\n\n### Root Cause\n[Analyze why cannibalization happened: similar content, same keyword targeting, thin content, etc.]\n\n---\n\n## 🎯 RECOMMENDED STRATEGY\n\n**STRATEGY:** [Choose: Full Consolidation (301 redirects) OR Content Differentiation OR Canonical Tags]\n\n**Why this strategy:** [Explain reasoning based on data]\n\n**Expected Outcome:** \n- Estimated position improvement: [X positions]\n- Projected traffic gain: [+X clicks/month]\n- Timeline: [X weeks to see results]\n\n---\n\n## 📋 STEP-BY-STEP ACTION PLAN\n\n### PHASE 1: CONTENT AUDIT & PREPARATION (Week 1)\n\n**Step 1: Analyze All Competing Pages**\n- [ ] Export full HTML of all ${supportingPages.length + 1} pages\n- [ ] Compare word counts: ${primaryPage} vs others\n- [ ] Identify unique content on each page (paragraphs, images, data that only exists on one page)\n- [ ] Check internal link equity: Use Screaming Frog to see how many internal links each page has\n- [ ] Review backlinks: Use Ahrefs/SEMrush to see external links to each URL\n\n**Step 2: Choose Primary Page** \n✅ **Recommended: ${primaryPage}**\n\nWhy this page:\n- [List specific reasons: better metrics, more backlinks, better URL structure, etc.]\n- Position: [X]\n- Clicks: [Y]\n- Impressions: [Z]\n\n**Step 3: Extract Valuable Content from Supporting Pages**\n${supportingPages.map((page: string, idx: number) => `\n**From ${page}:**\n- Extract: [specific sections, images, data points]\n- Action: [where to merge this into primary page]`).join('\n')}\n\n### PHASE 2: CONTENT CONSOLIDATION (Week 1-2)\n\n**Step 4: Enhance the Primary Page (${primaryPage})**\n\n**Content to Add:**\n- Merge all unique valuable content from supporting pages\n- Target word count: [X words] (analyze top 3 competitors)\n- Add these sections: [specific H2/H3 recommendations]\n- Include: comparison tables, FAQs, expert tips, media\n\n**On-Page SEO Optimization:**\n- [ ] Update title tag: \"[suggested title with ${query}]\"\n- [ ] Meta description: \"[suggested meta]\"\n- [ ] H1: \"[suggested H1]\"\n- [ ] Add schema markup: [Article, FAQ, or other relevant schema]\n- [ ] Optimize images: Alt tags with keyword variations\n- [ ] Add internal links to [X related pages]\n\n**Step 5: Update Internal Linking Architecture**\n- [ ] Find all internal links pointing to supporting pages (use Screaming Frog)\n- [ ] Update these links to point to ${primaryPage} BEFORE implementing redirects\n- [ ] Update sitemap\n- [ ] Update navigation if any supporting pages are in menus\n\n### PHASE 3: TECHNICAL IMPLEMENTATION (Week 2)\n\n**Step 6: Implement 301 Redirects**\n\n${supportingPages.map((page: string, idx: number) => `\n**Redirect ${idx + 1}:**\n\`\`\`\n${page} → ${primaryPage}\n\`\`\`\nImplementation:\n- [ ] Add 301 redirect in .htaccess / nginx config / CDN\n- [ ] Test redirect with redirect checker tool\n- [ ] Verify redirect type is 301 (permanent), not 302`).join('\n')}\n\n**Step 7: Update Google Search Console**\n- [ ] Submit updated sitemap\n- [ ] Request re-crawl of ${primaryPage} via URL Inspection Tool\n- [ ] Monitor index coverage report for de-indexing of old URLs\n\n**Step 8: Monitor & Track**\n- [ ] Set up position tracking for \"${query}\" in your SEO tool\n- [ ] Create Google Analytics annotations for redirect date\n- [ ] Monitor GSC for any crawl errors\n- [ ] Track traffic to ${primaryPage} weekly\n\n### PHASE 4: POST-LAUNCH OPTIMIZATION (Week 3-8)\n\n**Step 9: Build Authority to Primary Page**\n- [ ] Add 8-12 contextual internal links from high-authority pages\n- [ ] Consider reaching out for new backlinks to ${primaryPage}\n- [ ] Share updated content on social media\n- [ ] Add to email newsletter if applicable\n\n**Step 10: Content Expansion Based on Results**\n- Week 4: Analyze user behavior (time on page, bounce rate)\n- Week 6: Check position improvements\n- Week 8: If not ranking #1-3, analyze top competitors and enhance content further\n\n---\n\n## ⚠️ CRITICAL SUCCESS FACTORS\n\n1. **DO NOT delete supporting pages** - use 301 redirects to preserve link equity\n2. **Update internal links BEFORE redirecting** to minimize redirect chains\n3. **Preserve valuable content** - don't just delete supporting pages, merge their best content\n4. **Monitor GSC daily** for the first 2 weeks to catch any issues early\n5. **Be patient** - full consolidation benefits typically take 4-8 weeks\n\n---\n\n## 📈 SUCCESS METRICS\n\n**Track These KPIs:**\n- Position for \"${query}\": Target top 3 (currently scattered across multiple positions)\n- Organic clicks to primary page: Target [+X%] increase\n- Impressions: Should consolidate (may initially drop as pages de-index, then rise)\n- CTR: Should improve as stronger page ranks better\n- Total organic traffic to site: Target [+X clicks/month]\n\n**Expected Timeline:**\n- Week 1-2: Implement redirects, position may fluctuate\n- Week 3-4: Consolidation stabilizes, start seeing improvements\n- Week 5-8: Full ranking recovery, should see significant position gains\n- Month 3+: Continued improvements as consolidated page gains authority\n\n---\n\n## 🚨 ALTERNATIVE: Content Differentiation\n\nIf pages serve genuinely different user intents, consider differentiation instead:\n\n${supportingPages.map((page: string, idx: number) => `\n**${page}:**\n- Target keyword variation: \"[suggest specific long-tail variant]\"\n- Content angle: [suggest unique angle]\n- Update title to reflect this specific intent`).join('\n')}\n\n---\n\n## 💡 PRO TIPS FROM 20+ YEARS SEO EXPERIENCE\n\n1. **Check competitors:** How many pages do top-ranking sites use for \"${query}\"? Usually just 1.\n2. **Preserve redirect history:** Keep redirect map documented for future reference\n3. **Consider canonical tags** if you can't do redirects (but redirects are better)\n4. **Don't be afraid to kill pages:** Sometimes less is more in SEO\n5. **Update your content calendar:** Note to never create competing content for \"${query}\" again\n\n---\n\n## 📞 NEXT IMMEDIATE ACTIONS (Do This NOW)\n\n1. ⚡ **Today:** Back up all competing pages (HTML, content, images)\n2. ⚡ **Today:** Audit backlinks to each URL using Ahrefs/SEMrush  \n3. ⚡ **Tomorrow:** Create content consolidation document\n4. ⚡ **This Week:** Enhance primary page with merged content\n5. ⚡ **Next Week:** Implement redirects and monitor\n\n---\n\n**Estimated Business Impact:**\n- Traffic gain: [+X clicks/month based on data]\n- Revenue opportunity: [estimate if applicable]\n- Time investment: 12-16 hours total\n- Expected ROI: [calculate based on traffic value]\n\n**This is your complete roadmap. Follow each step systematically, and you'll consolidate your rankings and recapture lost traffic within 4-8 weeks. Let's fix this cannibalization and dominate position 1-3 for \"${query}\"! 🚀**"
}

CRITICAL REQUIREMENTS:
1. The "insight" field contains the ENTIRE action plan in Markdown format
2. Use REAL data from the metrics provided - calculate actual numbers
3. Be HYPER-SPECIFIC: exact redirects, exact steps, exact timelines
4. Include checkboxes [ ] so they can track progress
5. Think like a $500/hour SEO consultant - comprehensive and professional
6. Calculate estimated traffic gains based on the actual metrics
7. Cover EVERY aspect: content, technical, monitoring, post-launch
8. Return ONLY the JSON object - no markdown wrappers, no code blocks, no extra text`;

    console.log("Prompt length:", prompt.length);

    const geminiResponse = await fetch(geminiUrl, {
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
          temperature: 0.4,
          maxOutputTokens: 8192,
          topP: 0.95,
        }
      }),
    });

    console.log("Gemini response status:", geminiResponse.status);

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    console.log("Generated text length:", generatedText?.length || 0);
    console.log("Generated text preview:", generatedText?.substring(0, 500));

    if (!generatedText) {
      throw new Error('No content generated by Gemini');
    }

    // Parse JSON response
    let result;
    try {
      let jsonText = generatedText.trim();
      
      // Extract from markdown if needed
      const markdownMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (markdownMatch) {
        jsonText = markdownMatch[1].trim();
      }
      
      // Find JSON boundaries
      const jsonStart = jsonText.indexOf('{');
      const jsonEnd = jsonText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
      }
      
      result = JSON.parse(jsonText);
      console.log("✓ Successfully parsed Gemini response");
      
    } catch (e) {
      console.error('JSON parse error:', e);
      console.error('Failed text:', generatedText.substring(0, 500));
      
      // Fallback: use raw text as markdown
      result = {
        insight: `# Cannibalization Action Plan: ${query}\n\n${generatedText}`
      };
    }

    console.log("=== Cannibalization Action Plan Complete ===");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in gemini-cannibalization function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

