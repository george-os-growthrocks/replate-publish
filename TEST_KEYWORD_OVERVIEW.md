# Testing keyword-overview-bundle

## Test the deployed function

```bash
curl -X POST https://siwzszmukfbzicjjkxro.supabase.co/functions/v1/keyword-overview-bundle \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"keyword": "seo tools", "location_code": 2840, "language_code": "en"}'
```

## Expected Response Structure

```json
{
  "overview": {
    "keyword": "seo tools",
    "search_volume": 12000,
    "keyword_difficulty": 65,
    "cpc": 5.50,
    "competition": 0.85,
    "monthly_searches": [
      {"month": 1, "year": 2024, "search_volume": 11500},
      {"month": 2, "year": 2024, "search_volume": 12000},
      ...
    ],
    "search_intent_info": {...},
    "serp_info": {...}
  }
}
```

## Check Supabase Dashboard Logs

1. Go to: https://supabase.com/dashboard/project/siwzszmukfbzicjjkxro/functions
2. Click on `keyword-overview-bundle`
3. Go to "Logs" tab
4. Check for errors or console.log output

## Common Issues

1. **No monthly_searches data**: Labs historical volume API might not return data for all keywords
2. **Google Ads fallback not working**: Check if the fallback is being triggered
3. **API errors**: Check DataForSEO credits and API status

