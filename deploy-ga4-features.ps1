# 🚀 Deploy Google Analytics 4 Integration
# This script deploys all GA4 features: database migrations + edge functions

Write-Host "🚀 Deploying Google Analytics 4 Integration..." -ForegroundColor Cyan
Write-Host ""

# Function to deploy with error handling
function Deploy-Step {
    param (
        [string]$StepName,
        [scriptblock]$Command
    )
    
    Write-Host "📦 $StepName..." -ForegroundColor Yellow
    
    try {
        & $Command
        
        if ($LASTEXITCODE -eq 0 -or $? -eq $true) {
            Write-Host "✅ $StepName completed!" -ForegroundColor Green
        } else {
            Write-Host "❌ $StepName failed!" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Error in $StepName : $_" -ForegroundColor Red
        return $false
    }
    
    Write-Host ""
    return $true
}

# Step 1: Run database migrations
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "   STEP 1: DATABASE MIGRATIONS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Write-Host "Running SQL migration for GA4 tables..." -ForegroundColor Yellow
Write-Host "⚠️  Please run this SQL in your Supabase Dashboard:" -ForegroundColor Yellow
Write-Host ""
Write-Host "File: supabase/migrations/20250129000000_google_analytics_tables.sql" -ForegroundColor White
Write-Host ""
Write-Host "Press ENTER after you've run the migration..." -ForegroundColor Cyan
$null = Read-Host

# Step 2: Deploy edge functions
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "   STEP 2: EDGE FUNCTIONS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$success = Deploy-Step "Deploying ga4-list-properties" {
    npx supabase functions deploy ga4-list-properties --no-verify-jwt
}

if ($success) {
    $success = Deploy-Step "Deploying ga4-fetch-report" {
        npx supabase functions deploy ga4-fetch-report --no-verify-jwt
    }
}

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
if ($success) {
    Write-Host "   ✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  DEPLOYMENT HAD ERRORS" -ForegroundColor Yellow
}
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

if ($success) {
    Write-Host "✅ GA4 Integration deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Functions deployed:" -ForegroundColor Cyan
    Write-Host "   • ga4-list-properties - Lists user's GA4 properties" -ForegroundColor White
    Write-Host "   • ga4-fetch-report - Fetches GA4 analytics data" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 Access at:" -ForegroundColor Cyan
    Write-Host "   /analytics-dashboard in your app" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Users need to connect Google Analytics in Settings" -ForegroundColor White
    Write-Host "   2. They can then select their GA4 property" -ForegroundColor White
    Write-Host "   3. View analytics data (costs 2-3 credits per report)" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 Ready to use GA4 Analytics!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Please fix errors and try again" -ForegroundColor Yellow
}
