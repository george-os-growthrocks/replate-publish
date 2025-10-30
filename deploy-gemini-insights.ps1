Write-Host "🚀 Deploying gemini-insights function..." -ForegroundColor Cyan

# Deploy the function
npx supabase functions deploy gemini-insights

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 The function now handles:" -ForegroundColor Yellow
Write-Host "   1. Keyword-specific insights (for the modal)" -ForegroundColor White
Write-Host "   2. Dashboard insights (returns empty for now)" -ForegroundColor White
Write-Host ""
Write-Host "To set the Gemini API key:" -ForegroundColor Yellow
Write-Host "   npx supabase secrets set GEMINI_API_KEY=your_key_here" -ForegroundColor White

