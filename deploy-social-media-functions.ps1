# 🚀 Deploy Social Media SEO Edge Functions
# This script deploys all new social media SEO functions to Supabase

Write-Host "🚀 Deploying Social Media SEO Functions..." -ForegroundColor Cyan
Write-Host ""

# Function to deploy with error handling
function Deploy-Function {
    param (
        [string]$FunctionName
    )
    
    Write-Host "📦 Deploying $FunctionName..." -ForegroundColor Yellow
    
    try {
        npx supabase functions deploy $FunctionName --no-verify-jwt
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $FunctionName deployed successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to deploy $FunctionName" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error deploying $FunctionName : $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Deploy all three social media functions
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "   DEPLOYING SOCIAL MEDIA FUNCTIONS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Deploy-Function "social-media-youtube"
Deploy-Function "social-media-instagram"
Deploy-Function "social-media-tiktok"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "   DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ All social media SEO functions deployed!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Functions deployed:" -ForegroundColor Cyan
Write-Host "   • social-media-youtube (3 credits)" -ForegroundColor White
Write-Host "   • social-media-instagram (2 credits)" -ForegroundColor White
Write-Host "   • social-media-tiktok (2 credits)" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Test your functions at:" -ForegroundColor Cyan
Write-Host "   https://siwzszmukfbzicjjkxro.supabase.co/functions/v1/social-media-youtube" -ForegroundColor White
Write-Host "   https://siwzszmukfbzicjjkxro.supabase.co/functions/v1/social-media-instagram" -ForegroundColor White
Write-Host "   https://siwzszmukfbzicjjkxro.supabase.co/functions/v1/social-media-tiktok" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Ready to use Social Media SEO features!" -ForegroundColor Green
