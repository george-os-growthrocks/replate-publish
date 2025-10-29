# Debug: No Properties Found in GSC

## What I Fixed

Added better error handling to show you **exactly** what's failing when trying to load GSC properties.

Now when you click "Retry", check your browser console for these messages:
1. `Fetching GSC properties...`
2. `GSC response:` - Shows the actual response from the edge function
3. `Found properties:` - Shows the list of properties found (if any)

---

## Most Likely Issue: OAuth Token Not Stored

The `gsc-sites` edge function looks for your Google OAuth token in the `user_oauth_tokens` table, but it might not be there.

### Check if Table Exists

Run this in Supabase SQL Editor:

```sql
-- Check if user_oauth_tokens table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_oauth_tokens'
);

-- If it exists, check if you have tokens
SELECT 
  provider,
  created_at,
  expires_at,
  expires_at > NOW() as is_valid,
  access_token IS NOT NULL as has_token
FROM user_oauth_tokens
WHERE user_id = auth.uid();
```

---

## If Table Doesn't Exist: Create It

Run this SQL:

```sql
-- Create OAuth tokens table
CREATE TABLE IF NOT EXISTS public.user_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL, -- 'google', 'github', etc.
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT, -- OAuth scopes granted
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE public.user_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own tokens" ON user_oauth_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON user_oauth_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens" ON user_oauth_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_oauth_tokens_user_provider 
  ON user_oauth_tokens(user_id, provider);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_oauth_tokens TO authenticated;

-- Create trigger to auto-save OAuth tokens
CREATE OR REPLACE FUNCTION public.handle_oauth_tokens()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user signs in with OAuth, save the tokens
  IF NEW.raw_app_meta_data->>'provider' = 'google' THEN
    INSERT INTO public.user_oauth_tokens (
      user_id,
      provider,
      access_token,
      refresh_token,
      expires_at,
      scope
    ) VALUES (
      NEW.id,
      'google',
      NEW.raw_user_meta_data->>'provider_token',
      NEW.raw_user_meta_data->>'provider_refresh_token',
      NOW() + INTERVAL '1 hour',
      'https://www.googleapis.com/auth/webmasters.readonly'
    )
    ON CONFLICT (user_id, provider) 
    DO UPDATE SET
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_oauth_user_login ON auth.users;
CREATE TRIGGER on_oauth_user_login
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_oauth_tokens();
```

---

## Alternative: Use Session Provider Token

If the table setup is complex, I can modify the edge function to use the session's `provider_token` directly (which is what Supabase provides after OAuth).

The issue is that `provider_token` is only available immediately after OAuth and might not persist in the session.

---

## Test Steps

After creating the table and trigger:

1. **Sign out completely**
2. **Sign back in with Google**
3. **During onboarding, connect Google Search Console**
4. **Check if tokens are stored:**
   ```sql
   SELECT * FROM user_oauth_tokens WHERE user_id = auth.uid();
   ```
5. **Go to Step 3 and click "Retry"**
6. **Check browser console** for the error message

---

## Quick Fix: Do You Actually Have GSC Properties?

The most common issue: **You haven't added any properties to Google Search Console yet!**

**Check here:** https://search.google.com/search-console

**To add a property:**
1. Go to Google Search Console
2. Click "+ Add Property"
3. Enter your website URL (e.g., `https://anotherseoguru.com`)
4. Verify ownership (DNS, HTML tag, etc.)
5. Come back and click "Retry" in the onboarding

---

## What the Error Message Will Show

After my fix, when you click "Retry", you'll see:

**If token is missing:**
```
Error Details:
No Google access token available. Please sign out and sign in again with Google to grant access to Search Console.
```

**If GSC API fails:**
```
Error Details:
Google Search Console API error (401): Invalid Credentials
```

**If you really have no properties:**
```
(No error, just empty list)
```

---

## Next Steps

1. Run the SQL to create `user_oauth_tokens` table (if it doesn't exist)
2. Sign out and sign back in with Google
3. Click "Retry" on the properties step
4. Check browser console and tell me what error you see

The error message will tell us exactly what's wrong!
