# Add PageSpeed API Key to Supabase Secrets

Write-Host "🔐 Adding PageSpeed API Key to Supabase Secrets..." -ForegroundColor Cyan
Write-Host ""

$API_KEY = "AIzaSyAbdoE6zu4BoxU_-Bv2zLUljpMzWDSbkfQ"

Write-Host "Running command..." -ForegroundColor Yellow
npx supabase secrets set PAGESPEED_API=$API_KEY

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ PageSpeed API key added to Supabase secrets!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 The key is now available to your edge functions via:" -ForegroundColor Cyan
    Write-Host "   Deno.env.get('PAGESPEED_API')" -ForegroundColor White
    Write-Host ""
    Write-Host "🔄 Edge functions will automatically use this key" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Failed to add secret" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternative: Add manually in Supabase Dashboard" -ForegroundColor Yellow
    Write-Host "   https://supabase.com/dashboard/project/siwzszmukfbzicjjkxro/settings/vault" -ForegroundColor White
}
