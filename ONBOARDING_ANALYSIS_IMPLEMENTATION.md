# Onboarding Analysis Implementation

## Overview
Implemented a real analysis system for the onboarding wizard that:
- Fetches actual GSC data during onboarding
- Stores analysis history in database
- Displays real statistics instead of mock data
- Creates a foundation for future analysis features

## What Was Changed

### 1. Database Migration (`20250129000003_analysis_history.sql`)
Created a new `analysis_runs` table to track all analysis runs:

**Key Fields:**
- `property_url`: The GSC property being analyzed
- `analysis_type`: 'onboarding', 'manual', or 'scheduled'
- `status`: 'running', 'completed', or 'failed'
- **GSC Metrics**: `total_clicks`, `total_impressions`, `avg_ctr`, `avg_position`
- **Detailed Data**: `top_queries`, `top_pages`, `opportunities` (stored as JSONB)
- Tracks analysis duration and date ranges

**Features:**
- Row Level Security (RLS) enabled
- Users can only access their own analysis runs
- Indexes for fast queries on user_id, property, status, and created_at
- Cleanup function to remove old analysis runs (30+ days)

### 2. FirstAnalysisStep Component Updates
Completely rewrote the analysis logic:

**Before:** 
- Simulated 2-second delay
- Showed fake statistics (156 keywords, 12.5K clicks, 23 opportunities)

**After:**
- Creates analysis run record in database
- Calls `gsc-query` edge function twice:
  - Once for top queries (with dimensions: ['query'])
  - Once for top pages (with dimensions: ['page'])
- Calculates real metrics:
  - Total clicks and impressions (last 28 days)
  - Average CTR and position
  - Identifies opportunities (high impressions, low clicks, position 4-20)
- Stores results in database
- Displays actual stats

**TypeScript Types Added:**
```typescript
interface GSCQueryRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

interface AnalysisResults {
  totalClicks: number;
  totalImpressions: number;
  totalQueries: number;
  totalPages: number;
  opportunities: number;
  avgPosition: string;
}
```

### 3. OAuth Redirect Fix
Updated `ConnectGSCStep` and `OnboardingWizard`:
- OAuth redirect now includes `onboardingStep=3&gsc=1` parameters
- Wizard resumes at correct step after Google authentication
- Progress is persisted to database immediately
- No more reset to step 1 after GSC connection

## Next Steps to Deploy

### Step 1: Run the Migration
You need to run the new migration to create the `analysis_runs` table:

```bash
# If using Supabase CLI locally
supabase db push

# Or apply directly in Supabase Dashboard:
# Go to: SQL Editor → New Query → Paste migration content → Run
```

### Step 2: Regenerate Supabase Types
After running the migration, update your TypeScript types:

```bash
# Generate types from your Supabase project
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts

# Or if using local dev:
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

This will resolve the TypeScript errors in `FirstAnalysisStep.tsx`.

### Step 3: Test the Onboarding Flow

1. **Create a test user** or use existing account
2. **Start onboarding** - should begin at step 1
3. **Connect GSC** (step 2) - verify it redirects to step 3 (not step 1)
4. **Select property** (step 3) - should load your GSC properties
5. **Run analysis** (step 4) - should:
   - Show "Analyzing..." loading state
   - Fetch real GSC data (takes 5-15 seconds)
   - Display actual metrics
   - Store results in `analysis_runs` table

### Step 4: Verify Database Records

After completing onboarding, check the database:

```sql
-- View analysis runs
SELECT 
  id,
  property_url,
  analysis_type,
  status,
  total_clicks,
  total_queries,
  opportunities,
  created_at
FROM analysis_runs
ORDER BY created_at DESC
LIMIT 10;

-- View detailed opportunities
SELECT 
  property_url,
  jsonb_array_length(opportunities) as opportunity_count,
  opportunities
FROM analysis_runs
WHERE analysis_type = 'onboarding'
ORDER BY created_at DESC
LIMIT 5;
```

## Future Enhancements

### Analysis History Page
Create a page to view all past analysis runs:
- List all analyses with date, property, and key metrics
- Click to view detailed breakdown
- Compare analyses over time
- Export data

### Scheduled Analysis
Add ability to:
- Schedule weekly/monthly analysis runs
- Email notifications when analysis completes
- Track trends over time

### Enhanced Opportunities
- More sophisticated opportunity detection
- Score opportunities by potential impact
- Suggest specific actions to take

### OnPage Analysis Integration
Optionally integrate with DataForSEO OnPage:
```typescript
// After GSC analysis, optionally crawl the site
const { data } = await supabase.functions.invoke('dataforseo-onpage-summary', {
  body: {
    target: state.selectedProperty,
    max_crawl_pages: 100,
  }
});
```

## Error Handling

The implementation includes graceful error handling:
- If GSC API fails, user can skip and continue
- Analysis run marked as 'failed' with error message stored
- Toast notifications for user feedback
- Detailed console logging for debugging

## TypeScript Notes

**Temporary `any` type assertions:**
The code uses `as any` in two places for the `analysis_runs` table. This is intentional because:
1. The table doesn't exist in generated types yet (migration not run)
2. Will be resolved after Step 2 (regenerate types)
3. Type-safe within the component logic otherwise

## Testing Checklist

- [ ] Migration applied successfully
- [ ] Types regenerated without errors
- [ ] OAuth redirect works (step 2 → step 3)
- [ ] Property selection shows real properties
- [ ] Analysis fetches real GSC data
- [ ] Analysis results display correctly
- [ ] Database record created in `analysis_runs`
- [ ] Error handling works (try with invalid property)
- [ ] Skip button still works on step 4

## Questions?

If you encounter issues:
1. Check Supabase logs for edge function errors
2. Verify OAuth tokens are stored correctly
3. Confirm GSC API access is granted
4. Check browser console for client-side errors
