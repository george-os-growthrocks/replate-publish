# Deploy Industry Profile Training & Updated Pricing System
# This script deploys the new database migrations and features

Write-Host "🚀 Deploying Industry Profile Training & Updated Pricing..." -ForegroundColor Cyan

# Load environment variables
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

$SUPABASE_PROJECT_ID = $env:SUPABASE_PROJECT_ID
$SUPABASE_DB_PASSWORD = $env:SUPABASE_DB_PASSWORD

if (-not $SUPABASE_PROJECT_ID -or -not $SUPABASE_DB_PASSWORD) {
    Write-Host "❌ Missing SUPABASE_PROJECT_ID or SUPABASE_DB_PASSWORD in .env file" -ForegroundColor Red
    exit 1
}

# Database connection string
$DB_URL = "postgresql://postgres:$SUPABASE_DB_PASSWORD@db.$SUPABASE_PROJECT_ID.supabase.co:5432/postgres"

Write-Host "`n📦 Step 1: Running migration 20251029000000_industry_profile_training.sql..." -ForegroundColor Yellow
$migration1 = Get-Content "supabase/migrations/20251029000000_industry_profile_training.sql" -Raw
$env:PGPASSWORD = $SUPABASE_DB_PASSWORD
psql $DB_URL -c $migration1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Industry Profile Training migration completed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Industry Profile Training migration failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n📦 Step 2: Running migration 20251029000001_updated_pricing_and_credits.sql..." -ForegroundColor Yellow
$migration2 = Get-Content "supabase/migrations/20251029000001_updated_pricing_and_credits.sql" -Raw
psql $DB_URL -c $migration2

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Updated Pricing & Credits migration completed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Updated Pricing & Credits migration failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "`nWhat's New:" -ForegroundColor Cyan
Write-Host "  ✅ Industry-specific business profile training system" -ForegroundColor White
Write-Host "  ✅ Updated subscription pricing: Starter \$29, Pro \$79, Agency \$149, Enterprise \$299" -ForegroundColor White
Write-Host "  ✅ Unlimited credits configured for kasiotisg@gmail.com" -ForegroundColor White
Write-Host "  ✅ Individual feature packages (ATP Unlimited \$19, AI Briefs \$29, etc.)" -ForegroundColor White
Write-Host "  ✅ Credit packages for one-time purchases" -ForegroundColor White
Write-Host "  ✅ Business insights and recommendations system" -ForegroundColor White
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "  1. Create industry profiling UI components" -ForegroundColor White
Write-Host "  2. Update Stripe checkout to support new pricing" -ForegroundColor White
Write-Host "  3. Build business insights dashboard" -ForegroundColor White
Write-Host "  4. Test the complete system" -ForegroundColor White
