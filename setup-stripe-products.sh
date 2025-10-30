#!/bin/bash

# Stripe Products Setup Script
# This script creates all subscription plans in Stripe and updates your database

echo "🚀 Setting up Stripe Products and Prices..."
echo ""

# Check if Stripe secret key is set
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "❌ Error: STRIPE_SECRET_KEY environment variable not set"
    echo ""
    echo "Set it like this:"
    echo "  export STRIPE_SECRET_KEY=sk_test_..."
    echo ""
    echo "Get your key from: https://dashboard.stripe.com/apikeys"
    echo ""
    echo "⚠️  Use TEST key first: sk_test_..."
    echo "⚠️  Use LIVE key later: sk_live_..."
    exit 1
fi

# Check if it's a test key
if [[ $STRIPE_SECRET_KEY == sk_test_* ]]; then
    MODE="TEST"
    echo "🧪 Running in TEST mode"
elif [[ $STRIPE_SECRET_KEY == sk_live_* ]]; then
    MODE="LIVE"
    echo "🔴 Running in LIVE mode (BE CAREFUL!)"
else
    echo "❌ Invalid STRIPE_SECRET_KEY format"
    exit 1
fi

echo ""
echo "Creating products..."
echo ""

# Create Launch Plan
echo "📦 Creating Launch Plan..."
LAUNCH_PRODUCT=$(curl -s -X POST https://api.stripe.com/v1/products \
  -u $STRIPE_SECRET_KEY: \
  -d name="Launch Plan" \
  -d description="Perfect for Freelancers - Essential SEO tools to get started" \
  -d "metadata[plan_name]=Launch" \
  -d "metadata[features]=[\"Keyword Research & Ideas (50M+ database)\",\"Autocomplete Expansions\",\"PAA / Answer The Public\",\"Keyword Clustering (AI-powered)\",\"SERP Overview (top 10 analysis)\",\"Rank Tracking (250 keywords/day)\",\"1,200 credits per month\",\"3 projects\",\"1 team member\"]")

LAUNCH_PRODUCT_ID=$(echo $LAUNCH_PRODUCT | jq -r '.id')
echo "✅ Launch product created: $LAUNCH_PRODUCT_ID"

# Create Launch Monthly Price
LAUNCH_MONTHLY=$(curl -s -X POST https://api.stripe.com/v1/prices \
  -u $STRIPE_SECRET_KEY: \
  -d product=$LAUNCH_PRODUCT_ID \
  -d unit_amount=2900 \
  -d currency=usd \
  -d "recurring[interval]=month" \
  -d "recurring[trial_period_days]=7" \
  -d "metadata[plan_name]=Launch" \
  -d "metadata[billing_cycle]=monthly")

LAUNCH_MONTHLY_ID=$(echo $LAUNCH_MONTHLY | jq -r '.id')
echo "💵 Launch monthly price: $LAUNCH_MONTHLY_ID (\$29/month)"

# Create Launch Yearly Price
LAUNCH_YEARLY=$(curl -s -X POST https://api.stripe.com/v1/prices \
  -u $STRIPE_SECRET_KEY: \
  -d product=$LAUNCH_PRODUCT_ID \
  -d unit_amount=29000 \
  -d currency=usd \
  -d "recurring[interval]=year" \
  -d "recurring[trial_period_days]=7" \
  -d "metadata[plan_name]=Launch" \
  -d "metadata[billing_cycle]=yearly")

LAUNCH_YEARLY_ID=$(echo $LAUNCH_YEARLY | jq -r '.id')
echo "💵 Launch yearly price: $LAUNCH_YEARLY_ID (\$290/year)"

echo ""

# Create Growth Plan
echo "📦 Creating Growth Plan..."
GROWTH_PRODUCT=$(curl -s -X POST https://api.stripe.com/v1/products \
  -u $STRIPE_SECRET_KEY: \
  -d name="Growth Plan" \
  -d description="Most Popular - Everything freelancers need + team collaboration" \
  -d "metadata[plan_name]=Growth" \
  -d "metadata[features]=[\"Everything in Launch\",\"AI Content Briefs\",\"SERP Similarity Analysis\",\"Competitor Analysis\",\"Content Gap Discovery\",\"Backlink Lookups\",\"6,000 credits per month\",\"10 projects\",\"3 team members\"]")

GROWTH_PRODUCT_ID=$(echo $GROWTH_PRODUCT | jq -r '.id')
echo "✅ Growth product created: $GROWTH_PRODUCT_ID"

# Create Growth Monthly Price
GROWTH_MONTHLY=$(curl -s -X POST https://api.stripe.com/v1/prices \
  -u $STRIPE_SECRET_KEY: \
  -d product=$GROWTH_PRODUCT_ID \
  -d unit_amount=7900 \
  -d currency=usd \
  -d "recurring[interval]=month" \
  -d "metadata[plan_name]=Growth" \
  -d "metadata[billing_cycle]=monthly")

GROWTH_MONTHLY_ID=$(echo $GROWTH_MONTHLY | jq -r '.id')
echo "💵 Growth monthly price: $GROWTH_MONTHLY_ID (\$79/month)"

# Create Growth Yearly Price
GROWTH_YEARLY=$(curl -s -X POST https://api.stripe.com/v1/prices \
  -u $STRIPE_SECRET_KEY: \
  -d product=$GROWTH_PRODUCT_ID \
  -d unit_amount=79000 \
  -d currency=usd \
  -d "recurring[interval]=year" \
  -d "metadata[plan_name]=Growth" \
  -d "metadata[billing_cycle]=yearly")

GROWTH_YEARLY_ID=$(echo $GROWTH_YEARLY | jq -r '.id')
echo "💵 Growth yearly price: $GROWTH_YEARLY_ID (\$790/year)"

echo ""

# Create Agency Plan
echo "📦 Creating Agency Plan..."
AGENCY_PRODUCT=$(curl -s -X POST https://api.stripe.com/v1/products \
  -u $STRIPE_SECRET_KEY: \
  -d name="Agency Plan" \
  -d description="For Agencies - Scale your agency with automation & white-label" \
  -d "metadata[plan_name]=Agency" \
  -d "metadata[features]=[\"Everything in Growth\",\"White-Label Reports\",\"API Access (read)\",\"Competitor Monitoring (automated)\",\"Backlink Monitoring (continuous)\",\"AI Overview Optimization\",\"20,000 credits per month\",\"30 projects\",\"10 team members\"]")

AGENCY_PRODUCT_ID=$(echo $AGENCY_PRODUCT | jq -r '.id')
echo "✅ Agency product created: $AGENCY_PRODUCT_ID"

# Create Agency Monthly Price
AGENCY_MONTHLY=$(curl -s -X POST https://api.stripe.com/v1/prices \
  -u $STRIPE_SECRET_KEY: \
  -d product=$AGENCY_PRODUCT_ID \
  -d unit_amount=14900 \
  -d currency=usd \
  -d "recurring[interval]=month" \
  -d "metadata[plan_name]=Agency" \
  -d "metadata[billing_cycle]=monthly")

AGENCY_MONTHLY_ID=$(echo $AGENCY_MONTHLY | jq -r '.id')
echo "💵 Agency monthly price: $AGENCY_MONTHLY_ID (\$149/month)"

# Create Agency Yearly Price
AGENCY_YEARLY=$(curl -s -X POST https://api.stripe.com/v1/prices \
  -u $STRIPE_SECRET_KEY: \
  -d product=$AGENCY_PRODUCT_ID \
  -d unit_amount=149000 \
  -d currency=usd \
  -d "recurring[interval]=year" \
  -d "metadata[plan_name]=Agency" \
  -d "metadata[billing_cycle]=yearly")

AGENCY_YEARLY_ID=$(echo $AGENCY_YEARLY | jq -r '.id')
echo "💵 Agency yearly price: $AGENCY_YEARLY_ID (\$1,490/year)"

echo ""

# Create Scale Plan (Contact Sales - no prices)
echo "📦 Creating Scale Plan..."
SCALE_PRODUCT=$(curl -s -X POST https://api.stripe.com/v1/products \
  -u $STRIPE_SECRET_KEY: \
  -d name="Scale Plan" \
  -d description="Enterprise - Custom solutions for large organizations" \
  -d "metadata[plan_name]=Scale" \
  -d "metadata[features]=[\"Everything in Agency\",\"SSO/SAML Integration\",\"Custom Limits (contracted)\",\"Private Data Retention\",\"SLAs & DPAs\",\"Unlimited credits\",\"Custom projects\",\"Unlimited team members\"]")

SCALE_PRODUCT_ID=$(echo $SCALE_PRODUCT | jq -r '.id')
echo "✅ Scale product created: $SCALE_PRODUCT_ID (Contact Sales pricing)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 SQL to update your Supabase database:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "-- Update subscription_plans with Stripe IDs"
echo ""
echo "UPDATE subscription_plans"
echo "SET stripe_product_id = '$LAUNCH_PRODUCT_ID',"
echo "    stripe_price_id_monthly = '$LAUNCH_MONTHLY_ID',"
echo "    stripe_price_id_yearly = '$LAUNCH_YEARLY_ID'"
echo "WHERE name = 'Launch';"
echo ""
echo "UPDATE subscription_plans"
echo "SET stripe_product_id = '$GROWTH_PRODUCT_ID',"
echo "    stripe_price_id_monthly = '$GROWTH_MONTHLY_ID',"
echo "    stripe_price_id_yearly = '$GROWTH_YEARLY_ID'"
echo "WHERE name = 'Growth';"
echo ""
echo "UPDATE subscription_plans"
echo "SET stripe_product_id = '$AGENCY_PRODUCT_ID',"
echo "    stripe_price_id_monthly = '$AGENCY_MONTHLY_ID',"
echo "    stripe_price_id_yearly = '$AGENCY_YEARLY_ID'"
echo "WHERE name = 'Agency';"
echo ""
echo "UPDATE subscription_plans"
echo "SET stripe_product_id = '$SCALE_PRODUCT_ID',"
echo "    stripe_price_id_monthly = NULL,"
echo "    stripe_price_id_yearly = NULL"
echo "WHERE name = 'Scale';"
echo ""
echo "-- Verify the updates"
echo "SELECT name, stripe_product_id, stripe_price_id_monthly, stripe_price_id_yearly"
echo "FROM subscription_plans"
echo "WHERE name IN ('Launch', 'Growth', 'Agency', 'Scale')"
echo "ORDER BY name;"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Done! Copy the SQL above and run it in Supabase SQL Editor"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Copy and run the SQL above in Supabase SQL Editor"
echo "2. Test the payment flow with a test card: 4242 4242 4242 4242"
echo "3. Check Stripe Dashboard → Products to see your new products"
echo ""
echo "🎉 Your Stripe integration is now complete!"

