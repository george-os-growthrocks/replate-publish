$sql = Get-Content "supabase\migrations\20250129000000_auto_free_plan.sql" -Raw

Write-Host "Running SQL migration..."
Write-Host $sql

# Note: You need to run this SQL in Supabase SQL Editor manually
# Or use: npx supabase db remote commit
Write-Host "`n`nCopy the SQL above and run it in Supabase SQL Editor: https://supabase.com/dashboard/project/siwzszmukfbzicjjkxro/sql/new"
