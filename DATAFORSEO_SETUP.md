# DataForSEO Integration Setup

This guide explains how to set up and deploy the DataForSEO integration for your Search Console CRM.

## 🔑 Prerequisites

1. **DataForSEO Account**: Sign up at [DataForSEO](https://dataforseo.com/)
2. **API Credentials**: Get your login and password from the DataForSEO dashboard
3. **Supabase Project**: Already configured with your existing project

## 📦 What's Included

### Supabase Edge Functions
- `dataforseo-serp` - SERP data with rich elements for CTR analysis
- `dataforseo-keywords` - Keyword ideas, suggestions, and search volume
- `dataforseo-onpage` - On-page analysis, content parsing, Lighthouse scores
- `dataforseo-backlinks` - Backlink data for authority scoring

### Client-Side Libraries
- `src/lib/seo-scoring.ts` - SEO scoring algorithms (CTR curves, cannibalization, etc.)
- `src/hooks/useDataForSEO.ts` - React hooks for API consumption

## 🚀 Deployment Steps

### 1. Set Environment Variables in Supabase

Go to your Supabase Dashboard → Project Settings → Edge Functions → Secrets

Add these secrets:

```bash
DATAFORSEO_LOGIN=your_login_email@example.com
DATAFORSEO_PASSWORD=your_password_here
```

### 2. Deploy Edge Functions

Run these commands from your project root:

```bash
# Deploy SERP function
npx supabase functions deploy dataforseo-serp

# Deploy Keywords function
npx supabase functions deploy dataforseo-keywords

# Deploy OnPage function
npx supabase functions deploy dataforseo-onpage

# Deploy Backlinks function
npx supabase functions deploy dataforseo-backlinks
```

### 3. Test the Functions

Test in Supabase Dashboard → Edge Functions → Select function → Invoke:

**Test dataforseo-serp:**
```json
{
  "keyword": "seo tools",
  "location_code": 2840,
  "language_code": "en",
  "device": "desktop"
}
```

**Test dataforseo-keywords:**
```json
{
  "type": "ideas",
  "keywords": ["seo", "analytics"],
  "location_code": 2840,
  "language_code": "en"
}
```

**Test dataforseo-onpage:**
```json
{
  "type": "instant",
  "url": "https://example.com"
}
```

**Test dataforseo-backlinks:**
```json
{
  "type": "live",
  "target": "example.com",
  "limit": 100
}
```

## 📊 Features & Use Cases

### 1. CTR Gap Analysis (Queries Page)
- **What it does**: Compares actual CTR vs expected CTR based on position and SERP features
- **Data source**: `dataforseo-serp` + GSC data
- **Formula**: Expected CTR = baseline[position] × feature_multipliers
- **Output**: Potential extra clicks you're missing

### 2. Keyword Expansion (Queries & Pages)
- **What it does**: Finds related keywords with volume and CPC data
- **Data source**: `dataforseo-keywords` (ideas/suggestions/volume)
- **Use case**: Discover content gaps and high-value opportunities

### 3. On-Page Issues (Pages)
- **What it does**: Detects technical SEO issues (missing meta, thin content, etc.)
- **Data source**: `dataforseo-onpage` (instant/parse)
- **Output**: Prioritized fix list per page

### 4. Link Opportunities (Pages & Link Opportunities page)
- **What it does**: Scores internal link opportunities based on authority × topicality × need
- **Data source**: `dataforseo-backlinks` + content parsing
- **Formula**: `0.5×authority + 0.3×overlap + 0.2×need`

### 5. Enhanced Cannibalization Detection
- **What it does**: Quantifies cannibalization with variance-based scoring
- **Data source**: GSC data + optional SERP positions
- **Formula**: `(pages_count - 1) × (1 + variance/10)`

## 🧮 Scoring Utilities

All scoring functions are in `src/lib/seo-scoring.ts`:

```typescript
import {
  calculateExpectedCtr,
  calculateCtrGapOpportunity,
  calculateKeywordValue,
  calculateCannibalizationScore,
  calculateLinkOpportunityScore,
  calculatePriorityScore,
  calculatePageAuthority,
  calculateTopicalOverlap
} from "@/lib/seo-scoring";
```

### Example: CTR Gap

```typescript
const result = calculateCtrGapOpportunity(
  10000, // impressions
  0.05,  // observed CTR
  3,     // position
  { fs: true, adsTop: 2 } // SERP features
);

console.log(result.potentialExtraClicks); // e.g., 600
console.log(result.opportunity); // "high" | "medium" | "low"
```

### Example: Cannibalization

```typescript
const score = calculateCannibalizationScore([
  { position: 5, impressions: 1000 },
  { position: 12, impressions: 500 },
  { position: 18, impressions: 300 }
]);

// Higher score = worse cannibalization
console.log(score); // e.g., 4.82
```

## 🎯 React Hooks Usage

### SERP Data

```typescript
import { useSerpAdvanced } from "@/hooks/useDataForSEO";

function QueryDetail({ keyword }: { keyword: string }) {
  const { data, isLoading } = useSerpAdvanced({
    keyword,
    location_code: 2840, // USA
    language_code: "en",
    device: "desktop"
  });

  // Parse SERP features and calculate expected CTR
  const features = extractFeatures(data);
  const expectedCtr = calculateExpectedCtr(position, features);
}
```

### Keyword Ideas

```typescript
import { useKeywordIdeas } from "@/hooks/useDataForSEO";

function KeywordExpander({ seedKeywords }: { seedKeywords: string[] }) {
  const { data, isLoading } = useKeywordIdeas({
    keywords: seedKeywords,
    location_code: 2840
  });

  // Show related keywords with volume/CPC
}
```

### On-Page Analysis

```typescript
import { useOnPageInstant } from "@/hooks/useDataForSEO";

function PageHealth({ url }: { url: string }) {
  const { data, isLoading } = useOnPageInstant(url);

  // Show issues: missing meta, broken links, etc.
}
```

### Backlink Data

```typescript
import { useBacklinksLive } from "@/hooks/useDataForSEO";

function PageAuthority({ url }: { url: string }) {
  const { data, isLoading } = useBacklinksLive({
    target: url,
    limit: 1000
  });

  // Calculate authority score from backlinks
  const authority = calculatePageAuthority(
    data.ref_domains,
    data.backlinks_count,
    data.dofollow_ratio
  );
}
```

## 💰 Cost Optimization

DataForSEO charges per API call. Optimize costs with:

1. **Caching**: All hooks include `staleTime` - data is cached client-side
2. **Lazy Loading**: Use `enabled` parameter to load only when needed
3. **Batch Requests**: DataForSEO supports batching - batch similar requests
4. **Smart Triggers**: Only fetch SERP data when user expands a query row

### Estimated Costs (as of 2024)

- SERP Advanced: ~$0.003 per keyword
- Keywords Data: ~$0.002 per keyword  
- OnPage Instant: ~$0.0025 per page
- Backlinks: ~$0.01 per target

**Example monthly cost for 10,000 active users:**
- 5,000 SERP lookups: $15
- 2,000 keyword expansions: $4
- 1,000 on-page checks: $2.50
- 500 backlink checks: $5
- **Total: ~$26.50/month**

## 🔒 Security

- Credentials stored as Supabase secrets (encrypted)
- Never exposed to client
- All API calls go through your Edge Functions
- Rate limiting built into Supabase

## 📚 DataForSEO Documentation

- [SERP API](https://docs.dataforseo.com/v3/serp/google/organic/live/advanced/)
- [Keywords API](https://docs.dataforseo.com/v3/dataforseo_labs/google/keyword_ideas/live/)
- [OnPage API](https://docs.dataforseo.com/v3/on_page/instant_pages/)
- [Backlinks API](https://docs.dataforseo.com/v3/backlinks/backlinks/live/)

## 🐛 Troubleshooting

### "DataForSEO credentials not configured"
- Check secrets are set in Supabase Dashboard
- Re-deploy the function after setting secrets

### "Failed to fetch data"
- Check DataForSEO account has credits
- Verify login/password are correct
- Check Supabase function logs for detailed errors

### High API costs
- Review `staleTime` settings in hooks (increase for less frequent updates)
- Add conditional rendering (only fetch when user expands sections)
- Batch similar requests together

## 📈 Next Steps

1. **Deploy the functions** (see step 2 above)
2. **Test with sample data** (use Supabase dashboard)
3. **Integrate into pages** (see React Hooks Usage above)
4. **Monitor costs** (DataForSEO dashboard → Usage)
5. **Optimize queries** (add caching, lazy loading)

---

**Questions?** Check DataForSEO docs or Supabase Edge Functions documentation.

