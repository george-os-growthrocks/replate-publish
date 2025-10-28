# STRIPE SETUP & TESTING GUIDE 🚀

## ✅ What's Already Done

### Database:
- ✅ Migration applied (`20251028_subscription_system.sql`)
- ✅ 6 tables created (subscriptions, credits, projects, usage logs)
- ✅ 3 plans inserted (Starter, Pro, Agency)
- ✅ RLS policies enabled

### Edge Functions Deployed:
- ✅ `stripe-checkout` - Creates Stripe sessions
- ✅ `stripe-webhook` - Handles Stripe events
- ✅ `pagespeed-insights` - CWV scores

### Frontend:
- ✅ Hooks created (useSubscription, useCredits, useProjects)
- ✅ Components built (SubscriptionSettings, ProjectsPage)
- ✅ Pricing page with Stripe integration
- ✅ Settings page with subscription tab

---

## 🔍 Debugging the 400 Error

### Check Browser Console:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for logs from `useSubscription.ts`
4. The console.log will show:
   - What plan name is being sent
   - The response from the edge function
   - The actual error message

### Common Causes:

**1. Plan Name Mismatch**
- Frontend sends: "Starter", "Pro", "Agency"
- Database expects exact match
- Check console for: `"Plan X not found in database"`

**2. Not Authenticated**
- User must be signed in
- Check for: `"Not authenticated"` error

**3. Stripe API Key Issues**
- Test vs Live keys
- Check Supabase logs for Stripe errors

---

## 🧪 How to Test (Development Mode)

### Step 1: Check if Plans Exist in Database
```sql
SELECT * FROM subscription_plans;
```
Should return 3 rows: Starter, Pro, Agency

### Step 2: Test Checkout Flow
1. Sign in to the app
2. Go to `/pricing`
3. Click "Start Free Trial" on Starter plan
4. Open browser console
5. Look for console.logs showing the request/response

### Step 3: Check Supabase Function Logs
Visit: https://supabase.com/dashboard/project/siwzszmukfbzicjjkxro/functions/stripe-checkout/logs

Look for:
- "Checkout request:" log
- "Plan lookup result:" log
- Any error messages

---

## 🔧 Quick Fixes

### If Plan Not Found:
Run this SQL in Supabase SQL Editor:
```sql
-- Check if plans exist
SELECT name FROM subscription_plans;

-- If no plans, insert them manually:
INSERT INTO subscription_plans (name, price_monthly, price_yearly, credits_per_month, max_projects, max_team_members, features) VALUES
('Starter', 69, 690, 1000, 3, 1, '["Keyword Research", "Rank Tracking", "Content Repurpose", "Site Audit", "Email Support"]'::jsonb),
('Pro', 99, 990, 3000, 10, 3, '["Everything in Starter", "Unlimited Keywords", "Backlink Analysis", "Priority Support", "White-Label Reports"]'::jsonb),
('Agency', 299, 2990, 10000, 50, 15, '["Everything in Pro", "Unlimited Everything", "API Access", "Dedicated Manager", "24/7 Support"]'::jsonb);
```

### If Authentication Error:
1. Sign out and sign back in
2. Check session is valid: `supabase.auth.getSession()`

### If Stripe Error:
The function will create prices on-the-fly for testing. Check if you see:
- "Creating Stripe price on-the-fly..."
- "Created price: price_xxx"

---

## 🎯 What Should Happen

### Successful Flow:
1. User clicks "Start Free Trial"
2. Console logs: "Creating checkout for: Starter, monthly"
3. Edge function creates Stripe session
4. Console logs: "Redirecting to checkout: https://checkout.stripe.com/..."
5. User is redirected to Stripe payment page
6. After payment, redirected to `/dashboard?session_id=xxx`

### After Webhook Processes:
1. `user_subscriptions` row created
2. `user_credits` updated with plan credits
3. User can see plan in Settings → Subscription tab

---

## 📊 Testing Checklist

- [ ] Browser console shows no errors
- [ ] Plans exist in database (run SELECT query)
- [ ] User is authenticated
- [ ] Stripe function logs show request details
- [ ] Price created successfully
- [ ] Checkout URL returned
- [ ] Redirect to Stripe works

---

## 🐛 Still Getting 400?

### Try This:
1. **Hard refresh browser** (Ctrl + Shift + R)
2. **Check Supabase function logs** for the actual error
3. **Run this in console:**
```javascript
const result = await supabase.functions.invoke('stripe-checkout', {
  body: { planName: 'Starter', billingCycle: 'monthly' }
});
console.log('Result:', result);
```

This will show you the exact error response.

---

## 🔐 Production Setup (Later)

### 1. Create Real Stripe Products/Prices:
In Stripe Dashboard:
1. Create 3 Products (Starter, Pro, Agency)
2. For each, create 2 Prices (monthly, yearly)
3. Copy the price IDs (price_xxx)

### 2. Update Database:
```sql
UPDATE subscription_plans 
SET stripe_price_id_monthly = 'price_xxx_monthly',
    stripe_price_id_yearly = 'price_xxx_yearly'
WHERE name = 'Starter';
-- Repeat for Pro and Agency
```

### 3. Configure Webhook:
- Stripe Dashboard → Webhooks
- Add endpoint: `https://siwzszmukfbzicjjkxro.supabase.co/functions/v1/stripe-webhook`
- Select events: checkout.session.completed, customer.subscription.*, invoice.*
- Copy webhook secret
- Add to Supabase: `STRIPE_WEBHOOK_SECRET=whsec_xxx`

### 4. Test with Stripe Test Mode:
- Use test cards: 4242 4242 4242 4242
- Verify webhook calls succeed
- Check subscription created in database

---

## 🎉 Current Status

✅ Database schema ready
✅ Edge functions deployed
✅ Frontend components built
✅ Pricing page integrated
✅ Settings page with subscription info
✅ Project management system
✅ Credit tracking system
✅ Favicon fixed

**Next:** Check browser console and Supabase logs to see exact error, then we can fix it!

