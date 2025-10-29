# 🎯 Ahrefs-Style Keyword Explorer - Implementation Guide

## ✅ What's Been Created

### **1. Type Definitions**
```
src/types/keyword-explorer.ts
```
- Complete TypeScript interfaces for all data structures
- Helper functions for CPS, Traffic Potential, Authority Score
- CTR curve constants

### **2. Core Components**
```
src/components/keyword-explorer/KeywordOverviewPanel.tsx
src/components/keyword-explorer/KeywordIdeasTabs.tsx
src/components/keyword-explorer/SerpOverviewTable.tsx
```

**KeywordOverviewPanel** displays:
- KD, Volume, CPC, Clicks, CPS metrics
- 12-month trend chart
- Search intent
- Parent topic & Traffic Potential
- Top ranking page

**KeywordIdeasTabs** provides:
- Matching terms, Related, Questions, Suggestions tabs
- Sortable tables with filters (min volume, max KD)
- Click to drill into keywords

**SerpOverviewTable** shows:
- Current SERP rankings (#1-#20+)
- Authority Score (computed metric)
- Backlinks & Referring Domains
- Estimated traffic
- Traffic trend sparklines

---

## 🔧 Implementation Steps

### **Step 1: Create Supabase Edge Functions**

You need to create these edge functions following DataForSEO v3 patterns:

#### **A) Keyword Overview Bundle**
```
supabase/functions/keyword-overview-bundle/index.ts
```

Calls in parallel:
1. `/v3/dataforseo_labs/google/keyword_overview/live`
2. `/v3/dataforseo_labs/google/bulk_keyword_difficulty/live`
3. `/v3/dataforseo_labs/google/historical_search_volume/live`

Returns combined data for Overview Panel.

#### **B) Keyword Ideas**
```
supabase/functions/keyword-ideas-all/index.ts
```

Calls based on tab selection:
- **Matching**: `/v3/dataforseo_labs/google/keyword_suggestions/live`
- **Related**: `/v3/dataforseo_labs/google/related_keywords/live`
- **Questions**: Use regex filter `(^what|^how|^why|^when|^where|^who)` on suggestions
- **Suggestions**: `/v3/serp/google/autocomplete/live`

#### **C) SERP with Enrichment**
```
supabase/functions/serp-enriched/index.ts
```

Process:
1. Get SERP: `/v3/serp/google/organic/task_post` → `/task_get/advanced`
2. For each URL in top 10:
   - Get backlinks: `/v3/backlinks/summary/live`
   - Get referring domains: `/v3/backlinks/referring_domains/live`
   - Get traffic estimate: `/v3/dataforseo_labs/google/bulk_traffic_estimation/live`
3. Compute Authority Score using `computeAuthorityScore()` helper
4. Return enriched SERP items

#### **D) Traffic Potential & Parent Topic**
```
supabase/functions/traffic-potential/index.ts
```

Process:
1. Get top result URL from SERP
2. Call `/v3/dataforseo_labs/google/ranked_keywords/live` with that URL
3. Calculate Traffic Potential: `Σ (CTR[rank] × search_volume)`
4. Find Parent Topic: highest volume keyword in top 10 positions

#### **E) Position History**
```
supabase/functions/position-history/index.ts
```

- Call `/v3/dataforseo_labs/google/historical_serps/live`
- Return time-series data for chart

---

### **Step 2: Create Main Keyword Explorer Page**

Create new file (replace current KeywordResearchPage.tsx):

```tsx
// src/pages/KeywordExplorerPage.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { KeywordOverviewPanel } from "@/components/keyword-explorer/KeywordOverviewPanel";
import { KeywordIdeasTabs } from "@/components/keyword-explorer/KeywordIdeasTabs";
import { SerpOverviewTable } from "@/components/keyword-explorer/SerpOverviewTable";
import { supabase } from "@/integrations/supabase/client";
import { KeywordExplorerState, KeywordOverview } from "@/types/keyword-explorer";

export default function KeywordExplorerPage() {
  const [state, setState] = useState<KeywordExplorerState>({
    seedKeyword: "",
    locationCode: 2840, // US
    languageCode: "en",
    overview: null,
    overviewLoading: false,
    matchingTerms: [],
    relatedTerms: [],
    questions: [],
    searchSuggestions: [],
    ideasLoading: false,
    serpItems: [],
    serpLoading: false,
    alsoRankFor: [],
    alsoRankForLoading: false,
    positionHistory: [],
    historyLoading: false,
    trafficShare: [],
    trafficLoading: false,
  });

  const fetchOverview = async () => {
    setState(prev => ({ ...prev, overviewLoading: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke("keyword-overview-bundle", {
        body: {
          keyword: state.seedKeyword,
          location_code: state.locationCode,
          language_code: state.languageCode
        }
      });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        overview: data.overview,
        parentTopic: data.parentTopic,
        trafficPotential: data.trafficPotential,
        overviewLoading: false
      }));
    } catch (error) {
      console.error("Error fetching overview:", error);
      setState(prev => ({ ...prev, overviewLoading: false }));
    }
  };

  const fetchIdeas = async () => {
    setState(prev => ({ ...prev, ideasLoading: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke("keyword-ideas-all", {
        body: {
          keyword: state.seedKeyword,
          location_code: state.locationCode,
          language_code: state.languageCode
        }
      });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        matchingTerms: data.matching || [],
        relatedTerms: data.related || [],
        questions: data.questions || [],
        searchSuggestions: data.suggestions || [],
        ideasLoading: false
      }));
    } catch (error) {
      console.error("Error fetching ideas:", error);
      setState(prev => ({ ...prev, ideasLoading: false }));
    }
  };

  const fetchSERP = async () => {
    setState(prev => ({ ...prev, serpLoading: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke("serp-enriched", {
        body: {
          keyword: state.seedKeyword,
          location_code: state.locationCode,
          language_code: state.languageCode
        }
      });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        serpItems: data.items || [],
        serpLoading: false
      }));
    } catch (error) {
      console.error("Error fetching SERP:", error);
      setState(prev => ({ ...prev, serpLoading: false }));
    }
  };

  const handleSearch = () => {
    // Fetch all data in parallel
    Promise.all([
      fetchOverview(),
      fetchIdeas(),
      fetchSERP()
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Keywords Explorer</h1>
          <p className="text-muted-foreground">
            Ahrefs-style keyword research with DataForSEO v3
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3">
          <Input
            placeholder="Enter seed keyword..."
            value={state.seedKeyword}
            onChange={(e) => setState(prev => ({ ...prev, seedKeyword: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Select
            value={state.locationCode.toString()}
            onValueChange={(v) => setState(prev => ({ ...prev, locationCode: Number(v) }))}
          >
            {/* Add location options */}
          </Select>
          <Select
            value={state.languageCode}
            onValueChange={(v) => setState(prev => ({ ...prev, languageCode: v }))}
          >
            {/* Add language options */}
          </Select>
          <Button onClick={handleSearch} size="lg">
            Search
          </Button>
        </div>
      </div>

      {/* Overview Panel */}
      <KeywordOverviewPanel
        overview={state.overview}
        trafficPotential={state.trafficPotential}
        parentTopic={state.parentTopic}
        loading={state.overviewLoading}
      />

      {/* Keyword Ideas */}
      <KeywordIdeasTabs
        matchingTerms={state.matchingTerms}
        relatedTerms={state.relatedTerms}
        questions={state.questions}
        searchSuggestions={state.searchSuggestions}
        loading={state.ideasLoading}
        onKeywordClick={(keyword) => {
          setState(prev => ({ ...prev, seedKeyword: keyword }));
          handleSearch();
        }}
      />

      {/* SERP Overview */}
      <SerpOverviewTable
        serpItems={state.serpItems}
        loading={state.serpLoading}
      />
    </div>
  );
}
```

---

### **Step 3: Additional Components Needed**

#### **A) Position History Chart**
```tsx
// src/components/keyword-explorer/PositionHistoryChart.tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { HistoricalSerp } from '@/types/keyword-explorer';

export function PositionHistoryChart({ data, domains }: {
  data: HistoricalSerp[];
  domains: string[];
}) {
  // Chart showing rank over time for selected domains
  // Each domain gets a different colored line
}
```

#### **B) Traffic Share Donut**
```tsx
// src/components/keyword-explorer/TrafficShareChart.tsx
import { PieChart, Pie, Cell } from 'recharts';
import { TrafficShare } from '@/types/keyword-explorer';

export function TrafficShareChart({ data }: { data: TrafficShare[] }) {
  // Donut chart showing traffic distribution
}
```

#### **C) Also Rank For Table**
```tsx
// src/components/keyword-explorer/AlsoRankForTable.tsx
// Similar structure to KeywordIdeasTabs
// Shows keywords that top URLs also rank for
```

---

### **Step 4: Edge Function Templates**

#### **Keyword Overview Bundle Example**
```typescript
// supabase/functions/keyword-overview-bundle/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DATAFORSEO_LOGIN = Deno.env.get("DATAFORSEO_LOGIN");
const DATAFORSEO_PASSWORD = Deno.env.get("DATAFORSEO_PASSWORD");

serve(async (req) => {
  const { keyword, location_code, language_code } = await req.json();

  // Encode credentials
  const auth = btoa(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`);

  // Call 3 endpoints in parallel
  const [overviewRes, kdRes, historyRes] = await Promise.all([
    fetch("https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_overview/live", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([{
        keywords: [keyword],
        location_code,
        language_code
      }])
    }),
    fetch("https://api.dataforseo.com/v3/dataforseo_labs/google/bulk_keyword_difficulty/live", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([{
        keywords: [keyword],
        location_code,
        language_code
      }])
    }),
    fetch("https://api.dataforseo.com/v3/dataforseo_labs/google/historical_search_volume/live", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([{
        keywords: [keyword],
        location_code,
        language_code
      }])
    })
  ]);

  const overview = await overviewRes.json();
  const kd = await kdRes.json();
  const history = await historyRes.json();

  // Merge data
  const result = {
    overview: {
      ...overview.tasks[0].result[0].items[0],
      keyword_difficulty: kd.tasks[0].result[0].items[0]?.keyword_difficulty || 0,
      monthly_searches: history.tasks[0].result[0].items[0]?.monthly_searches || []
    }
  };

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  });
});
```

---

## 📋 Implementation Checklist

- [ ] **Set up DataForSEO credentials** in Supabase secrets
- [ ] **Create edge functions**:
  - [ ] `keyword-overview-bundle`
  - [ ] `keyword-ideas-all`
  - [ ] `serp-enriched`
  - [ ] `traffic-potential`
  - [ ] `position-history`
- [ ] **Deploy edge functions**: `npx supabase functions deploy [name]`
- [ ] **Create KeywordExplorerPage.tsx**
- [ ] **Update App.tsx route** from `/keyword-research` to use new page
- [ ] **Add location/language selectors** with proper DataForSEO codes
- [ ] **Test with real keywords**
- [ ] **Add credit deduction** logic (2-5 credits per search)
- [ ] **Implement caching** (1-hour cache for reports)

---

## 💰 Cost Optimization

Per the keywords.md guide:

1. **Use Labs endpoints** (cheaper than SERP scraping)
2. **Batch requests** where possible (up to 700 keywords)
3. **Control SERP depth** (depth: 10-20 instead of 50+)
4. **Cache aggressively** (1 hour for reports)
5. **Respect concurrency** limits (2000/min for Labs, 30 for On-Page)

---

## 🎯 Priority Order

1. ✅ **Overview Panel** - Most critical (shows KD, SV, CPC, trend)
2. ✅ **Keyword Ideas** - Core feature (matching, related, questions)
3. ✅ **SERP Table** - Important (with authority metrics)
4. ⏳ **Position History** - Nice to have (chart over time)
5. ⏳ **Traffic Share** - Nice to have (domain distribution)
6. ⏳ **Also Rank For** - Advanced (requires multiple API calls)

---

## 🚀 Quick Start

1. **Add your DataForSEO credentials**:
   ```bash
   # In Supabase Dashboard → Project Settings → Edge Functions → Secrets
   DATAFORSEO_LOGIN=your_login
   DATAFORSEO_PASSWORD=your_password
   ```

2. **Deploy first edge function**:
   ```bash
   npx supabase functions deploy keyword-overview-bundle --no-verify-jwt
   ```

3. **Test the component**:
   ```tsx
   // In your page
   import { KeywordOverviewPanel } from "@/components/keyword-explorer/KeywordOverviewPanel";
   
   <KeywordOverviewPanel
     overview={mockData}
     loading={false}
   />
   ```

4. **Gradually add more features** following the checklist

---

## 📚 Reference

- **Your guide**: `keywords.md` - Complete DataForSEO v3 mapping
- **Types**: `src/types/keyword-explorer.ts` - All interfaces
- **Components**: `src/components/keyword-explorer/` - UI components
- **DataForSEO Docs**: https://docs.dataforseo.com/v3/

---

**Status**: ✅ **Foundation Complete** - Ready for edge function implementation
