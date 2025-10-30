#!/bin/bash

# Quick Stripe Products Creation
# Usage: STRIPE_SECRET_KEY=sk_test_... bash create-products-quick.sh

if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "❌ Error: Set STRIPE_SECRET_KEY environment variable first"
    echo "Example: STRIPE_SECRET_KEY=sk_test_YOUR_KEY bash create-products-quick.sh"
    exit 1
fi

echo "🚀 Creating Stripe products..."

# Launch Plan
echo "📦 Launch Plan..."
LP=$(curl -s -X POST https://api.stripe.com/v1/products -u $STRIPE_SECRET_KEY: -d name="Launch Plan" -d description="Essential SEO tools")
LP_ID=$(echo $LP | jq -r '.id')
LPM=$(curl -s -X POST https://api.stripe.com/v1/prices -u $STRIPE_SECRET_KEY: -d product=$LP_ID -d unit_amount=2900 -d currency=usd -d "recurring[interval]=month" -d "recurring[trial_period_days]=7")
LPM_ID=$(echo $LPM | jq -r '.id')
LPY=$(curl -s -X POST https://api.stripe.com/v1/prices -u $STRIPE_SECRET_KEY: -d product=$LP_ID -d unit_amount=29000 -d currency=usd -d "recurring[interval]=year" -d "recurring[trial_period_days]=7")
LPY_ID=$(echo $LPY | jq -r '.id')

# Growth Plan
echo "📦 Growth Plan..."
GP=$(curl -s -X POST https://api.stripe.com/v1/products -u $STRIPE_SECRET_KEY: -d name="Growth Plan" -d description="Everything freelancers need")
GP_ID=$(echo $GP | jq -r '.id')
GPM=$(curl -s -X POST https://api.stripe.com/v1/prices -u $STRIPE_SECRET_KEY: -d product=$GP_ID -d unit_amount=7900 -d currency=usd -d "recurring[interval]=month")
GPM_ID=$(echo $GPM | jq -r '.id')
GPY=$(curl -s -X POST https://api.stripe.com/v1/prices -u $STRIPE_SECRET_KEY: -d product=$GP_ID -d unit_amount=79000 -d currency=usd -d "recurring[interval]=year")
GPY_ID=$(echo $GPY | jq -r '.id')

# Agency Plan
echo "📦 Agency Plan..."
AP=$(curl -s -X POST https://api.stripe.com/v1/products -u $STRIPE_SECRET_KEY: -d name="Agency Plan" -d description="Scale your agency")
AP_ID=$(echo $AP | jq -r '.id')
APM=$(curl -s -X POST https://api.stripe.com/v1/prices -u $STRIPE_SECRET_KEY: -d product=$AP_ID -d unit_amount=14900 -d currency=usd -d "recurring[interval]=month")
APM_ID=$(echo $APM | jq -r '.id')
APY=$(curl -s -X POST https://api.stripe.com/v1/prices -u $STRIPE_SECRET_KEY: -d product=$AP_ID -d unit_amount=149000 -d currency=usd -d "recurring[interval]=year")
APY_ID=$(echo $APY | jq -r '.id')

# Scale Plan (no prices - contact sales)
echo "📦 Scale Plan..."
SP=$(curl -s -X POST https://api.stripe.com/v1/products -u $STRIPE_SECRET_KEY: -d name="Scale Plan" -d description="Enterprise solutions")
SP_ID=$(echo $SP | jq -r '.id')

echo ""
echo "📝 Copy this SQL to Supabase SQL Editor:"
echo ""
echo "-- Update subscription_plans with Stripe IDs"
echo ""
echo "UPDATE subscription_plans SET stripe_product_id = '$LP_ID', stripe_price_id_monthly = '$LPM_ID', stripe_price_id_yearly = '$LPY_ID' WHERE name = 'Launch';"
echo "UPDATE subscription_plans SET stripe_product_id = '$GP_ID', stripe_price_id_monthly = '$GPM_ID', stripe_price_id_yearly = '$GPY_ID' WHERE name = 'Growth';"
echo "UPDATE subscription_plans SET stripe_product_id = '$AP_ID', stripe_price_id_monthly = '$APM_ID', stripe_price_id_yearly = '$APY_ID' WHERE name = 'Agency';"
echo "UPDATE subscription_plans SET stripe_product_id = '$SP_ID', stripe_price_id_monthly = NULL, stripe_price_id_yearly = NULL WHERE name = 'Scale';"
echo ""
echo "SELECT name, stripe_product_id, stripe_price_id_monthly, stripe_price_id_yearly FROM subscription_plans WHERE name IN ('Launch', 'Growth', 'Agency', 'Scale') ORDER BY name;"
echo ""
echo "✅ Done! Run the SQL above in Supabase."
