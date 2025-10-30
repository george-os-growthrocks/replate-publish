Write-Host "🚀 Deploying gsc-query function..." -ForegroundColor Cyan

npx supabase functions deploy gsc-query

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 To check logs:" -ForegroundColor Yellow
Write-Host "   npx supabase functions logs gsc-query" -ForegroundColor White
Write-Host ""
Write-Host "🔍 To test the function:" -ForegroundColor Yellow
Write-Host "   Check the browser console for detailed error messages" -ForegroundColor White

