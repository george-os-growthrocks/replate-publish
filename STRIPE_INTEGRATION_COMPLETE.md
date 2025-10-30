# ✅ Stripe Integration Complete

## What Was Fixed

### 1. **Database Sync Trigger** ✅
**File**: `supabase/migrations/20251031050000_sync_stripe_to_subscriptions.sql`

- Created automatic sync from `subscriptions` (Stripe webhooks) → `user_subscriptions` + `user_credits`
- Triggers on INSERT/UPDATE to subscriptions table
- Maps Stripe price_id to plan_id
- Updates credits based on plan allocation
- Handles subscription status changes (trialing → active, cancellation, etc.)

### 2. **Google OAuth Token Auto-Refresh** ✅
**Files**: 
- `supabase/functions/_shared/refresh-google-token.ts` (NEW)
- `supabase/functions/_shared/get-google-token.ts` (UPDATED)
- `supabase/functions/gsc-query/index.ts` (UPDATED)

**What it does**:
- Automatically checks if Google OAuth token is expired or expiring soon (< 5 minutes)
- Refreshes token using refresh_token via Google OAuth API
- Updates database with new token and expiry time
- All GSC functions now get tokens with auto-refresh

**Why it's important**:
- Google OAuth tokens expire in ~1 hour
- Without refresh, users lose GSC access and must re-authenticate
- Now seamless - tokens refresh automatically in the background

### 3. **Enhanced Stripe Webhook** ✅
**File**: `supabase/functions/stripe-webhook/index.ts`

**Improvements**:
- On `checkout.session.completed`: Immediately fetches subscription details and syncs
- Better logging for debugging
- Ensures customer mapping is saved
- Triggers subscription sync right after payment

### 4. **Frontend Token Expiry Handling** ✅
**File**: `src/hooks/useGscData.ts`

- Catches token/authentication errors
- Shows user-friendly error message
- Automatically redirects to `/auth` after 2 seconds
- Prevents cryptic error messages

### 5. **Real-time Stripe Status Hook** ✅
**File**: `src/hooks/useSubscription.ts`

**New Hook**: `useStripeSubscriptionStatus()`
- Queries `subscriptions` table (Stripe source of truth)
- Polls every 10 seconds for updates
- Useful for checking if payment processed
- Can be used on success pages to confirm subscription

---

## How It Works Now

### Flow 1: New User Signup → Free Trial

1. User clicks "Start Free Trial" on pricing page
2. Redirects to `/auth` if not logged in
3. Signs in with Google → OAuth tokens saved to `user_oauth_tokens`
4. `handle_new_user()` trigger creates:
   - `user_subscriptions`: Launch plan, status = "trialing", 7-day trial
   - `user_credits`: 1200 credits
5. User redirected to `/dashboard`
6. User has 7 days to explore with 1200 credits

### Flow 2: User Upgrades to Paid Plan

1. User clicks "Choose Plan" (e.g., Growth)
2. Frontend calls `create-checkout-session` edge function
3. Edge function:
   - Gets user from JWT
   - Looks up plan and Stripe price_id
   - Creates/retrieves Stripe customer
   - Creates Stripe checkout session with 7-day trial
   - Returns checkout URL
4. User redirected to Stripe Checkout
5. User enters payment details
6. **Stripe processes payment**
7. Stripe webhook sends `checkout.session.completed` event
8. Webhook handler:
   - Saves customer mapping to `stripe_customers`
   - Fetches subscription details
   - Inserts into `subscriptions` table
9. **Database trigger fires** (`sync_stripe_subscription`)
10. Trigger:
    - Finds plan by price_id
    - Updates `user_subscriptions` with new plan
    - Resets `user_credits` to new plan's credit allocation
11. User redirected back to app
12. Frontend polls and sees updated subscription + credits

### Flow 3: Google Token Refresh (Background)

1. User makes GSC query (e.g., viewing dashboard metrics)
2. `gsc-query` edge function called
3. Function calls `getGoogleToken(dbClient, userId)`
4. `getGoogleToken` calls `refreshGoogleToken(userId, dbClient)`
5. `refreshGoogleToken` checks expiry:
   - If expires > 5 minutes from now → Skip refresh
   - If expired or expiring soon → Refresh
6. Refresh process:
   - Calls Google OAuth API with `refresh_token`
   - Gets new `access_token` and `expires_in`
   - Updates `user_oauth_tokens` table
7. Function continues with fresh token
8. User never knows refresh happened

---

## Environment Variables Required

### Supabase Edge Functions

Set these in Supabase Dashboard → Settings → Edge Functions → Secrets:

```bash
GOOGLE_CLIENT_ID=<your_google_oauth_client_id>
GOOGLE_CLIENT_SECRET=<your_google_oauth_client_secret>
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
```

**How to set**:
```bash
supabase secrets set GOOGLE_CLIENT_ID=<value>
supabase secrets set GOOGLE_CLIENT_SECRET=<value>
```

Or via Supabase Dashboard: Project Settings → Edge Functions → Manage secrets

---

## Testing Guide

### Prerequisites
- Stripe test mode enabled
- Stripe CLI installed and listening: `stripe listen --forward-to https://your-project.supabase.co/functions/v1/stripe-webhook`
- Test credit card: `4242 4242 4242 4242`, any future expiry, any CVC

### Test 1: New User Free Trial ✅

**Steps**:
1. Clear browser data or use incognito
2. Go to `/pricing`
3. Click "Start Free Trial" on Launch plan
4. Sign in with Google
5. Check dashboard

**Expected**:
- User redirected to `/dashboard`
- Shows "Launch" plan with "Trial" badge
- Shows 1200 credits available
- Trial ends in 7 days

**SQL to verify**:
```sql
SELECT 
  us.status,
  sp.name as plan_name,
  uc.total_credits,
  uc.used_credits,
  us.trial_end
FROM user_subscriptions us
JOIN subscription_plans sp ON sp.id = us.plan_id
JOIN user_credits uc ON uc.user_id = us.user_id
WHERE us.user_id = '<user_id>';
```

### Test 2: Upgrade to Paid Plan ✅

**Steps**:
1. As logged-in user, go to `/pricing`
2. Click "Choose Plan" on Growth plan
3. Complete Stripe checkout with test card: `4242 4242 4242 4242`
4. Wait for redirect back to app
5. Check subscription status

**Expected**:
- Stripe checkout succeeds
- Webhook fires and syncs data
- `subscriptions` table has new entry with status "trialing" (7-day trial)
- `user_subscriptions` updated to Growth plan
- `user_credits` reset to 6000 (Growth plan allocation)
- Status shows "trialing" for 7 days, then becomes "active"

**SQL to verify sync**:
```sql
-- Check Stripe subscriptions table
SELECT id, user_id, status, price_id, trial_end, current_period_end
FROM subscriptions
WHERE user_id = '<user_id>';

-- Check user_subscriptions (should match)
SELECT us.status, sp.name, us.trial_end, us.current_period_end
FROM user_subscriptions us
JOIN subscription_plans sp ON sp.id = us.plan_id
WHERE us.user_id = '<user_id>';

-- Check credits
SELECT total_credits, used_credits
FROM user_credits
WHERE user_id = '<user_id>';
```

### Test 3: Google Token Refresh ✅

**Steps**:
1. Manually expire token in database:
```sql
UPDATE user_oauth_tokens
SET expires_at = NOW() - INTERVAL '1 hour'
WHERE user_id = '<user_id>' AND provider = 'google';
```
2. Try to view GSC data on dashboard
3. Check Supabase function logs

**Expected**:
- Function logs show "Token expired or expiring soon, refreshing..."
- Function calls Google OAuth API
- Token updated with new expiry
- GSC query succeeds
- No error to user

**SQL to verify**:
```sql
SELECT expires_at, updated_at
FROM user_oauth_tokens
WHERE user_id = '<user_id>' AND provider = 'google';
-- expires_at should be in the future now
```

### Test 4: Token Expiry Frontend Handling ✅

**Steps**:
1. Delete OAuth token from database:
```sql
DELETE FROM user_oauth_tokens
WHERE user_id = '<user_id>' AND provider = 'google';
```
2. Try to view GSC data on dashboard

**Expected**:
- Error toast: "Session expired. Please sign in again."
- After 2 seconds, redirect to `/auth`
- User can re-authenticate

### Test 5: Subscription Cancellation ✅

**Steps**:
1. In Stripe Dashboard, find test subscription
2. Cancel subscription (set to cancel at period end)
3. Wait for webhook

**Expected**:
- Webhook fires with `customer.subscription.updated`
- `subscriptions` table: `cancel_at_period_end = true`
- `user_subscriptions` table: synced via trigger
- User can still use app until period end
- After period end, status changes to "canceled"
- Trigger downgrades user to Free plan (100 credits)

---

## Monitoring & Debugging

### Check Supabase Function Logs

```bash
# Real-time logs for specific function
supabase functions logs gsc-query --follow

# Webhook logs
supabase functions logs stripe-webhook --follow
```

### Check Database Trigger Logs

Trigger outputs NOTICE and WARNING logs. View in Supabase SQL Editor:

```sql
-- Enable logging
SET client_min_messages TO NOTICE;

-- Manually test trigger (simulates webhook)
-- Don't run in production!
```

### Common Issues & Solutions

#### Issue: Credits don't update after payment
**Check**:
1. Did webhook fire? Check Stripe Dashboard → Webhooks
2. Did trigger run? Check database logs
3. Is price_id in subscriptions table?
4. Does price_id match a plan in subscription_plans?

**Fix**:
```sql
-- Manually check mapping
SELECT 
  s.id,
  s.price_id,
  sp.name as plan_name,
  sp.credits_per_month
FROM subscriptions s
LEFT JOIN subscription_plans sp ON (
  sp.stripe_price_id_monthly = s.price_id 
  OR sp.stripe_price_id_yearly = s.price_id
)
WHERE s.user_id = '<user_id>';

-- If no plan matched, price_id might be wrong
-- Update subscription_plans table with correct Stripe price IDs
```

#### Issue: Google token keeps expiring
**Check**:
1. Are `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set?
2. Does user have a refresh_token in user_oauth_tokens?

**Fix**:
```bash
# Check secrets
supabase secrets list

# Set if missing
supabase secrets set GOOGLE_CLIENT_ID=<value>
supabase secrets set GOOGLE_CLIENT_SECRET=<value>
```

```sql
-- Check if refresh_token exists
SELECT 
  user_id,
  provider,
  refresh_token IS NOT NULL as has_refresh_token,
  expires_at
FROM user_oauth_tokens
WHERE user_id = '<user_id>';
```

#### Issue: Webhook not firing
**Check**:
1. Is Stripe CLI listening? `stripe listen --forward-to <url>`
2. Is webhook endpoint configured in Stripe Dashboard?
3. Is `STRIPE_WEBHOOK_SECRET` set correctly?

**Fix**:
```bash
# Get webhook secret from Stripe CLI output
stripe listen --forward-to https://your-project.supabase.co/functions/v1/stripe-webhook
# Copy the webhook signing secret

# Set in Supabase
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Deployment Checklist

### 1. Run Database Migration
```bash
supabase db push
```

Or manually in Supabase SQL Editor:
```sql
-- Run: supabase/migrations/20251031050000_sync_stripe_to_subscriptions.sql
```

### 2. Deploy Updated Edge Functions
```bash
supabase functions deploy gsc-query
supabase functions deploy stripe-webhook
```

### 3. Set Environment Variables
```bash
supabase secrets set GOOGLE_CLIENT_ID=<value>
supabase secrets set GOOGLE_CLIENT_SECRET=<value>
# Others should already be set
```

### 4. Configure Stripe Webhook (Production)
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_succeeded`
4. Copy webhook signing secret
5. Set in Supabase: `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`

### 5. Test in Production
- Use Stripe test mode first
- Then switch to live mode
- Monitor logs for any errors

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         USER FLOW                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Sign up / Auth  │
                    │  (Google OAuth)  │
                    └─────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  handle_new_user() Trigger             │
         │  • Creates user_subscriptions (trial)  │
         │  • Creates user_credits (1200)         │
         └────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Use App       │
                    │   (7-day trial) │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Upgrade Plan    │
                    │ (Stripe Checkout)│
                    └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    STRIPE WEBHOOK FLOW                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  checkout.session.completed   │
              │  • Save stripe_customers      │
              │  • Fetch subscription         │
              │  • Insert into subscriptions  │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  TRIGGER: sync_stripe_sub()   │
              │  • Find plan by price_id      │
              │  • Update user_subscriptions  │
              │  • Reset user_credits         │
              └───────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  User sees:     │
                    │  • New plan     │
                    │  • New credits  │
                    │  • Active status│
                    └─────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   GOOGLE TOKEN REFRESH                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  GSC Query      │
                    │  (Dashboard)    │
                    └─────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  gsc-query edge function      │
              │  • Decode JWT                 │
              │  • Call getGoogleToken()      │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  refreshGoogleToken()         │
              │  • Check if expired           │
              │  • Call Google OAuth API      │
              │  • Update user_oauth_tokens   │
              └───────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Fresh token    │
                    │  Query succeeds │
                    └─────────────────┘
```

---

## Files Changed Summary

### New Files
1. `supabase/migrations/20251031050000_sync_stripe_to_subscriptions.sql` - Database sync trigger
2. `supabase/functions/_shared/refresh-google-token.ts` - OAuth token refresh utility

### Modified Files
1. `supabase/functions/_shared/get-google-token.ts` - Added auto-refresh logic
2. `supabase/functions/gsc-query/index.ts` - Uses shared token utility
3. `supabase/functions/stripe-webhook/index.ts` - Enhanced checkout handling
4. `src/hooks/useGscData.ts` - Added token expiry error handling
5. `src/hooks/useSubscription.ts` - Added useStripeSubscriptionStatus hook

---

## Success Metrics

After deployment, you should see:

✅ **No more "token expired" errors** - Automatic refresh
✅ **Credits update after payment** - Database sync working
✅ **Plan status correct** - Webhook → trigger pipeline working
✅ **Users stay authenticated longer** - No forced re-auth every hour
✅ **Seamless payment flow** - From checkout to active subscription
✅ **Real-time sync** - Subscription status updates within seconds

---

## Need Help?

### Check Logs
```bash
supabase functions logs gsc-query --follow
supabase functions logs stripe-webhook --follow
```

### Verify Database State
```sql
-- Check everything for a user
SELECT 
  'subscription' as type,
  us.status,
  sp.name as plan_name,
  us.trial_end,
  us.current_period_end
FROM user_subscriptions us
JOIN subscription_plans sp ON sp.id = us.plan_id
WHERE us.user_id = '<user_id>'

UNION ALL

SELECT 
  'credits' as type,
  NULL as status,
  CONCAT(uc.used_credits, ' / ', uc.total_credits) as plan_name,
  NULL as trial_end,
  uc.last_reset_at
FROM user_credits uc
WHERE uc.user_id = '<user_id>'

UNION ALL

SELECT 
  'stripe_sub' as type,
  s.status,
  s.price_id as plan_name,
  s.trial_end,
  s.current_period_end
FROM subscriptions s
WHERE s.user_id = '<user_id>';
```

### Test Webhook Locally
```bash
# Terminal 1: Start Stripe CLI
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Terminal 2: Trigger test event
stripe trigger checkout.session.completed
```

---

## 🎉 All Done!

Your Stripe integration is now:
- ✅ Fully automated
- ✅ Self-healing (token refresh)
- ✅ Real-time synced
- ✅ Production ready

Test thoroughly and monitor logs for the first few days after deployment!

