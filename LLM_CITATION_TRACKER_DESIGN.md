# LLM CITATION TRACKER - "GEO" SECTION
## The Future of SEO: Track Your Rankings in AI Search Engines

---

## 🎯 FEATURE OVERVIEW

**Problem:** Websites now need to rank not just in Google, but in ChatGPT, Claude, Perplexity, and Gemini responses.

**Solution:** Track if your domain appears when users ask LLMs about your topics.

**Value Prop:** "The only SEO tool that tracks your rankings in AI search engines"

---

## 🏗️ ARCHITECTURE

### Database Schema

```sql
-- Main tracking table
CREATE TABLE llm_citations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES seo_projects NOT NULL,
  domain TEXT NOT NULL,
  query TEXT NOT NULL,
  llm_model TEXT NOT NULL, -- 'chatgpt', 'claude', 'gemini', 'perplexity'
  is_cited BOOLEAN DEFAULT false,
  citation_position INTEGER, -- Position in response (1=first mentioned)
  citation_context TEXT, -- The sentence where domain was mentioned
  full_response TEXT, -- Complete LLM response
  response_quality_score INTEGER, -- 1-100
  competitors_cited TEXT[], -- Other domains mentioned
  tracked_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, query, llm_model, tracked_date)
);

CREATE INDEX idx_llm_citations_project ON llm_citations(project_id);
CREATE INDEX idx_llm_citations_date ON llm_citations(tracked_date);
CREATE INDEX idx_llm_citations_model ON llm_citations(llm_model);

-- Query templates for tracking
CREATE TABLE llm_tracking_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES seo_projects NOT NULL,
  query_template TEXT NOT NULL,
  category TEXT, -- 'product', 'how-to', 'comparison', 'review', etc.
  target_keywords TEXT[],
  is_active BOOLEAN DEFAULT true,
  tracking_frequency TEXT DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historical trends
CREATE TABLE llm_citation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES seo_projects NOT NULL,
  llm_model TEXT NOT NULL,
  total_queries_tracked INTEGER DEFAULT 0,
  total_citations INTEGER DEFAULT 0,
  citation_rate DECIMAL(5,2), -- Percentage
  avg_position DECIMAL(5,2),
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, llm_model, date)
);
```

---

## 🔧 BACKEND: Edge Functions

### 1. `llm-citation-tracker/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// LLM API configurations
const LLM_APIS = {
  chatgpt: {
    url: "https://api.openai.com/v1/chat/completions",
    key: Deno.env.get("OPENAI_API_KEY"),
    model: "gpt-4o", // Latest model with web search
  },
  claude: {
    url: "https://api.anthropic.com/v1/messages",
    key: Deno.env.get("ANTHROPIC_API_KEY"),
    model: "claude-3-7-sonnet-20250219", // Latest Claude
  },
  gemini: {
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent",
    key: Deno.env.get("GEMINI_API_KEY"),
  },
  perplexity: {
    url: "https://api.perplexity.ai/chat/completions",
    key: Deno.env.get("PERPLEXITY_API_KEY"),
    model: "sonar-pro", // Perplexity's web search model
  },
};

async function queryLLM(model: string, query: string) {
  const config = LLM_APIS[model];
  if (!config || !config.key) {
    throw new Error(`${model} API key not configured`);
  }

  let response;
  
  switch (model) {
    case "chatgpt":
      response = await fetch(config.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.key}`,
        },
        body: JSON.stringify({
          model: config.model,
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
      const chatgptData = await response.json();
      return chatgptData.choices[0].message.content;

    case "claude":
      response = await fetch(config.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: query,
            },
          ],
        }),
      });
      const claudeData = await response.json();
      return claudeData.content[0].text;

    case "gemini":
      response = await fetch(`${config.url}?key=${config.key}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: query,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
          },
        }),
      });
      const geminiData = await response.json();
      return geminiData.candidates[0].content.parts[0].text;

    case "perplexity":
      response = await fetch(config.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.key}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: "user",
              content: query,
            },
          ],
        }),
      });
      const perplexityData = await response.json();
      return perplexityData.choices[0].message.content;

    default:
      throw new Error(`Unknown model: ${model}`);
  }
}

function analyzeCitation(domain: string, response: string) {
  // Remove protocol and www
  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "");
  
  // Check if domain is mentioned
  const isCited = response.toLowerCase().includes(cleanDomain.toLowerCase());
  
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
      return sentence.trim();
    }
  }
  return "";
}

function extractDomains(text: string, excludeDomain: string): string[] {
  // Regex to find URLs/domains
  const domainRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/g;
  const matches = text.match(domainRegex) || [];
  
  // Clean and filter
  const domains = matches
    .map(d => d.replace(/^(https?:\/\/)?(www\.)?/, ""))
    .filter(d => d.toLowerCase() !== excludeDomain.toLowerCase());
  
  // Return unique domains
  return [...new Set(domains)];
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
      // Track citations for given queries across all models
      const results = [];

      for (const query of queries) {
        for (const model of models) {
          console.log(`Querying ${model} with: "${query}"`);
          
          try {
            // Query the LLM
            const response = await queryLLM(model, query);
            
            // Analyze citation
            const analysis = analyzeCitation(domain, response);
            
            // Save to database
            const { data, error } = await supabaseClient
              .from("llm_citations")
              .upsert({
                project_id,
                domain,
                query,
                llm_model: model,
                is_cited: analysis.is_cited,
                citation_position: analysis.citation_position,
                citation_context: analysis.citation_context,
                full_response: response,
                competitors_cited: analysis.competitors_cited,
                tracked_date: new Date().toISOString().split("T")[0],
              });

            if (error) throw error;

            results.push({
              query,
              model,
              ...analysis,
            });
          } catch (error) {
            console.error(`Error querying ${model}:`, error);
            results.push({
              query,
              model,
              error: error.message,
            });
          }
        }
      }

      // Update daily stats
      for (const model of models) {
        const { data: stats } = await supabaseClient
          .from("llm_citations")
          .select("is_cited, citation_position")
          .eq("project_id", project_id)
          .eq("llm_model", model)
          .eq("tracked_date", new Date().toISOString().split("T")[0]);

        if (stats && stats.length > 0) {
          const totalQueries = stats.length;
          const totalCitations = stats.filter(s => s.is_cited).length;
          const citationRate = (totalCitations / totalQueries) * 100;
          const avgPosition =
            stats
              .filter(s => s.citation_position)
              .reduce((sum, s) => sum + s.citation_position, 0) /
              stats.filter(s => s.citation_position).length || 0;

          await supabaseClient.from("llm_citation_history").upsert({
            project_id,
            llm_model: model,
            total_queries_tracked: totalQueries,
            total_citations: totalCitations,
            citation_rate: citationRate,
            avg_position: avgPosition,
            date: new Date().toISOString().split("T")[0],
          });
        }
      }

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_history") {
      // Get historical data
      const { data, error } = await supabaseClient
        .from("llm_citations")
        .select("*")
        .eq("project_id", project_id)
        .order("tracked_date", { ascending: false })
        .limit(100);

      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_trends") {
      // Get trends for dashboard
      const { data, error } = await supabaseClient
        .from("llm_citation_history")
        .select("*")
        .eq("project_id", project_id)
        .order("date", { ascending: false })
        .limit(30);

      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
```

---

## 🎨 FRONTEND: Dashboard Page

### `src/pages/LLMCitationPage.tsx`

**Features:**
1. **Query Builder** - Create and manage tracking queries
2. **Model Selector** - Choose which LLMs to track (ChatGPT, Claude, Gemini, Perplexity)
3. **Citation Dashboard** - Overview of citations across all models
4. **Detailed Results** - See exact responses and where you were mentioned
5. **Competitor Analysis** - See which competitors are cited
6. **Historical Trends** - Track citation rate over time

**UI Components:**
```typescript
- LLMCitationOverview (4 cards: one per model)
- QueryManager (add/edit tracking queries)
- CitationTimeline (historical chart)
- ModelComparison (side-by-side results)
- CompetitorGrid (who else is being cited)
- ResponseViewer (full LLM responses with highlights)
```

---

## 📊 KEY METRICS TO DISPLAY

### Overview Cards (Per Model)
- Citation Rate: % of queries where you're mentioned
- Avg Position: Average position in response (1st, 2nd, 3rd mention)
- Total Mentions: Count this month
- Trend: ↑ or ↓ vs last period

### Comparison Table
| Query | ChatGPT | Claude | Gemini | Perplexity |
|-------|---------|--------|--------|------------|
| "Best SEO tools" | ✅ #2 | ❌ | ✅ #1 | ✅ #3 |
| "AI SEO platform" | ✅ #1 | ✅ #2 | ✅ #1 | ❌ |

### Competitor Analysis
- Top 10 domains cited alongside you
- How often they appear
- Which models prefer them

---

## 🎯 QUERY TEMPLATES (Pre-Built)

For users to start tracking immediately:

**Product Queries:**
- "What is the best [product category]?"
- "Compare [your product] vs [competitor]"
- "Review of [your product]"

**How-To Queries:**
- "How to [solve problem your product solves]"
- "Step by step guide to [task]"
- "[Task] tutorial"

**Informational:**
- "What is [concept]?"
- "Explain [topic]"
- "Learn about [topic]"

**Transactional:**
- "Buy [product]"
- "Best [product] deals"
- "Where to purchase [product]"

---

## 💡 ADVANCED FEATURES (Phase 2)

1. **Auto-Query Generation**
   - AI generates relevant queries based on your content
   - Scrape your site and create 100+ tracking queries automatically

2. **Citation Optimization Tips**
   - Analyze why competitors are cited
   - Suggest content improvements
   - Entity extraction for better LLM understanding

3. **Alert System**
   - Email when citation rate drops
   - Notify when competitor surpasses you
   - Alert on new competitors being cited

4. **Citation Quality Score**
   - Not just "mentioned" but "mentioned positively"
   - Sentiment analysis of citation context
   - Recommendation strength (weak mention vs strong endorsement)

5. **Batch Query Import**
   - Upload CSV of queries
   - Import from GSC (what people search for)
   - Import from content brief

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: MVP (Week 1-2)
✅ Database tables
✅ Edge function for ChatGPT + Gemini only
✅ Basic dashboard page
✅ Manual query input
✅ Simple citation tracking

### Phase 2: Full Models (Week 3)
✅ Add Claude integration
✅ Add Perplexity integration
✅ Historical trending charts
✅ Competitor analysis

### Phase 3: Automation (Week 4)
✅ Scheduled tracking (cron jobs)
✅ Auto-query generation
✅ Email alerts
✅ Export reports

### Phase 4: Advanced (Week 5-6)
✅ Citation quality scoring
✅ Optimization recommendations
✅ Multi-project management
✅ API access for tracking

---

## 💰 PRICING IMPACT

This feature alone justifies premium pricing:

**Free Tier:**
- 5 queries tracked per month
- 2 models (Gemini + Perplexity)
- 7 days of history

**Pro Tier ($49/mo):**
- Unlimited queries
- All 4 models
- 90 days of history
- Daily auto-tracking
- Email alerts

**Enterprise ($199/mo):**
- Everything in Pro
- Custom query templates
- API access
- White-label reports
- Priority support

---

## 🎯 MARKETING ANGLE

**Positioning:**
"Track Your Rankings in AI Search Engines"

**Headline:**
"Are you visible when ChatGPT recommends tools?"

**Subheadline:**
"Track if your website appears in ChatGPT, Claude, Gemini, and Perplexity responses. The future of SEO is AI citations."

**Social Proof:**
- "First tool to track LLM citations"
- "Monitor your AI search rankings"
- "See where you rank in the AI era"

---

## 🔥 COMPETITIVE ADVANTAGE

**Why This is MASSIVE:**

1. **No competitor has this** - You'll be first to market
2. **Huge demand** - Everyone wants to rank in ChatGPT
3. **Viral potential** - "Check if you rank in ChatGPT" is shareable
4. **Data moat** - Historical LLM citation data is valuable
5. **Upsell opportunity** - Optimization services based on results

**SEO Content Opportunities:**
- "How to rank in ChatGPT search results"
- "Does ChatGPT recommend your website?"
- "AI citation tracking for SEO"
- "Track your Perplexity rankings"

---

## 📈 SUCCESS METRICS

**Week 1:**
- 100 users test the feature
- 1,000 queries tracked
- 10 paid upgrades from this feature alone

**Month 1:**
- 1,000 active users
- 50,000 queries tracked
- 50 paid upgrades
- 5 case studies published

**Month 3:**
- 5,000 active users
- 500,000 queries tracked
- 250 paid upgrades
- Featured in SEO publications
- "LLM Citation Tracking" becomes a category

---

## 🎨 UI MOCKUP DESCRIPTION

### Main Dashboard View:
```
┌─────────────────────────────────────────────────────────┐
│ 🤖 LLM Citation Tracker                          [Track Now] │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ ChatGPT  │ │  Claude  │ │  Gemini  │ │Perplexity│   │
│ │   85%    │ │   62%    │ │   78%    │ │   91%    │   │
│ │  ↑ 12%   │ │  ↓ 5%    │ │  ↑ 8%    │ │  ↑ 15%   │   │
│ │ Avg #2   │ │ Avg #3   │ │ Avg #2   │ │ Avg #1   │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                           │
├─────────────────────────────────────────────────────────┤
│ 📊 Citation Trends (Last 30 Days)                        │
│ [Line Chart showing citation rate over time]             │
├─────────────────────────────────────────────────────────┤
│ 📝 Tracked Queries                          [Add Query]  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ "Best SEO tools 2025"                               │ │
│ │ ✅ ChatGPT  ✅ Claude  ✅ Gemini  ✅ Perplexity       │ │
│ │ Last tracked: 2 hours ago                           │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 TECHNICAL REQUIREMENTS

**API Keys Needed:**
- OpenAI API key (ChatGPT)
- Anthropic API key (Claude)
- Google AI API key (Gemini) ✅ Already have
- Perplexity API key

**Estimated Costs:**
- ChatGPT: ~$0.03 per query
- Claude: ~$0.05 per query
- Gemini: ~$0.01 per query
- Perplexity: ~$0.02 per query

**Total per query across all 4 models: ~$0.11**

With 100 queries/day = $11/day = $330/month
With Pro tier at $49/mo, need 7+ active users to break even

---

## 🎯 NEXT STEPS

1. **Create database migration** for new tables
2. **Build edge function** for LLM tracking
3. **Design UI components** for dashboard
4. **Get API keys** for all 4 LLMs
5. **Test with real queries** 
6. **Launch as beta feature**
7. **Gather user feedback**
8. **Iterate and improve**

---

## 🔥 LAUNCH STRATEGY

**Pre-Launch (Week 1):**
- Tease on Twitter: "Coming soon: See if ChatGPT recommends your website"
- Build waitlist
- Create demo video

**Launch Day:**
- ProductHunt launch
- Reddit posts in r/SEO
- LinkedIn announcement
- Twitter thread
- Blog post: "Introducing LLM Citation Tracking"

**Post-Launch:**
- Case studies
- SEO content
- YouTube tutorials
- Podcast appearances

---

This feature will position AnotherSEOGuru as THE platform for modern, AI-first SEO. 🚀

**No other tool tracks LLM citations. You'll be the first. This is your competitive moat.**

