# 🚀 Deploy ALL Keyword Explorer Edge Functions
# Complete Ahrefs-style Keywords Explorer deployment

Write-Host "🚀 DEPLOYING COMPLETE KEYWORD EXPLORER" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

# Check if Supabase CLI is logged in
Write-Host "Checking Supabase CLI..." -ForegroundColor Yellow
$supabaseStatus = npx supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Supabase CLI" -ForegroundColor Red
    Write-Host "Run: npx supabase login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase CLI ready`n" -ForegroundColor Green

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
    } else {
        Write-Host "❌ Failed to deploy $FunctionName`n" -ForegroundColor Red
        return $false
    }
    
    return $true
}

# Deploy all 5 edge functions
$functions = @(
    @{
        Name = "keyword-overview-bundle"
        Description = "KD + SV + CPC + History + Intent (3 API calls)"
    },
    @{
        Name = "keyword-ideas-all"
        Description = "Matching + Related + Questions + Autocomplete (3 API calls)"
    },
    @{
        Name = "serp-enriched"
        Description = "SERP + Backlinks + Traffic + Authority Score (1 + 20 API calls)"
    },
    @{
        Name = "traffic-potential"
        Description = "TP calculation + Parent Topic from ranked keywords (1 API call)"
    },
    @{
        Name = "position-history"
        Description = "Historical SERP tracking over time (1 API call)"
    }
)

Write-Host "🎯 Deploying 5 Edge Functions...`n" -ForegroundColor Yellow

$successCount = 0
$failureCount = 0

foreach ($func in $functions) {
    $result = Deploy-EdgeFunction -FunctionName $func.Name -Description $func.Description
    if ($result) {
        $successCount++
    } else {
        $failureCount++
    }
    Start-Sleep -Seconds 1
}

Write-Host "=========================================`n" -ForegroundColor Cyan
Write-Host "📊 DEPLOYMENT SUMMARY" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan
Write-Host "✅ Success: $successCount" -ForegroundColor Green
Write-Host "❌ Failures: $failureCount`n" -ForegroundColor Red

if ($failureCount -eq 0) {
    Write-Host "🎉 ALL EDGE FUNCTIONS DEPLOYED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "`n📋 NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "1. Ensure DataForSEO credentials are in Supabase secrets:" -ForegroundColor White
    Write-Host "   - DATAFORSEO_LOGIN" -ForegroundColor Gray
    Write-Host "   - DATAFORSEO_PASSWORD" -ForegroundColor Gray
    Write-Host "`n2. Run your development server:" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor Gray
    Write-Host "`n3. Visit the Keywords Explorer:" -ForegroundColor White
    Write-Host "   http://localhost:8080/keyword-research" -ForegroundColor Gray
    Write-Host "`n4. Search for a keyword and enjoy Ahrefs-style features! 🎯" -ForegroundColor White
    Write-Host "`n📚 See KEYWORD_EXPLORER_COMPLETE.md for usage guide" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Some functions failed to deploy. Check errors above." -ForegroundColor Yellow
    Write-Host "Try deploying failed functions individually:" -ForegroundColor White
    Write-Host "npx supabase functions deploy <function-name> --no-verify-jwt" -ForegroundColor Gray
}

Write-Host "`n=========================================`n" -ForegroundColor Cyan
