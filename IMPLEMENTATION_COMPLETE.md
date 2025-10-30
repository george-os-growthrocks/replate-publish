# ✅ New User Flow Implementation Complete!

## What Has Been Implemented

### ✅ Database Migrations (4 files created)

1. **`20251031080000_reset_users.sql`** - Deletes all existing users for fresh start
2. **`20251031080001_rename_projects_table.sql`** - Renames `seo_projects` to `projects`, adds GSC tracking columns
3. **`20251031080002_gsc_properties_table.sql`** - Creates `gsc_properties` table with project linking
4. **`20251031080003_profiles_table.sql`** - Consolidates `user_profiles` into `profiles` table
5. **`20251031080004_encrypt_refresh_tokens.sql`** - Implements pgcrypto encryption for refresh tokens

### ✅ Edge Functions (5 new + 3 updated)

**New Functions:**
- `gsc-oauth-start` - Initiates separate GSC OAuth flow
- `gsc-oauth-callback` - Handles OAuth callback and stores tokens
- `gsc-save-property` - Saves selected GSC property to project
- `_shared/gsc-token-refresh.ts` - Helper for auto-refreshing tokens with encryption support

**Updated Functions:**
- `gsc-sites` - Now uses auto-refresh token helper
- `gsc-query` - Now uses auto-refresh token helper
- `gemini-insights` - Now uses auto-refresh token helper

**Verified:**
- `create-checkout-session` - Already session-independent ✓
- `stripe-webhook` - Already session-independent ✓

### ✅ Frontend Pages (3 new + 2 updated)

**Complete Rewrites:**
- `src/pages/Auth.tsx` - Email/password auth only, no Google OAuth
- `src/pages/Onboarding.tsx` - Full 3-step onboarding flow
- `src/pages/Settings.tsx` - Profile & GSC connection management

**Updated:**
- `src/pages/AnalyticsDashboard.tsx` - Removed Google OAuth, placeholder for future GA4 flow
- `src/components/onboarding/ConnectGSCStep.tsx` - Uses new separate OAuth flow

### ✅ Documentation

- **`NEW_AUTH_SETUP.md`** - Comprehensive setup guide with all configuration steps
- **`IMPLEMENTATION_COMPLETE.md`** - This file
- Deleted outdated: `OAUTH_SETUP.md`, `OAUTH_QUICK_FIX.md`

## Architecture Overview

### Before (Coupled)
```
User Login (Google OAuth) → 1-hour token → Stripe fails after 1 hour
          ↓
     GSC Data Access
```

### After (Decoupled)
```
User Login (Email/Password) → Long-lived session → Stripe works indefinitely
          ↓
User Connects GSC (Separate OAuth) → Refresh token stored → Auto-refresh forever
          ↓
     GSC Data Access
```

## What You Need to Do Next

### 1. Run Database Migrations ⚠️

**WARNING**: The first migration deletes all users!

```bash
# Connect to your Supabase project
# Then run migrations in order via SQL Editor

# 1. Reset users (⚠️ DELETES ALL USERS)
# Copy/paste: supabase/migrations/20251031080000_reset_users.sql

# 2-5. Run remaining migrations in order
```

### 2. Configure Supabase Auth

In Supabase Dashboard → Authentication → Providers:

1. **Email Provider**:
   - ✅ Enable
   - Set email confirmation (recommended)
   - Configure templates

2. **Google Provider** (optional):
   - Can disable for login (no longer needed)
   - Keep enabled only if you want it as backup

3. **URL Configuration**:
   - Site URL: `https://your-domain.com`
   - Redirect URLs: Add these:
     ```
     https://your-domain.com/auth
     https://your-domain.com/dashboard
     https://your-domain.com/onboarding
     https://your-domain.com/connections/google/success
     ```

### 3. Configure Edge Function Secrets

```bash
supabase secrets set GOOGLE_CLIENT_ID=your_client_id
supabase secrets set GOOGLE_CLIENT_SECRET=your_client_secret
supabase secrets set GOOGLE_REDIRECT_URI=https://siwzszmukfbzicjjkxro.supabase.co/functions/v1/gsc-oauth-callback
supabase secrets set APP_URL=https://anotherseoguru.com
supabase secrets set REFRESH_TOKEN_ENCRYPTION_KEY=$(openssl rand -base64 32)
```

### 4. Update Google Cloud Console

**Critical**: Update OAuth redirect URI!

Old (remove):
```
https://YOUR_PROJECT.supabase.co/auth/v1/callback
```

New (add):
```
https://YOUR_PROJECT.supabase.co/functions/v1/gsc-oauth-callback
```

### 5. Deploy Edge Functions

```bash
# New functions
supabase functions deploy gsc-oauth-start
supabase functions deploy gsc-oauth-callback  
supabase functions deploy gsc-save-property

# Updated functions
supabase functions deploy gsc-sites
supabase functions deploy gsc-query
supabase functions deploy gemini-insights
```

### 6. Set Frontend Environment Variables

Local (`.env`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SITE_URL=http://localhost:8080
```

Production (Netlify/Vercel):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SITE_URL=https://your-production-domain.com
```

### 7. Test the New Flow

#### Test 1: Email/Password Signup
1. Visit `/auth`
2. Click "Sign up"
3. Enter email, password, name
4. Should redirect to `/onboarding`

#### Test 2: Onboarding
1. Step 1: Create project (name + domain)
2. Step 2: Connect GSC (separate OAuth)
3. Step 3: Select GSC property
4. Should complete and redirect to dashboard

#### Test 3: Token Refresh
1. In DB, set `expires_at` to past date
2. Try fetching GSC data
3. Should auto-refresh and work

#### Test 4: Stripe Independence
1. Start checkout
2. Wait 1+ hours (or clear session)
3. Complete payment
4. Webhook should still update subscription

## Key Benefits

✅ **No More Token Expiration Issues**
- Stripe works even after session expires
- Automatic token refresh for GSC data

✅ **Better Security**
- Refresh tokens encrypted with pgcrypto
- Tokens never exposed to client
- RLS policies protect sensitive data

✅ **Cleaner Architecture**
- Authentication decoupled from data access
- Each system independent and testable
- Easier to add more data sources (GA4, etc.)

✅ **Better User Experience**
- Simple email/password login
- Clear onboarding flow
- Easy GSC reconnection in settings

## Troubleshooting

### "No refresh token available"

**Fix**: Ensure OAuth request includes:
- `access_type=offline`
- `prompt=consent`

These are already in `gsc-oauth-start`.

### Token still expiring

**Fix**: Check function is using `getFreshGoogleToken`:
```typescript
import { getFreshGoogleToken } from "../_shared/gsc-token-refresh.ts";
const token = await getFreshGoogleToken(supabaseAdmin, userId);
```

### OAuth redirect mismatch

**Fix**: Verify Google Cloud Console has EXACT URL:
```
https://YOUR_PROJECT_ID.supabase.co/functions/v1/gsc-oauth-callback
```
No trailing slash, must match exactly.

### Stripe webhook failing

**Fix**: 
1. Verify webhook secret matches
2. Check Supabase function logs
3. Test with Stripe CLI:
```bash
stripe listen --forward-to https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook
```

## Next Steps

1. **Run migrations** (carefully, first one deletes users!)
2. **Configure Supabase Auth** (disable Google login, enable email)
3. **Update Google Cloud Console** (new redirect URI)
4. **Deploy Edge Functions** (all 8 functions)
5. **Test signup flow** (email/password → onboarding)
6. **Test GSC connection** (separate OAuth flow)
7. **Test Stripe** (checkout after session expires)

## Files Changed

### Created:
- 5 migration files
- 1 new shared helper
- 3 new Edge Functions  
- 3 new frontend pages
- 2 documentation files

### Updated:
- 3 Edge Functions
- 2 frontend components
- Deleted 2 outdated docs

## Support

See `NEW_AUTH_SETUP.md` for detailed configuration instructions.

For issues:
1. Check Supabase Edge Function logs
2. Check browser console
3. Verify all environment variables set
4. Test with Stripe CLI for webhooks

---

**Status**: ✅ Implementation Complete
**Next**: Configuration & Testing (manual steps required)
