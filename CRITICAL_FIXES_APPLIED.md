# Critical Fixes Applied - Onboarding & Integrations

## Issues Fixed

### 1. ✅ Onboarding Keeps Showing Up Every Refresh/Login
**Problem:** Onboarding wizard was reopening on every page refresh even for completed users.

**Root Cause:** The `user_profiles` table wasn't being checked properly and the onboarding completion wasn't persisting.

**Fixes Applied:**
- Improved `checkOnboardingStatus()` to properly handle missing profiles
- Auto-creates profile if it doesn't exist (for new users)
- Only shows wizard if `onboarding_completed === false`
- Fixed `completeOnboarding()` to always close wizard even if save fails
- Moved `saveProgress` declaration before its usage to fix dependency errors

**What You Need to Do:**
```sql
-- Run this SQL in Supabase Dashboard → SQL Editor
-- File: CREATE_USER_PROFILES.sql

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, onboarding_completed, onboarding_step)
  VALUES (NEW.id, FALSE, 1)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();
```

**For Existing Users:**
```sql
-- Mark all existing users as having completed onboarding
INSERT INTO user_profiles (user_id, onboarding_completed, onboarding_step)
SELECT id, TRUE, 5
FROM auth.users
ON CONFLICT (user_id) 
DO UPDATE SET onboarding_completed = TRUE, onboarding_step = 5;
```

---

### 2. ✅ Google Analytics OAuth Redirect Fixed
**Problem:** GA4 connection was redirecting to `/settings?tab=integrations` instead of using OAuth.

**Fix Applied:**
Changed `AnalyticsDashboard.tsx` to use proper OAuth flow:

```typescript
const connectGoogleAnalytics = async () => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/analytics.readonly',
        redirectTo: `${window.location.origin}/analytics-dashboard`,
      },
    });
    // ...
  }
};
```

**What You Need to Do:**
1. **Configure Google Cloud Console:**
   - Go to: https://console.cloud.google.com/
   - Select your project
   - Navigate to: APIs & Services → OAuth consent screen
   - Add scope: `https://www.googleapis.com/auth/analytics.readonly`

2. **Configure Supabase:**
   - Go to: Supabase Dashboard → Authentication → Providers → Google
   - Ensure these scopes are included:
     - `https://www.googleapis.com/auth/webmasters.readonly` (GSC)
     - `https://www.googleapis.com/auth/analytics.readonly` (GA4)
   - Add redirect URL: `https://anotherseoguru.com/analytics-dashboard`

---

### 3. ⚠️ PageSpeed Insights (CWV Pulse) Errors
**Problem:** PageSpeed Insights function returns errors.

**Root Cause:** Missing `GOOGLE_API_KEY` environment variable.

**What You Need to Do:**
1. **Get Google API Key:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Create API Key
   - Restrict key to: PageSpeed Insights API

2. **Add to Supabase:**
   ```bash
   # Using Supabase CLI
   supabase secrets set GOOGLE_API_KEY=your_api_key_here
   
   # Or in Supabase Dashboard:
   # Settings → Edge Functions → Secrets → Add Secret
   # Name: GOOGLE_API_KEY
   # Value: your_api_key_here
   ```

3. **Enable API:**
   - Go to: https://console.cloud.google.com/apis/library
   - Search for "PageSpeed Insights API"
   - Click "Enable"

**Test It:**
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/pagespeed-insights \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://anotherseoguru.com", "strategy": "mobile"}'
```

---

### 4. ✅ First Analysis Step - Real Data Integration
**Status:** Implemented but requires migrations

**What It Does:**
- Fetches real GSC data (last 28 days)
- Calculates total clicks, impressions, CTR, position
- Identifies opportunities (high impressions, low clicks, position 4-20)
- Stores results in `analysis_runs` table

**What You Need to Do:**
```bash
# 1. Run the analysis_runs migration
# File: supabase/migrations/20250129000003_analysis_history.sql
# Apply via Supabase Dashboard → SQL Editor

# 2. After migration, regenerate types
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

---

### 5. ⚠️ TypeScript Errors in FirstAnalysisStep.tsx
**Status:** Expected until migrations are run

**Current Errors:**
- `analysis_runs` table doesn't exist in generated types yet
- Using `as any` with `@ts-ignore` comments temporarily

**These Will Auto-Resolve After:**
1. Running the `analysis_runs` migration
2. Regenerating Supabase types (Step 4.2 above)

---

## Testing Checklist

### Onboarding Flow
- [ ] New user signup → onboarding shows
- [ ] Complete all 5 steps → wizard closes
- [ ] Refresh page → wizard stays closed
- [ ] Connect GSC → redirects to step 3 (not step 1)
- [ ] Select property → properties list loads
- [ ] Run analysis → fetches real GSC data (takes 5-15 sec)
- [ ] Complete onboarding → dashboard loads

### Existing Users
- [ ] Login → onboarding doesn't show
- [ ] Check `user_profiles` table has record with `onboarding_completed = true`

### Google Analytics
- [ ] Click "Connect Google Analytics"
- [ ] Redirects to Google OAuth (not settings page)
- [ ] After auth → returns to `/analytics-dashboard`
- [ ] Can select GA4 properties

### PageSpeed Insights
- [ ] Go to `/free-tools/cwv-pulse`
- [ ] Enter URL (e.g., https://anotherseoguru.com)
- [ ] Click "Analyze"
- [ ] Shows real metrics (LCP, FID, CLS, etc.)
- [ ] No errors in console

---

## Quick Deployment Steps

### Priority 1: Fix Onboarding (CRITICAL)
```bash
# 1. Run CREATE_USER_PROFILES.sql in Supabase
# 2. Run the existing users SQL to mark them complete
# 3. Test: refresh page, onboarding should not reopen
```

### Priority 2: Enable PageSpeed
```bash
# 1. Get Google API Key
# 2. Enable PageSpeed Insights API
# 3. Add GOOGLE_API_KEY to Supabase secrets
# 4. Test: https://anotherseoguru.com/free-tools/cwv-pulse
```

### Priority 3: Setup GA4 OAuth
```bash
# 1. Add GA4 scope to Google OAuth
# 2. Add redirect URL in Supabase
# 3. Test: Connect Google Analytics button
```

### Priority 4: Enable Analysis History
```bash
# 1. Run 20250129000003_analysis_history.sql
# 2. Regenerate Supabase types
# 3. Test: Onboarding step 4 analysis
```

---

## Files Modified

### Components
- `src/components/onboarding/OnboardingWizard.tsx` - Fixed persistence & state management
- `src/components/onboarding/FirstAnalysisStep.tsx` - Real GSC data integration
- `src/components/onboarding/ConnectGSCStep.tsx` - OAuth redirect with step param

### Pages
- `src/pages/AnalyticsDashboard.tsx` - Fixed GA4 OAuth flow

### Migrations
- `supabase/migrations/20250129000003_analysis_history.sql` - New analysis_runs table
- `CREATE_USER_PROFILES.sql` - User profiles table (needs to be run)

### Edge Functions
- `supabase/functions/pagespeed-insights/index.ts` - Already correct, needs API key

---

## Support & Troubleshooting

### Issue: "Table 'user_profiles' does not exist"
**Solution:** Run CREATE_USER_PROFILES.sql in Supabase SQL Editor

### Issue: "Table 'analysis_runs' does not exist"
**Solution:** Run 20250129000003_analysis_history.sql

### Issue: PageSpeed returns 500 error
**Solution:** Check GOOGLE_API_KEY is set in Supabase secrets

### Issue: GA4 redirects to settings
**Solution:** Clear browser cache, the fix is in the code now

### Issue: Onboarding still reopens
**Solution:** 
1. Check `user_profiles` table exists
2. Verify your user has a record with `onboarding_completed = true`
3. Clear browser localStorage: `localStorage.clear()`

---

## Questions?

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs: Dashboard → Logs
3. Verify all migrations ran successfully
4. Confirm environment variables are set

All critical fixes are implemented. The main blocker is running the SQL migrations for user profiles and analysis history.
