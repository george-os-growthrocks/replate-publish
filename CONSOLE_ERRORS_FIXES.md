# Console Errors - Diagnosis & Fixes

## Errors Identified

```
1. 406 on user_credits?select=*&user_id=eq.xxx
2. 403 on user_credits?select=*
3. 400 on gsc-query (No Google access token)
4. 400 on Gemini API (Chat error)
```

---

## 1. User Credits 406/403 Errors ❌

### Problem
The frontend is trying to query `user_credits` table directly using REST API, but:
- **406 Error**: Missing proper Accept header or content negotiation failure
- **403 Error**: Row Level Security (RLS) policy blocking access

### Root Cause
Looking at `src/hooks/useSubscription.ts` line 90-94:
```typescript
const { data, error } = await supabase
  .from('user_credits')
  .select('*')
  .eq('user_id', user.id)
  .single();
```

This tries to access the table directly, but the RLS policies may not be configured properly.

### Fix Required
**Option 1: Fix RLS Policies (Recommended)**

Run this SQL in Supabase SQL Editor:

```sql
-- Enable RLS on user_credits if not already enabled
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can insert their own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can update their own credits" ON user_credits;

-- Create proper RLS policies
CREATE POLICY "Users can view their own credits"
ON user_credits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all credits"
ON user_credits FOR ALL
USING (auth.role() = 'service_role');

-- Grant access
GRANT SELECT, INSERT, UPDATE ON user_credits TO authenticated;
GRANT ALL ON user_credits TO service_role;
```

**Option 2: Use RPC Function (Alternative)**

Create a Supabase function to fetch credits:

```sql
CREATE OR REPLACE FUNCTION get_user_credits()
RETURNS TABLE (
  user_id UUID,
  total_credits INTEGER,
  used_credits INTEGER,
  available_credits INTEGER,
  last_reset_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uc.user_id,
    uc.total_credits,
    uc.used_credits,
    uc.available_credits,
    uc.last_reset_at
  FROM user_credits uc
  WHERE uc.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Then update `useSubscription.ts`:
```typescript
const { data, error } = await supabase.rpc('get_user_credits');
```

---

## 2. GSC Query 400 Error (No Google Access Token) ❌

### Problem
```
No Google access token available. Please sign out and sign in again with Google to grant access to Search Console.
```

### Root Cause
The OAuth token is not being stored or retrieved properly after Google sign-in.

### Diagnosis Steps
1. Check if user is signed in with Google (not email)
2. Check if `provider_token` exists in session
3. Check if OAuth token is stored in `user_oauth_tokens` table

### Fix Required

**Step 1: Verify OAuth Configuration**

Check Supabase Dashboard → Authentication → Providers → Google:
- ✅ Google provider enabled
- ✅ Scopes include: `https://www.googleapis.com/auth/webmasters.readonly`
- ✅ Redirect URL configured

**Step 2: Add OAuth Token Storage**

The `gsc-query` function checks for stored tokens (lines 42-67), but the token might not be stored after sign-in.

Update the sign-in flow to store the OAuth token in `user_oauth_tokens` table.

**Step 3: Re-authenticate**

The user needs to:
1. Sign out completely
2. Sign in with Google again
3. Grant Search Console permissions

**Quick Fix for Testing:**

Add this to your frontend after successful Google sign-in:

```typescript
// After Google sign-in success
const { data: { session } } = await supabase.auth.getSession();

if (session?.provider_token) {
  // Store the OAuth token
  await supabase.from('user_oauth_tokens').upsert({
    user_id: session.user.id,
    provider: 'google',
    access_token: session.provider_token,
    expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour
  });
}
```

---

## 3. Gemini API 400 Error (Chat) ❌

### Problem
```
💥 Chat error: Error: Gemini API error: 400
```

### Root Cause
The Gemini API is returning a 400 error, which could be due to:
1. Invalid API key
2. Missing or malformed request body
3. Tools definition causing issues
4. Rate limiting

### Fix Required

**Step 1: Check Gemini API Key**

Verify in Supabase Dashboard → Edge Functions → Secrets:
```
GEMINI_API_KEY=your-key-here
```

**Step 2: Check seo-ai-chat Function**

The function is trying to call Gemini with tools, but might be sending invalid data.

Update `supabase/functions/seo-ai-chat/index.ts` to add better error logging:

```typescript
// Before calling Gemini API
console.log('📤 Gemini request:', JSON.stringify({
  contents: chatHistory,
  tools: tools,
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2048,
  }
}, null, 2));

const response = await fetch(geminiUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    contents: chatHistory,
    tools: tools,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  }),
});

console.log('📥 Gemini response status:', response.status);

if (!response.ok) {
  const errorText = await response.text();
  console.error('❌ Gemini error response:', errorText);
  throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
}
```

**Step 3: Verify Tools Definition**

The tools might have invalid schema. Check `_tools.ts` for any schema issues.

**Temporary Workaround:**

Comment out the tools temporarily to test if that's the issue:

```typescript
body: JSON.stringify({
  contents: chatHistory,
  // tools: tools, // Comment out temporarily
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2048,
  },
}),
```

---

## 4. Recommended Immediate Actions

### Priority 1: Fix RLS Policies (Critical) 🔥

Run the SQL commands from Fix #1 to enable proper access to `user_credits`.

### Priority 2: Re-authenticate with Google (Critical) 🔥

1. Sign out
2. Sign in with Google
3. Grant Search Console permissions
4. Verify `provider_token` exists in session

### Priority 3: Check Gemini API Key (High) ⚠️

Verify the Gemini API key is configured and valid.

### Priority 4: Add Error Logging (Medium) 📝

Add detailed logging to see what's being sent to Gemini API.

---

## Testing Steps

After applying fixes:

1. **Test Credits Query:**
   ```javascript
   const { data, error } = await supabase
     .from('user_credits')
     .select('*')
     .eq('user_id', user.id)
     .single();
   console.log('Credits:', data, error);
   ```

2. **Test GSC Query:**
   ```javascript
   const { data, error } = await supabase.functions.invoke('gsc-query', {
     body: {
       siteUrl: 'https://yoursite.com',
       startDate: '2024-01-01',
       endDate: '2024-01-31',
       dimensions: ['query'],
     },
   });
   console.log('GSC:', data, error);
   ```

3. **Test Chat:**
   ```javascript
   const { data, error } = await supabase.functions.invoke('seo-ai-chat', {
     body: {
       message: 'Hello',
       chatHistory: [],
     },
   });
   console.log('Chat:', data, error);
   ```

---

## Quick Fix SQL Script

Run this in Supabase SQL Editor:

```sql
-- Fix user_credits RLS
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own credits" ON user_credits;
DROP POLICY IF EXISTS "Service role can manage all credits" ON user_credits;

CREATE POLICY "Users can view their own credits"
ON user_credits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all credits"
ON user_credits FOR ALL
USING (auth.role() = 'service_role');

GRANT SELECT, INSERT, UPDATE ON user_credits TO authenticated;
GRANT ALL ON user_credits TO service_role;

-- Verify
SELECT * FROM user_credits WHERE user_id = auth.uid();
```

---

## Environment Variables Checklist

Verify these are set in Supabase Dashboard → Edge Functions → Secrets:

- ✅ `GEMINI_API_KEY` - For AI chat
- ✅ `DATAFORSEO_LOGIN` - For keyword analysis
- ✅ `DATAFORSEO_PASSWORD` - For keyword analysis
- ✅ `FIRECRAWL_API_KEY` - For site audits
- ✅ `STRIPE_SECRET_KEY` - For payments (YOU NEED TO ADD THIS!)
- ✅ `STRIPE_WEBHOOK_SECRET` - For webhook verification

---

## Summary

**3 Critical Issues:**
1. ❌ RLS policies not configured for user_credits → Run SQL fix
2. ❌ OAuth token not available → Re-authenticate with Google
3. ❌ Gemini API error → Check API key and add logging

**Next Steps:**
1. Run the SQL script above
2. Sign out and sign in with Google
3. Check Gemini API key configuration
4. Test each function individually

Once these are fixed, all errors should be resolved! 🎯

