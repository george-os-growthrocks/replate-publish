#!/bin/bash

# Stripe Integration Deployment Script
# Run this script to deploy all Stripe integration fixes

set -e  # Exit on error

echo "🚀 Deploying Stripe Integration Fixes..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Run database migration
echo -e "${YELLOW}Step 1: Running database migration...${NC}"
supabase db push
echo -e "${GREEN}✅ Migration complete${NC}"
echo ""

# Step 2: Deploy edge functions
echo -e "${YELLOW}Step 2: Deploying edge functions...${NC}"
echo "Deploying gsc-query..."
supabase functions deploy gsc-query
echo "Deploying stripe-webhook..."
supabase functions deploy stripe-webhook
echo -e "${GREEN}✅ Functions deployed${NC}"
echo ""

# Step 3: Check environment variables
echo -e "${YELLOW}Step 3: Checking environment variables...${NC}"
echo "Listing current secrets..."
supabase secrets list
echo ""

echo -e "${YELLOW}⚠️  Make sure the following secrets are set:${NC}"
echo "  - GOOGLE_CLIENT_ID"
echo "  - GOOGLE_CLIENT_SECRET"
echo "  - STRIPE_SECRET_KEY"
echo "  - STRIPE_WEBHOOK_SECRET"
echo "  - SUPABASE_URL"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo ""

read -p "Are all required secrets set? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${RED}❌ Please set missing secrets and run again${NC}"
    echo ""
    echo "Set secrets with:"
    echo "  supabase secrets set GOOGLE_CLIENT_ID=<value>"
    echo "  supabase secrets set GOOGLE_CLIENT_SECRET=<value>"
    exit 1
fi
echo ""

# Step 4: Test functions
echo -e "${YELLOW}Step 4: Testing function deployment...${NC}"
echo "Checking gsc-query function..."
supabase functions list | grep gsc-query
echo "Checking stripe-webhook function..."
supabase functions list | grep stripe-webhook
echo -e "${GREEN}✅ Functions are active${NC}"
echo ""

# Done
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Stripe Integration Deployment Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Next steps:"
echo "1. Configure Stripe webhook in Stripe Dashboard:"
echo "   URL: https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook"
echo "   Events: checkout.session.completed, customer.subscription.*"
echo ""
echo "2. Test the integration:"
echo "   - Sign up a new user"
echo "   - Complete a test payment"
echo "   - Check logs: supabase functions logs stripe-webhook --follow"
echo ""
echo "3. Monitor for issues:"
echo "   - Check Supabase logs"
echo "   - Check Stripe Dashboard webhooks"
echo "   - Verify database sync"
echo ""
echo "📖 See STRIPE_INTEGRATION_COMPLETE.md for detailed testing guide"
echo ""

