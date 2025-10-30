#!/bin/bash

echo "🚀 Deploying gemini-insights function..."

# Deploy the function
npx supabase functions deploy gemini-insights

echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Make sure GEMINI_API_KEY is set in Supabase Edge Function secrets"
echo "2. Test the function by opening the keyword modal on a query"
echo ""
echo "To set the Gemini API key:"
echo "npx supabase secrets set GEMINI_API_KEY=your_key_here"

