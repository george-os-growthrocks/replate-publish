# DataForSEO Edge Functions Deployment Script (PowerShell)
# Usage: .\deploy-dataforseo.ps1

Write-Host "🚀 Deploying DataForSEO Edge Functions to Supabase..." -ForegroundColor Cyan
Write-Host ""

# Check if logged in to Supabase
Write-Host "📋 Checking Supabase login status..." -ForegroundColor Yellow
$loginCheck = npx supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Supabase. Please run: npx supabase login" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Supabase CLI ready" -ForegroundColor Green
Write-Host ""

# Deploy functions
Write-Host "1️⃣ Deploying dataforseo-serp..." -ForegroundColor Yellow
npx supabase functions deploy dataforseo-serp
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ dataforseo-serp deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy dataforseo-serp" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "2️⃣ Deploying dataforseo-keywords..." -ForegroundColor Yellow
npx supabase functions deploy dataforseo-keywords
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ dataforseo-keywords deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy dataforseo-keywords" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "3️⃣ Deploying dataforseo-onpage..." -ForegroundColor Yellow
npx supabase functions deploy dataforseo-onpage
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ dataforseo-onpage deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy dataforseo-onpage" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "4️⃣ Deploying dataforseo-backlinks..." -ForegroundColor Yellow
npx supabase functions deploy dataforseo-backlinks
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ dataforseo-backlinks deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy dataforseo-backlinks" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "🎉 All DataForSEO functions deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Set environment variables in Supabase Dashboard:"
Write-Host "   → Project Settings → Edge Functions → Secrets"
Write-Host "   → Add: DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD"
Write-Host ""
Write-Host "2. Test functions in Supabase Dashboard:"
Write-Host "   → Edge Functions → Select function → Invoke"
Write-Host ""
Write-Host "3. Start using in your app:"
Write-Host "   → Import hooks from @/hooks/useDataForSEO"
Write-Host "   → Import scoring from @/lib/seo-scoring"
Write-Host ""
Write-Host "📚 See DATAFORSEO_SETUP.md for detailed instructions" -ForegroundColor Yellow

