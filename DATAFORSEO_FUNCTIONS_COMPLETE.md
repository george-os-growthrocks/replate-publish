# Complete DataForSEO Edge Functions Inventory

## ✅ All DataForSEO Labs Functions (11 total)

### Keyword Research
1. ✅ **dataforseo-labs-keyword-overview** - Keyword overview with SV, CPC, Competition, Intent (`/v3/dataforseo_labs/google/keyword_overview/live`)
2. ✅ **dataforseo-labs-keyword-ideas** - Keyword ideas expansion (`/v3/dataforseo_labs/google/keyword_ideas/live`)
3. ✅ **dataforseo-labs-keyword-suggestions** - Seed-based keyword suggestions (`/v3/dataforseo_labs/google/keyword_suggestions/live`)
4. ✅ **dataforseo-labs-related-keywords** - "Searches related to" style ideas (`/v3/dataforseo_labs/google/related_keywords/live`)
5. ✅ **dataforseo-labs-keywords-for-site** - Keywords relevant to domain/page (`/v3/dataforseo_labs/google/keywords_for_site/live`)
6. ✅ **dataforseo-labs-historical-search-volume** - Month-by-month search volume (12-month+ trends) (`/v3/dataforseo_labs/google/historical_search_volume/live`)

### SERP & Competition
7. ✅ **dataforseo-labs-bulk-kd** - Keyword Difficulty at scale (`/v3/dataforseo_labs/google/bulk_keyword_difficulty/live`)
8. ✅ **dataforseo-labs-serp-overview** - SERP competitors analysis (`/v3/dataforseo_labs/google/serp_competitors/live`)
9. ✅ **dataforseo-labs-domain-competitors** - Competitor domains with overlap metrics (`/v3/dataforseo_labs/google/competitors_domain/live`)

## ✅ Google Ads Keywords Data (1 function)

10. ✅ **dataforseo-keywords-google-ads-volume** - Official planner metrics with 12-month data (`/v3/keywords_data/google_ads/search_volume/live`)

## ✅ SERP API (1 function)

11. ✅ **dataforseo-serp** - Organic SERP with AI Overview/Mode detection (`/v3/serp/google/organic/live/advanced`)
    - Supports `enable_ai_overview` flag
    - Supports `/v3/serp/google/ai_mode/live` endpoint

## ✅ Backlinks (1 function)

12. ✅ **dataforseo-backlinks** - Backlink data for domains/URLs (`/v3/backlinks/backlinks/live`)

## ✅ OnPage (3 functions)

13. ✅ **dataforseo-onpage** - Page analysis (instant, summary, parse, lighthouse)
14. ✅ **dataforseo-onpage-crawl** - Full site crawl task management
15. ✅ **dataforseo-onpage-summary** - Site-wide overview

## ✅ Business Data (2 functions)

16. ✅ **dataforseo-business-google-maps-search** - Local search results
17. ✅ **dataforseo-business-google-maps-reviews** - Business reviews

## ✅ Merchant (1 function)

18. ✅ **dataforseo-merchant-products-search** - Product search

## ✅ Utilities (2 functions)

19. ✅ **dataforseo-locations** - Location codes lookup
20. ✅ **dataforseo-languages** - Language codes lookup

## ✅ Composite/Bundle Functions (3 functions)

21. ✅ **keyword-overview-bundle** - Bundles overview + KD + historical volume + Google Ads fallback
22. ✅ **keyword-ideas-all** - Bundles suggestions + related + autocomplete with trend extraction
23. ✅ **serp-enriched** - SERP + backlinks + traffic + authority score calculation

## 📊 Total: 23 Edge Functions

All functions match the recommended DataForSEO API endpoint mapping and include:
- ✅ Correct endpoint paths
- ✅ AI Overview/Mode detection support
- ✅ Google Ads volume as fallback for trends
- ✅ Monthly searches extraction from suggestions
- ✅ Proper error handling
- ✅ CORS support
- ✅ Authentication via environment variables

