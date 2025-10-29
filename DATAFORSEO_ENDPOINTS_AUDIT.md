# DataForSEO Endpoints Audit & Updates

## Current Status vs. Recommended Endpoints

### ✅ **Correctly Implemented**

1. **12-Month Trends (Historical Volume)**
   - ✅ Current: `/v3/dataforseo_labs/google/historical_search_volume/live`
   - ✅ Recommended: Same endpoint
   - Status: **CORRECT**

2. **Keyword Overview**
   - ✅ Current: `/v3/dataforseo_labs/google/keyword_overview/live`
   - ✅ Recommended: Same endpoint
   - Status: **CORRECT**

3. **Keyword Ideas**
   - ✅ Current: `/v3/dataforseo_labs/google/keyword_ideas/live`
   - ✅ Recommended: Same endpoint
   - Status: **CORRECT**

4. **Keyword Suggestions**
   - ✅ Current: `/v3/dataforseo_labs/google/keyword_suggestions/live`
   - ✅ Recommended: Same endpoint (includes monthly metrics & trend array)
   - Status: **CORRECT - but we should extract monthly_searches from this**

5. **Related Keywords**
   - ✅ Current: `/v3/dataforseo_labs/google/related_keywords/live`
   - ✅ Recommended: Same endpoint
   - Status: **CORRECT**

6. **Google Ads Search Volume**
   - ✅ Current: `/v3/keywords_data/google_ads/search_volume/live`
   - ✅ Recommended: Same endpoint (alternative source for 12-month trends)
   - Status: **CORRECT - but not used as fallback yet**

### ⚠️ **Needs Enhancement**

1. **SERP API - AI Overview/Mode Detection**
   - ⚠️ Current: `/v3/serp/google/organic/live/advanced` (no AI flags)
   - ✅ Recommended: Same endpoint but with AI Overview flags enabled
   - ⚠️ Missing: AI Overview/Mode detection
   - Action: Add AI detection flags to SERP endpoint

2. **Keyword Suggestions - Monthly Metrics**
   - ⚠️ Current: Not extracting `monthly_searches` from keyword_suggestions
   - ✅ Recommended: Extract monthly metrics and trend array
   - Action: Update keyword-ideas-all to extract monthly_searches

3. **Historical Volume Fallback**
   - ⚠️ Current: Only using Labs historical_search_volume
   - ✅ Recommended: Use Google Ads search_volume as fallback/alternative
   - Action: Add fallback in keyword-overview-bundle

## Recommended Updates

### 1. Enhance SERP Endpoint for AI Overview/Mode
- Add `enable_ai_overview: true` flag
- Parse AI Overview blocks in response
- Add `ai_mode` detection endpoint option

### 2. Extract Monthly Metrics from Keyword Suggestions
- Parse `monthly_searches` array from suggestions endpoint
- Use this data in keyword ideas display

### 3. Add Google Ads Volume as Fallback
- If Labs historical_search_volume fails or returns empty
- Fallback to Google Ads search_volume for monthly trends
