# Console Errors Fixed & Remaining Issues

## ✅ Fixed Issues

### 1. DialogTitle Accessibility Warning - FIXED
**Error:** `DialogContent` requires a `DialogTitle` for accessibility

**Fix Applied:**
- Added `DialogTitle` import in `OnboardingWizard.tsx`
- Wrapped the h2 heading with `<DialogTitle>` component
- Now accessible for screen readers

**Before:**
```tsx
<h2 className="text-2xl font-bold">Welcome to AnotherSEOGuru</h2>
```

**After:**
```tsx
<DialogTitle className="text-2xl font-bold">Welcome to AnotherSEOGuru</DialogTitle>
```

---

### 2. user_profiles 409 Conflict - FIXED
**Error:** `409 Conflict` when trying to insert user profile

**Root Cause:** Using `.insert()` on a profile that already exists

**Fix Applied:**
Changed from `.insert()` to `.upsert()` with conflict resolution:

```typescript
await supabase.from('user_profiles').upsert({
  user_id: user.id,
  onboarding_step: 1,
  onboarding_completed: false,
}, {
  onConflict: 'user_id'  // Handle conflicts gracefully
});
```

---

## ⚠️ Remaining Issues That Need Attention

### 3. GSC Query 400 Errors
**Error:** Multiple `gsc-query` 400 (Bad Request) errors

**Possible Causes:**
1. ❌ Google OAuth token is expired or invalid
2. ❌ No property URL selected
3. ❌ Missing OAuth scopes
4. ❌ User hasn't connected Google Search Console yet

**How to Fix:**

**Option A: Reconnect Google Search Console**
1. Sign out completely
2. Sign back in
3. During onboarding, connect Google Search Console again
4. This will refresh the OAuth token

**Option B: Check OAuth Token**
Run this SQL to check your OAuth token:
```sql
SELECT 
  provider,
  access_token IS NOT NULL as has_token,
  expires_at,
  expires_at > NOW() as token_valid
FROM user_oauth_tokens
WHERE user_id = auth.uid()
AND provider = 'google';
```

**Option C: Manual Token Refresh**
If token exists but expired, sign out and back in with Google.

**Check in Code:**
The gsc-query function needs:
- Valid `provider_token` (from OAuth or session)
- Valid `siteUrl` (selected property)
- Valid date range

**Debug Steps:**
1. Open browser console
2. Check which requests return 400
3. Look at the error message in Network tab → Response
4. Common errors:
   - `"No Google access token available"` → Need to reconnect
   - `"Missing required parameters"` → Property not selected
   - `"Unauthorized"` → Token expired

---

### 4. seo_projects Table 400 Error
**Error:** `400 Bad Request` for `seo_projects` table query

**Root Cause:** Table doesn't exist or RLS policies are blocking access

**Fix Required:** Run the migration to create the table

**Migration File:** `20251028_subscription_system.sql` (lines 49-60)

**SQL to Run:**
```sql
-- Projects Table
CREATE TABLE IF NOT EXISTS seo_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  domain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seo_projects_user_id ON seo_projects(user_id);

-- Enable RLS
ALTER TABLE seo_projects ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own projects" ON seo_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON seo_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON seo_projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON seo_projects
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON seo_projects TO authenticated;
```

**After creating the table, regenerate types:**
```bash
npx supabase gen types typescript --project-id siwzszmukfbzicjjkxro > src/integrations/supabase/types.ts
```

---

## Priority Fix Order

### Immediate (Critical)
1. ✅ **DialogTitle warning** - FIXED
2. ✅ **user_profiles 409** - FIXED

### Next (Important)
3. **Create seo_projects table** - Run SQL above
4. **Fix GSC OAuth token** - Reconnect Google Search Console

### Optional (Can Skip Temporarily)
5. **Other GSC queries** - Will auto-fix after token refresh

---

## How to Test Fixes

### Test DialogTitle Fix
1. Open browser console
2. Navigate to onboarding
3. Check for Radix UI warning → Should be gone ✅

### Test user_profiles 409 Fix
1. Refresh the dashboard multiple times
2. Check Network tab → No more 409 errors ✅
3. Onboarding should not reopen ✅

### Test GSC Connection
1. Go to Settings → Connected Accounts (or re-run onboarding)
2. Connect Google Search Console
3. Select a property
4. Dashboard should load GSC data without 400 errors

### Test seo_projects Table
1. After creating the table
2. Go to Projects page
3. Should load without 400 error

---

## Quick Commands

**Check if tables exist:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'analysis_runs', 'seo_projects')
ORDER BY table_name;
```

**Check your OAuth tokens:**
```sql
SELECT 
  provider,
  created_at,
  expires_at,
  expires_at > NOW() as is_valid,
  access_token IS NOT NULL as has_token
FROM user_oauth_tokens
WHERE user_id = auth.uid();
```

**Check onboarding status:**
```sql
SELECT 
  onboarding_completed,
  onboarding_step,
  created_at,
  updated_at
FROM user_profiles
WHERE user_id = auth.uid();
```

---

## Summary

**Fixed in Code:**
- ✅ DialogTitle accessibility
- ✅ user_profiles 409 conflict

**Need to Run SQL:**
- ⚠️ Create `seo_projects` table

**Need to Reconnect:**
- ⚠️ Google Search Console OAuth (if token expired)

**All fixes are committed and ready to deploy!**
