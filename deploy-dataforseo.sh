#!/bin/bash

# DataForSEO Edge Functions Deployment Script
# Usage: ./deploy-dataforseo.sh

echo "🚀 Deploying DataForSEO Edge Functions to Supabase..."
echo ""

# Check if supabase CLI is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js first."
    exit 1
fi

# Check if logged in to Supabase
echo "📋 Checking Supabase login status..."
npx supabase projects list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Not logged in to Supabase. Please run: npx supabase login"
    exit 1
fi

echo "✅ Supabase CLI ready"
echo ""

# Deploy functions
echo "1️⃣ Deploying dataforseo-serp..."
npx supabase functions deploy dataforseo-serp
if [ $? -eq 0 ]; then
    echo "✅ dataforseo-serp deployed successfully"
else
    echo "❌ Failed to deploy dataforseo-serp"
    exit 1
fi
echo ""

echo "2️⃣ Deploying dataforseo-keywords..."
npx supabase functions deploy dataforseo-keywords
if [ $? -eq 0 ]; then
    echo "✅ dataforseo-keywords deployed successfully"
else
    echo "❌ Failed to deploy dataforseo-keywords"
    exit 1
fi
echo ""

echo "3️⃣ Deploying dataforseo-onpage..."
npx supabase functions deploy dataforseo-onpage
if [ $? -eq 0 ]; then
    echo "✅ dataforseo-onpage deployed successfully"
else
    echo "❌ Failed to deploy dataforseo-onpage"
    exit 1
fi
echo ""

echo "4️⃣ Deploying dataforseo-backlinks..."
npx supabase functions deploy dataforseo-backlinks
if [ $? -eq 0 ]; then
    echo "✅ dataforseo-backlinks deployed successfully"
else
    echo "❌ Failed to deploy dataforseo-backlinks"
    exit 1
fi
echo ""

echo "🎉 All DataForSEO functions deployed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Set environment variables in Supabase Dashboard:"
echo "   → Project Settings → Edge Functions → Secrets"
echo "   → Add: DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD"
echo ""
echo "2. Test functions in Supabase Dashboard:"
echo "   → Edge Functions → Select function → Invoke"
echo ""
echo "3. Start using in your app:"
echo "   → Import hooks from @/hooks/useDataForSEO"
echo "   → Import scoring from @/lib/seo-scoring"
echo ""
echo "📚 See DATAFORSEO_SETUP.md for detailed instructions"

