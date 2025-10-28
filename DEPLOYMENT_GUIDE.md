# Deployment Guide - Complete Platform Implementation

## 🚀 Quick Start Deployment

Follow these steps to deploy and test all implemented features.

---

## Step 1: Database Setup (CRITICAL - Do This First!)

### Option A: Manual SQL Execution (Recommended)
1. Go to Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/siwzszmukfbzicjjkxro/sql/new
   ```

2. Copy the entire contents of `MANUAL_SQL_EXECUTION.sql`

3. Click **"Run"**

4. Verify tables were created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

   You should see:
   - `credit_transactions`
   - `user_feature_access`
   - `free_tool_usage`
   - `ai_overview_rankings`
   - `chatgpt_citations`
   - `atp_queries_cache`
   - `user_profiles`
   - `user_activity_log`

---

## Step 2: Deploy Edge Functions

Deploy all new/updated edge functions:

```bash
# Deploy Stripe functions (enhanced)
npx supabase functions deploy stripe-checkout
npx supabase functions deploy stripe-webhook

# Deploy new tools
npx supabase functions deploy answer-the-public
npx supabase functions deploy meta-description-generator
```

Verify deployment:
```bash
npx supabase functions list
```

---

## Step 3: Configure Stripe Webhook

1. Go to Stripe Dashboard:
   ```
   https://dashboard.stripe.com/webhooks
   ```

2. Click **"Add endpoint"**

3. Enter endpoint URL:
   ```
   https://siwzszmukfbzicjjkxro.supabase.co/functions/v1/stripe-webhook
   ```

4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Copy the **Signing Secret** and add to Supabase:
   ```bash
   npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## Step 4: Test Core Features

### 4.1 Test User Registration & Credits
1. Sign up a new user at `/auth`
2. User should get a `user_credits` record automatically
3. Check in Supabase:
   ```sql
   SELECT * FROM user_credits WHERE user_id = 'your-user-id';
   ```

### 4.2 Test Dashboard
1. Navigate to `/dashboard`
2. Verify you see:
   - ✅ Credit balance (should show 0 initially)
   - ✅ Projects count
   - ✅ Platform usage charts
   - ✅ Real data (not mock)

### 4.3 Test Answer The Public
1. Navigate to `/answer-the-public`
2. Enter a keyword (e.g., "seo tools")
3. Click "Generate Wheel"
4. Should see credit check popup (if 0 credits)
5. Manually add credits to test:
   ```sql
   UPDATE user_credits 
   SET total_credits = 100, used_credits = 0 
   WHERE user_id = 'your-user-id';
   ```
6. Try again - should generate wheel and deduct 2 credits
7. Verify in `credit_transactions` table

### 4.4 Test Meta Description Generator
1. Navigate to `/free-tools/meta-description-generator`
2. Paste some content
3. Add a target keyword
4. Click "Generate"
5. Should see 5 AI-generated variations
6. Verify credit deduction (1 credit)

### 4.5 Test Credit Purchase (Requires Stripe Test Mode)
1. Navigate to `/settings?tab=subscription`
2. Click "Buy More Credits"
3. Select a credit package
4. Complete checkout with test card: `4242 4242 4242 4242`
5. Verify credits added via webhook
6. Check `credit_transactions` for the purchase record

---

## Step 5: Verify Database Functions

Test the PostgreSQL functions:

### Test Credit Consumption
```sql
-- Add test credits
SELECT add_credits(
  'your-user-id'::uuid,
  100,
  'bonus',
  NULL,
  '{"test": true}'::jsonb
);

-- Consume credits
SELECT consume_credits_with_transaction(
  'your-user-id'::uuid,
  'answer_the_public',
  2,
  NULL,
  '{"keyword": "test"}'::jsonb
);

-- Check result
SELECT * FROM user_credits WHERE user_id = 'your-user-id';
SELECT * FROM credit_transactions WHERE user_id = 'your-user-id' ORDER BY created_at DESC;
```

### Test Feature Access
```sql
-- Check if user has feature access
SELECT has_feature_access('your-user-id'::uuid, 'answer_the_public_unlimited');
```

---

## Step 6: Test Payment Flows (Stripe Test Mode)

### 6.1 Test Subscription Purchase
1. Go to `/pricing`
2. Click "Choose Pro" ($99/mo)
3. Complete checkout with test card
4. Verify in Supabase:
   ```sql
   SELECT * FROM user_subscriptions WHERE user_id = 'your-user-id';
   SELECT * FROM user_credits WHERE user_id = 'your-user-id';
   ```
5. Should see 3,000 credits added

### 6.2 Test Credit Purchase
1. Click "Buy Credits" button
2. Select 500 credits package ($40)
3. Complete checkout
4. Verify bonus credits applied (500 + 50 = 550 total)

### 6.3 Test Individual Feature Purchase
1. Try to use a premium feature without sufficient credits
2. Click "Unlock This Feature Only"
3. Complete checkout for individual feature
4. Verify in `user_feature_access` table

---

## Step 7: Monitor Logs

### Check Edge Function Logs
```bash
npx supabase functions logs answer-the-public
npx supabase functions logs meta-description-generator
npx supabase functions logs stripe-checkout
npx supabase functions logs stripe-webhook
```

### Check Browser Console
Open DevTools and monitor for:
- Credit check/consume operations
- API calls to edge functions
- Error messages

---

## Step 8: Performance Testing

### Test Answer The Public Caching
1. Generate wheel for keyword "seo tools"
2. Note the generation time
3. Generate again immediately
4. Should load instantly from cache
5. Verify in `atp_queries_cache` table

### Test Credit System Performance
1. Rapidly consume credits (use multiple tools)
2. Verify real-time updates in dashboard
3. Check for any race conditions

---

## Troubleshooting

### Issue: "User credits not found"
**Solution:**
```sql
-- Manually create credits record
INSERT INTO user_credits (user_id, total_credits, used_credits)
VALUES ('your-user-id', 100, 0);
```

### Issue: "Insufficient credits" but I have credits
**Solution:**
```sql
-- Check actual balance
SELECT * FROM user_credits WHERE user_id = 'your-user-id';

-- Reset if needed
UPDATE user_credits 
SET used_credits = 0 
WHERE user_id = 'your-user-id';
```

### Issue: Stripe webhook not firing
**Solution:**
1. Check webhook endpoint URL is correct
2. Verify signing secret is set
3. Use Stripe CLI for local testing:
   ```bash
   stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
   ```

### Issue: Edge function errors
**Solution:**
```bash
# Check logs
npx supabase functions logs [function-name]

# Redeploy
npx supabase functions deploy [function-name]
```

### Issue: FeatureGate always blocks
**Solution:**
```sql
-- Check user subscription
SELECT * FROM user_subscriptions WHERE user_id = 'your-user-id';

-- Manually add subscription for testing
INSERT INTO user_subscriptions (
  user_id, 
  plan_id, 
  status, 
  billing_cycle
) VALUES (
  'your-user-id',
  (SELECT id FROM subscription_plans WHERE name = 'Pro'),
  'active',
  'monthly'
);
```

---

## Testing Checklist

- [ ] Database tables created successfully
- [ ] Edge functions deployed without errors
- [ ] Stripe webhook configured and responding
- [ ] User can sign up/login
- [ ] Dashboard shows real data
- [ ] Credits display correctly
- [ ] Answer The Public generates real data
- [ ] Answer The Public caching works
- [ ] Meta Description Generator creates variations
- [ ] Credit consumption is tracked
- [ ] Credit purchases work (test mode)
- [ ] Subscription purchases work (test mode)
- [ ] FeatureGate blocks when no credits
- [ ] FeatureGate allows when credits available
- [ ] Credit transactions logged correctly
- [ ] No console errors
- [ ] No linter errors

---

## Production Readiness Checklist

Before going live:

### Database
- [ ] All migrations applied
- [ ] RLS policies verified
- [ ] Indexes created
- [ ] Backup strategy configured

### Stripe
- [ ] Switch to live mode
- [ ] Create production prices
- [ ] Update price IDs in database
- [ ] Configure production webhook
- [ ] Test real payments

### Edge Functions
- [ ] All functions deployed
- [ ] Environment variables set
- [ ] Error handling verified
- [ ] Rate limiting implemented
- [ ] Logging configured

### Security
- [ ] API keys secured
- [ ] RLS enabled on all tables
- [ ] CORS configured correctly
- [ ] Authentication required
- [ ] Input validation added

### Monitoring
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Credit usage alerts
- [ ] Low balance notifications
- [ ] Failed payment alerts

---

## Next Steps After Testing

1. **Implement Rate Limiting** for free tools
2. **Create remaining edge functions**:
   - Schema Generator
   - SERP Similarity
   - AI Overview Analyzer
   - ChatGPT Citation Optimizer
   - Content Gap Analyzer
   - Bulk SEO Analyzer
   - Technical Crawler

3. **Enhance UI/UX**:
   - Add loading skeletons
   - Improve error messages
   - Add success animations
   - Create onboarding flow

4. **Add Analytics**:
   - Track feature usage
   - Monitor credit consumption patterns
   - Analyze conversion rates
   - Identify popular tools

5. **Documentation**:
   - User guides
   - API documentation
   - Video tutorials
   - FAQ section

---

## Support

If you encounter issues:
1. Check the browser console
2. Check edge function logs
3. Check Supabase logs
4. Verify database records
5. Review Stripe dashboard

For questions, refer to:
- `IMPLEMENTATION_STATUS.md` - Overall progress
- `MANUAL_SQL_EXECUTION.sql` - Database schema
- `complete-platform-implementation.plan.md` - Full plan

---

**Last Updated:** October 28, 2025  
**Version:** 1.0  
**Status:** Ready for Testing

