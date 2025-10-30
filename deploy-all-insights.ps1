Write-Host "🚀 Deploying ALL insights functions..." -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣ Deploying gemini-insights (for SEO Report / Dashboard)..." -ForegroundColor Yellow
npx supabase functions deploy gemini-insights

Write-Host ""
Write-Host "2️⃣ Deploying keyword-insights (for Keyword Modal)..." -ForegroundColor Yellow
npx supabase functions deploy keyword-insights

Write-Host ""
Write-Host "✅ All deployments complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Functions:" -ForegroundColor Yellow
Write-Host "   • gemini-insights: For SEO Report page insights" -ForegroundColor White
Write-Host "   • keyword-insights: For per-keyword modal insights" -ForegroundColor White
Write-Host ""
Write-Host "🔑 To enable full AI insights, set Gemini API key:" -ForegroundColor Yellow
Write-Host "   npx supabase secrets set GEMINI_API_KEY=your_key_here" -ForegroundColor White

