# New Authentication & User Flow Setup Guide

## Overview

This application now uses a **decoupled authentication system**:
- **Primary Auth**: Email/Password via Supabase Auth
- **Data Access**: Separate Google OAuth for GSC data only
- **Billing**: Stripe with independent session handling

This architecture fixes the 1-hour token expiration issue and provides proper offline GSC access.

## Prerequisites

- Supabase project with service role key
- Google Cloud Console project
- Stripe account
- Node.js and npm installed

## 1. Database Setup

### Run Migrations

Run these migrations in order:

```bash
# 1. Reset users (⚠️ WARNING: Deletes all existing users)
psql -d your_database < supabase/migrations/20251031080000_reset_users.sql

# 2. Rename projects table
psql -d your_database < supabase/migrations/20251031080001_rename_projects_table.sql

# 3. Create GSC properties table
psql -d your_database < supabase/migrations/20251031080002_gsc_properties_table.sql

# 4. Setup profiles table
psql -d your_database < supabase/migrations/20251031080003_profiles_table.sql
```

Or run them directly in Supabase SQL Editor.

## 2. Supabase Configuration

### Environment Variables

Set these in your Supabase Edge Functions secrets:

```bash
supabase secrets set GOOGLE_CLIENT_ID=your_google_client_id
supabase secrets set GOOGLE_CLIENT_SECRET=your_google_client_secret
supabase secrets set GOOGLE_REDIRECT_URI=https://your-project.supabase.co/functions/v1/gsc-oauth-callback
supabase secrets set APP_URL=https://your-domain.com
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret
supabase secrets set STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

### Auth Settings

In Supabase Dashboard → Authentication:

1. **Email Auth**:
   - Enable Email provider
   - Enable "Confirm email" if desired
   - Configure email templates

2. **Google OAuth** (optional, can disable):
   - Disable Google as a sign-in provider
   - Google OAuth is now only used for data access, not authentication

3. **Site URL**:
   - Set to your production URL: `https://your-domain.com`

4. **Redirect URLs**:
   - Add: `https://your-domain.com/auth`
   - Add: `https://your-domain.com/dashboard`
   - Add: `https://your-domain.com/onboarding`
   - Add: `https://your-domain.com/connections/google/success`

## 3. Google Cloud Console Setup

### Create OAuth 2.0 Credentials

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create or edit OAuth 2.0 Client ID

### Configure OAuth Consent Screen

- App name: Your App Name
- User support email: your@email.com
- Scopes:
  - `openid`
  - `email`
  - `profile`
  - `https://www.googleapis.com/auth/webmasters.readonly`

### Authorized JavaScript Origins

```
https://your-domain.com
https://your-netlify-subdomain.netlify.app (if using Netlify)
```

### Authorized Redirect URIs

**IMPORTANT**: Use your Supabase Edge Function URL, NOT Supabase Auth callback:

```
https://YOUR_PROJECT.supabase.co/functions/v1/gsc-oauth-callback
```

Example:
```
https://abc123xyz.supabase.co/functions/v1/gsc-oauth-callback
```

## 4. Deploy Edge Functions

Deploy the new Edge Functions:

```bash
# Deploy GSC OAuth functions
supabase functions deploy gsc-oauth-start
supabase functions deploy gsc-oauth-callback
supabase functions deploy gsc-save-property

# Update existing functions
supabase functions deploy gsc-sites
supabase functions deploy gsc-query
supabase functions deploy gemini-insights
```

## 5. Frontend Configuration

### Environment Variables

Create/update `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SITE_URL=https://your-domain.com
```

For production (Netlify/Vercel), add these to your hosting platform's environment variables.

## 6. Stripe Configuration

### Webhook Setup

1. Create webhook endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`

2. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`

3. Copy webhook signing secret and add to Supabase secrets:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## User Flow

### New User Experience

1. **Sign Up** (`/auth`):
   - User enters email, password, full name
   - Email verification (optional)
   - Creates profile automatically

2. **Onboarding** (`/onboarding`):
   - Step 1: Create first project (name + domain)
   - Step 2: Connect Google Search Console (OAuth)
   - Step 3: Select GSC property for project
   - Complete: Redirects to dashboard

3. **Connect GSC** (during onboarding or later):
   - Separate OAuth flow (not for login!)
   - Requests offline access
   - Stores refresh_token securely
   - Lists available GSC properties
   - User selects property for project

4. **Using GSC Data**:
   - All GSC functions auto-refresh tokens
   - No more "token expired" errors
   - Works indefinitely (until user revokes access)

5. **Stripe Payment**:
   - Independent of user session
   - Works even after session expires
   - Webhooks update subscription via user_id in metadata

### Existing User Migration

For users already on Google OAuth:

1. Ask them to set a password in Settings
2. They can now sign in with email/password
3. Google connection becomes data-only (not auth)
4. Old provider_token in session → new refresh_token in DB

## Testing

### 1. Test Email/Password Auth

```bash
# Local development
npm run dev
```

1. Visit `http://localhost:8080/auth`
2. Sign up with email/password
3. Verify you're redirected to `/onboarding`
4. Check profile was created in DB

### 2. Test GSC OAuth Flow

1. Complete onboarding step 1 (create project)
2. Click "Connect Google Search Console"
3. Should redirect to Google OAuth
4. Grant permissions
5. Should redirect back with success
6. List properties should appear
7. Select property and save

### 3. Test Token Refresh

1. Manually expire access_token in DB (set expires_at to past)
2. Try fetching GSC data
3. Should auto-refresh and work

### 4. Test Stripe Independence

1. Start Stripe checkout session
2. Close browser / wait > 1 hour
3. Complete payment in Stripe
4. Verify webhook updates subscription correctly
5. User should see active plan

## Security Notes

### Refresh Token Encryption

Currently refresh tokens are stored in plain text. For production, implement encryption:

```sql
-- Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt refresh tokens
UPDATE user_oauth_tokens 
SET refresh_token = pgp_sym_encrypt(refresh_token, 'your-encryption-key');

-- Update functions to decrypt
SELECT pgp_sym_decrypt(refresh_token::bytea, 'your-encryption-key');
```

### RLS Policies

- `user_oauth_tokens` table: NEVER allow client reads
- All token operations: Server-side only (Edge Functions with service role)
- `gsc_properties`: Users can only see their own

### Token Revocation

Users can disconnect GSC in Settings:
1. Revokes token with Google
2. Deletes from database
3. Clears selected properties

## Troubleshooting

### "No refresh token available"

**Cause**: User didn't grant offline access or Google didn't issue refresh token

**Fix**:
1. Ensure `access_type=offline` and `prompt=consent` in OAuth request
2. Disconnect and reconnect GSC in Settings

### "Token expired" still happening

**Cause**: Function not using `getFreshGoogleToken` helper

**Fix**: Update function to import and use the token refresh helper:
```typescript
import { getFreshGoogleToken } from "../_shared/gsc-token-refresh.ts";
const token = await getFreshGoogleToken(supabaseAdmin, userId);
```

### Stripe webhook not working

**Cause**: Signature verification failing or wrong environment

**Fix**:
1. Verify webhook secret matches Stripe dashboard
2. Check Supabase function logs for errors
3. Test webhook with Stripe CLI:
   ```bash
   stripe listen --forward-to https://your-project.supabase.co/functions/v1/stripe-webhook
   ```

### OAuth callback error

**Cause**: Redirect URI mismatch

**Fix**:
1. Verify Google Cloud Console has exact Edge Function URL
2. Format: `https://PROJECT.supabase.co/functions/v1/gsc-oauth-callback`
3. No trailing slash
4. Must match exactly

## Migration Checklist

- [ ] Run all database migrations
- [ ] Configure Supabase Auth settings
- [ ] Set up Google Cloud OAuth (new redirect URI)
- [ ] Deploy Edge Functions
- [ ] Configure Stripe webhook
- [ ] Set environment variables (frontend & backend)
- [ ] Test new user signup flow
- [ ] Test GSC connection flow
- [ ] Test token auto-refresh
- [ ] Test Stripe checkout
- [ ] Verify webhook updates subscriptions
- [ ] Update any frontend components using old OAuth
- [ ] Remove/update old documentation

## Support

For issues or questions:
1. Check Supabase Edge Function logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Test with Stripe CLI for webhook issues

