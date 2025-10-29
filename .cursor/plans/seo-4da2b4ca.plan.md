<!-- 4da2b4ca-6f59-4691-83fc-53ee1eb2b7e6 ee199e4e-5916-4793-8b93-425778dbe9e7 -->
# Complete Pricing System Redesign

## Overview

Complete overhaul of pricing strategy with new plan structure, credit rate card, project system (domain × country/locale), seats tracking, add-ons, overage policies, and full Stripe integration updates.

## New Plan Structure

| Plan | Price/Mo | Seats | Projects | Credit Wallet | Tracked KWs (daily) | Crawl Budget | Reports/Mo |
|------|----------|-------|----------|---------------|---------------------|--------------|-------------|
| Launch | $29 | 1 | 3 | 1,200 | 250 | 10,000 URLs | 5 |
| Growth | $79 | 3 | 10 | 6,000 | 1,250 | 100,000 URLs | 20 |
| Agency | $149 | 10 | 30 | 20,000 | 5,000 | 400,000 URLs | 60 |
| Scale | Custom ($399+) | SSO | Contracted | 50,000+ | Contracted | Contracted | Contracted |

**Annual:** 2 months free (20% discount). Rollover: up to 20% credits on annual plans.

## Credit Rate Card

- Keyword ideas: 5 credits/seed
- Autocomplete: 2 credits/seed
- PAA/ATP: 1 credit/keyword
- SERP overview: 2 credits/keyword
- Rank tracking: 0.02 credits/keyword/check (~0.6/keyword/mo)
- Crawl fetch: 0.01 credits/URL (100 URLs = 1 credit)
- CWV check: 0.5 credits/URL
- Tech audit ruleset: 0.5 credits/100 URLs
- AI content brief: 10 credits/brief
- Meta suggestion: 0.2 credits/URL
- Keyword clustering: 2 credits/100 keywords
- Backlink lookup: 2 credits/domain or URL
- Content gap: 5 credits (1 target vs 3 comps)
- Competitor monitoring: 0.2 credits/domain/day
- Local SEO audit: 10 credits/location
- Bulk URL analyzer: 1 credit/100 URLs
- AI Overview check: 1 credit/keyword
- AI Overview optimization: 2 credits/keyword
- Scheduled report: 5 credits/report

## Implementation Steps

### Phase 1: Database Schema Updates

**File:** `supabase/migrations/20251031000000_new_pricing_system.sql`

1. **Update subscription_plans table:**

- Add columns: `max_seats`, `max_tracked_keywords_daily`, `max_crawl_urls_monthly`, `max_reports_monthly`, `crawl_concurrency`, `feature_flags` (JSONB)
- Replace old plans (Starter/Pro/Agency) with Launch/Growth/Agency/Scale
- Set credit wallets, project limits, seat limits per plan

2. **Enhance seo_projects table:**

- Add `country_code` (TEXT, default 'US')
- Add `locale` (TEXT, default 'en-US')
- Add `gsc_property_url` (link to GSC property)
- Update UNIQUE constraint to `(user_id, domain, country_code, locale)`
- Migration script to set existing projects to country='US'

3. **Create usage_meters table:**

- Track daily: `tracked_keywords`, `crawled_urls`, `briefs_generated`, `reports_rendered`
- Materialized daily per user_id
- Reset monthly

4. **Create seats table:**

- `user_id`, `seat_user_id` (the actual logged-in user), `created_at`
- Track unique active seats per subscription

5. **Create add_ons table:**

- `user_id`, `addon_type` (seats/projects/rank_pack/crawl_pack/credits/local_pack), `quantity`, `stripe_subscription_id`, `status`, `created_at`

6. **Create overage_events table:**

- Track when users hit 70%, 90%, 100%, 110% thresholds
- Send notifications and pause usage if needed

7. **Update user_subscriptions:**

- Add `seat_count` (cached count of active seats)
- Add `usage_last_reset_at` (for monthly usage meter resets)

### Phase 2: Credit Costs Update

**File:** `src/lib/credit-costs.ts`

Update all credit costs to match new rate card:

- Replace existing CREDIT_COSTS with new rates
- Update `getCreditCost()` to handle new feature keys
- Add functions for batch operations (bulk URLs, keyword sets)

### Phase 3: Feature Access System Update

**File:** `src/lib/feature-access.ts`

1. Update PlanName type to: `'Free' | 'Launch' | 'Growth' | 'Agency' | 'Scale'`
2. Update FEATURES array:

- Map features to correct plans (Launch vs Growth vs Agency)
- Update creditCost to match rate card
- Add feature_flags mapping (API access, white-label, etc.)

3. Update helper functions:

- `getFeaturesForPlan()` - return features for Launch/Growth/Agency/Scale
- `hasFeatureAccess()` - check plan hierarchy
- `getPlanName()` - handle "Starter" → "Launch", "Professional" → "Growth"

### Phase 4: Project Management Updates

**Files:**

- `src/pages/ProjectsPage.tsx`
- `src/hooks/useProjects.ts`
- Edge function for GSC property → project creation

1. **Update project creation form:**

- Add country/locale selector
- Auto-detect from GSC property if connected
- Validate: (domain + country + locale) uniqueness per user

2. **Update project fetching:**

- Include country_code and locale in queries
- Display projects as "example.com (US)" format
- Group by domain, show country badges

3. **GSC Integration:**

- When user connects GSC property, offer to create project
- Pre-fill domain, allow country selection (default US)
- Support multiple projects per GSC property (different countries)

### Phase 5: Trial System Update

**File:** `supabase/migrations/20251030000000_first_signin_trial.sql`

Update trial assignment:

- Change from "Starter" plan to "Launch" plan
- Set trial with Launch plan limits (1 seat, 3 projects, 1,200 credits)
- Update `handle_new_user()` function

### Phase 6: Stripe Integration Updates

**File:** `supabase/functions/stripe-checkout/index.ts`

1. **Update checkout session creation:**

- Handle new plan names (Launch, Growth, Agency, Scale)
- For Scale: require custom quote/contact form
- Pass correct metadata (plan_id, billing_cycle)
- Update success_url: `/dashboard?session_id={CHECKOUT_SESSION_ID}&plan=Launch`

2. **Add-ons support:**

- Create checkout for add-ons (seats, projects, rank packs, etc.)
- Pass `purchase_type: 'addon'` in metadata

**File:** `supabase/functions/stripe-webhook/index.ts`

1. **Update webhook handlers:**

- `checkout.session.completed`: Handle new plan names, set seat_count to 1 initially
- `customer.subscription.updated`: Update seat tracking if plan changed
- Add redirect logic: Check for `session_id` param, redirect to dashboard with success message

2. **Add-ons webhook:**

- Create handler for add-on subscriptions
- Update user limits (max_projects += 5, max_tracked_keywords += 1000, etc.)

### Phase 7: Pricing Page Updates

**Files:**

- `src/components/landing/PricingSection.tsx`
- `src/pages/PricingFullPage.tsx`

1. **Update plan display:**

- Replace Starter/Pro/Agency with Launch/Growth/Agency/Scale
- Show credit wallets, tracked keywords, crawl budgets, reports/month
- Show seat limits (with "Coming Soon" for team features)
- Highlight "Most Popular" on Growth plan

2. **Feature comparison table:**

- Use `getFeaturesForPlan()` from feature-access.ts
- Show checkmarks for included features
- Show plan requirements for locked features

3. **Add-ons section:**

- Display add-on packages (seats, projects, rank packs, crawl packs, credits, local packs)
- Pricing: $10/seat, $10/5 projects, $10/+1k keywords, etc.
- "Coming Soon" badge for team features

4. **Update CTAs:**

- All "Start Free Trial" buttons → redirect to `/auth` (Google sign-in)
- Scale plan → "Contact Sales" button

### Phase 8: Subscription Settings Updates

**File:** `src/components/settings/SubscriptionSettings.tsx`

1. **Current plan display:**

- Show Launch/Growth/Agency/Scale plan details
- Display credit wallet, remaining credits, usage meters
- Show seat count (1/1, 2/3, etc.)
- Show projects count (2/3, 5/10, etc.)

2. **Usage meters:**

- Tracked keywords: X/250 daily (Launch example)
- Crawled URLs: X/10,000 monthly
- Reports: X/5 monthly
- Show progress bars with overage warnings (70%, 90%, 100%)

3. **Upgrade options:**

- Quick upgrade buttons: Launch → Growth, Growth → Agency
- Direct Stripe checkout links
- Show plan comparison on hover

4. **Add-ons management:**

- List active add-ons
- Cancel add-on subscriptions
- Purchase new add-ons

### Phase 9: Credit Consumption Updates

**Files:**

- `src/lib/credit-costs.ts` (already updated)
- All feature usage points (keyword research, SERP analysis, etc.)

1. **Update all credit consumption calls:**

- Replace old credit costs with new rate card costs
- Add usage meter updates (tracked_keywords++, crawled_urls++, etc.)
- Check overage thresholds before consumption

2. **Overage checking:**

- Before consuming credits, check if at 70%, 90%, 100%
- Show warning alerts at 70% and 90%
- Pause usage at 110% (hard cap)
- Offer one-click top-up modal

3. **Usage meter updates:**

- After successful credit consumption:
- Update `usage_meters` table (tracked_keywords, crawled_urls, etc.)
- Check overage thresholds
- Send notifications if needed

### Phase 10: Seats Tracking

**File:** `supabase/migrations/20251031000001_seats_tracking.sql`

1. **Create function to check seat count:**

- `check_seat_availability(user_id)` → returns boolean
- Count active seats (logged in last 30 days)
- Enforce limit based on plan

2. **Update seat tracking on login:**

- On user login, insert/update `seats` table
- Check if seat limit exceeded
- Show warning if approaching limit

3. **Seats UI (Coming Soon):**

- Add "Team Management (Coming Soon)" section in settings
- Show current seat count vs limit
- Placeholder for team invitations (future)

### Phase 11: Feature Gating Updates

**File:** `src/components/FeatureGate.tsx`

1. **Update plan checks:**

- Replace "Starter/Pro" with "Launch/Growth"
- Update upgrade modal to show correct plan names and pricing

2. **Add usage limit checks:**

- Check tracked_keywords daily limit before rank tracking
- Check crawl budget before site crawl
- Check report limit before report generation

3. **Show allowances:**

- Display "You can track up to 250 keywords daily" type messages
- Show wallet view: "1,200 credits remaining"

### Phase 12: Migration & Testing

1. **Data migration:**

- Existing "Starter" → "Launch"
- Existing "Pro"/"Professional" → "Growth"
- Existing "Agency" → "Agency" (same name)
- Existing projects → add country_code='US', locale='en-US'

2. **Test scenarios:**

- User signs in first time → assigned Launch trial
- User upgrades Launch → Growth → Agency
- User purchases add-ons
- User hits overage thresholds
- User creates projects (domain × country)

## Files to Create/Modify

**New Files:**

- `supabase/migrations/20251031000000_new_pricing_system.sql`
- `supabase/migrations/20251031000001_seats_tracking.sql`
- `src/components/pricing/AddonsSection.tsx`
- `src/components/pricing/UsageMeters.tsx`
- `src/hooks/useAddons.ts`
- `src/hooks/useUsageMeters.ts`
- `src/lib/overage-policy.ts`

**Modify Files:**

- `supabase/migrations/20251030000000_first_signin_trial.sql` (update to Launch plan)
- `src/lib/credit-costs.ts` (complete rewrite)
- `src/lib/feature-access.ts` (update plans and features)
- `src/components/landing/PricingSection.tsx` (new plans, add-ons)
- `src/pages/PricingFullPage.tsx` (new plans, add-ons, usage meters)
- `src/components/settings/SubscriptionSettings.tsx` (usage meters, add-ons, seats)
- `src/components/FeatureGate.tsx` (update plan names)
- `src/pages/ProjectsPage.tsx` (add country/locale)
- `src/hooks/useProjects.ts` (handle country/locale)
- `supabase/functions/stripe-checkout/index.ts` (new plans, add-ons, redirects)
- `supabase/functions/stripe-webhook/index.ts` (new plans, redirects, add-ons)
- All feature consumption points (keyword research, SERP, crawl, etc.)