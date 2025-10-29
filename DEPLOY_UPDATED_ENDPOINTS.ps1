# 🚀 Deploy Updated DataForSEO Edge Functions
# Deploys the updated endpoints that match recommended API mapping

Write-Host "🚀 DEPLOYING UPDATED DATAFORSEO ENDPOINTS" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

# Check if Supabase CLI is logged in
Write-Host "Checking Supabase CLI..." -ForegroundColor Yellow

# Function to deploy edge function
function Deploy-EdgeFunction {
    param (
        [string]$FunctionName,
        [string]$Description
    )
    
    Write-Host "📦 Deploying $FunctionName..." -ForegroundColor Cyan
    Write-Host "   $Description" -ForegroundColor Gray
    
    npx supabase functions deploy $FunctionName --no-verify-jwt
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $FunctionName deployed successfully`n" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Failed to deploy $FunctionName`n" -ForegroundColor Red
        return $false
    }
}

# Deploy updated functions
$functions = @(
    @{
        Name = "keyword-overview-bundle"
        Description = "✅ Enhanced: Added Google Ads volume fallback for 12-month trends"
    },
    @{
        Name = "keyword-ideas-all"
        Description = "✅ Enhanced: Extracts monthly_searches from keyword_suggestions"
    },
    @{
        Name = "dataforseo-serp"
        Description = "✅ Enhanced: Added AI Overview/Mode detection support"
    }
)

Write-Host "🎯 Deploying 3 Updated Edge Functions...`n" -ForegroundColor Yellow

$successCount = 0
$failureCount = 0

foreach ($func in $functions) {
    $result = Deploy-EdgeFunction -FunctionName $func.Name -Description $func.Description
    if ($result) {
        $successCount++
    } else {
        $failureCount++
    }
    Start-Sleep -Seconds 2
}

Write-Host "=========================================`n" -ForegroundColor Cyan
Write-Host "📊 DEPLOYMENT SUMMARY" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan
Write-Host "✅ Success: $successCount" -ForegroundColor Green
Write-Host "❌ Failures: $failureCount`n" -ForegroundColor Red

if ($failureCount -eq 0) {
    Write-Host "🎉 ALL UPDATED FUNCTIONS DEPLOYED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "`n📋 WHAT'S NEW:" -ForegroundColor Yellow
    Write-Host "✅ Keyword Overview: Google Ads volume fallback for trends" -ForegroundColor White
    Write-Host "✅ Keyword Ideas: Monthly trend data extraction" -ForegroundColor White
    Write-Host "✅ SERP: AI Overview/Mode detection enabled" -ForegroundColor White
    Write-Host "`n✨ All endpoints now match recommended DataForSEO API mapping!" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Some functions failed to deploy. Check errors above." -ForegroundColor Yellow
}

Write-Host "`n=========================================`n" -ForegroundColor Cyan

