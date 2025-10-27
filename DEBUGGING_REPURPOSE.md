# Debugging Repurpose Function - Complete Guide

## ✅ What I Just Fixed

### Enhanced Error Logging in `gemini-repurpose` Function

**Deployment Status:** ✅ Deployed (Version 3)

### Changes Made:

1. **Added Comprehensive Console Logging:**
   ```typescript
   - "=== Gemini Repurpose Function Started ==="
   - Session verification logs
   - Request body parsing logs
   - Platform-by-platform generation logs
   - Gemini API response status logs
   - Success/failure logs for each platform
   - "=== Generation Complete ===" summary
   ```

2. **Better Error Handling:**
   - Return proper HTTP status codes (401, 400, 500)
   - Include CORS headers in ALL responses
   - Don't throw errors for individual platform failures
   - Continue generating for other platforms if one fails
   - Return detailed error messages

3. **Graceful Degradation:**
   - If Gemini API fails for one platform, skip it and continue
   - Only return error if ALL platforms fail
   - Detailed error messages for each failure type

---

## 🔍 How to Debug the 500 Error

### Step 1: Check Browser Console

Open your browser console (F12) and look for these logs:

```javascript
🚀 Starting content generation...
  {
    platforms: ["linkedin", "twitter"],
    tone: "professional",
    style: "narrative",
    contentLength: 500,
    keywords: {...}
  }

📥 Received response: { data: {...}, error: {...} }
```

**Look for:**
- ❌ If there's an error in the response
- The exact error message returned
- Any details about what failed

### Step 2: Check Supabase Dashboard Logs

1. Go to: https://supabase.com/dashboard/project/siwzszmukfbzicjjkxro/functions
2. Click on `gemini-repurpose` function
3. Click "Logs" tab
4. Look for recent errors

**What to Look For:**
```
=== Gemini Repurpose Function Started ===
Checking session...
Session verified for user: [user-id]
Parsing request body...
Received request: {...}
Generating content for 2 platforms...
```

**If you see:**
- "No session found" → Auth issue
- "GEMINI_API_KEY not configured" → Environment variable issue
- "Gemini API error" → Gemini API issue (rate limit, quota, invalid key)
- No logs at all → Function not being called

### Step 3: Common Issues & Solutions

#### Issue 1: Authentication Error
```
Error: "Authentication required. Please sign in."
```

**Solution:**
- Sign out and sign back in
- Check if session is still valid
- Clear browser cache/cookies

#### Issue 2: Gemini API Key Error
```
Error: "Service configuration error"
```

**Solution:**
- Verify GEMINI_API_KEY is set in Supabase dashboard
- Go to: Project Settings → Edge Functions → Secrets
- Check if `GEMINI_API_KEY` exists
- Value should be: `AIzaSyChm8D_Ne857vBUdiaU0VKmJoUZlH5w04U`

#### Issue 3: Gemini API Rate Limit
```
Gemini API error for [platform]: { error: "RESOURCE_EXHAUSTED" }
```

**Solution:**
- Wait a few minutes and try again
- Try with fewer platforms (1-2 instead of 8)
- Check Gemini API quota

#### Issue 4: Invalid Request Format
```
Error: "Missing required fields"
```

**Solution:**
- Make sure content is at least 100 characters
- At least one platform is selected
- Check browser console for request details

---

## 🧪 Testing Steps

### Test 1: Simple Generation (1 Platform)

1. Go to `/repurpose`
2. Type 200 characters of text
3. Select ONLY "LinkedIn"
4. Click Generate
5. Open browser console (F12)
6. Check for detailed logs

**Expected:**
- 🚀 Starting content generation...
- 📥 Received response with generatedContent
- ✅ Success toast

### Test 2: Multiple Platforms

1. Same as Test 1
2. Select 2-3 platforms
3. Generate

**Expected:**
- Should take 10-30 seconds (5-10 sec per platform)
- May skip platforms with API errors
- Should succeed for at least 1 platform

### Test 3: Check Logs

1. After generation attempt (success or fail)
2. Go to Supabase Dashboard
3. Functions → gemini-repurpose → Logs
4. Check most recent log entry

**Expected Logs:**
```
=== Gemini Repurpose Function Started ===
Checking session...
Session verified for user: abc-123
Parsing request body...
Received request: {
  contentLength: 200,
  platformsCount: 1,
  platforms: ["linkedin"],
  tone: "professional",
  style: "narrative",
  hasSeoData: true
}
Generating content for 1 platforms...
Calling Gemini API for linkedin...
Prompt length: 1234 characters
Gemini response status for linkedin: 200
✅ Generated linkedin content (1500 chars)
=== Generation Complete ===
Successfully generated content for 1 platforms
```

---

## 🚨 Troubleshooting Specific Errors

### Error: "Edge Function returned a non-2xx status code"

**Possible Causes:**
1. Function crashed (check logs for stack trace)
2. Gemini API returned error for all platforms
3. Authentication failed
4. Missing environment variables

**Debug Steps:**
1. Check browser console for the specific error message
2. Check Supabase dashboard logs
3. Look for the first error in the log chain
4. Fix that specific issue

### Error: "Failed to generate content for any platform"

**Possible Causes:**
1. Gemini API rate limit exceeded
2. Invalid API key
3. Prompt too long
4. Content violates Gemini policies

**Debug Steps:**
1. Check Supabase logs for Gemini API error messages
2. Try with shorter content
3. Try with different platforms
4. Wait 5 minutes and try again

### Error: Network/Timeout Errors

**Possible Causes:**
1. Slow Gemini API response
2. Function timeout (default: 60 seconds)
3. Network connectivity issues

**Debug Steps:**
1. Try with 1 platform only
2. Use shorter content
3. Check if other Supabase functions work
4. Try again in a few minutes

---

## 📊 Current Function Configuration

**Edge Function:** `gemini-repurpose`
- **Status:** ✅ Deployed (Version 3)
- **Last Updated:** Just now
- **Runtime:** Deno
- **Timeout:** 60 seconds (default)
- **Memory:** 512MB (default)

**Environment Variables Required:**
```bash
GEMINI_API_KEY=AIzaSyChm8D_Ne857vBUdiaU0VKmJoUZlH5w04U
SUPABASE_URL=[auto-configured]
SUPABASE_ANON_KEY=[auto-configured]
```

**Platforms Supported:**
- LinkedIn (1 credit) ✅
- Twitter (1 credit) ✅
- Instagram (2 credits) ✅
- YouTube (3 credits) ✅
- Blog (2 credits) ✅
- Newsletter (2 credits) ✅
- Reddit (1 credit) ✅
- Podcast (3 credits) ✅

---

## 🎯 Next Steps

### Immediate:
1. Try generating content now with detailed logging enabled
2. Check browser console for complete request/response
3. If error persists, share the console output with me

### If Still Failing:
1. Go to Supabase Dashboard → Functions → gemini-repurpose → Logs
2. Copy the most recent error log
3. Share with me for analysis

### Alternative Debugging:
1. Test with Supabase's function invoke directly:
   ```bash
   curl -X POST \
     https://siwzszmukfbzicjjkxro.supabase.co/functions/v1/gemini-repurpose \
     -H "Authorization: Bearer [your-token]" \
     -H "Content-Type: application/json" \
     -d '{
       "content": "Test content here",
       "platforms": ["linkedin"],
       "tone": "professional",
       "style": "narrative",
       "seoData": {}
     }'
   ```

---

## 📝 Expected Successful Output

### Browser Console:
```javascript
🚀 Starting content generation... {platforms: ["linkedin"], ...}
📥 Received response: {
  data: {
    generatedContent: [
      {
        platform: "linkedin",
        content: "Your professionally optimized LinkedIn post..."
      }
    ],
    platformCount: 1
  },
  error: null
}
✅ Generated content: [...]
```

### Supabase Logs:
```
=== Gemini Repurpose Function Started ===
...
✅ Generated linkedin content (1500 chars)
=== Generation Complete ===
Successfully generated content for 1 platforms
```

### UI:
- ✅ Toast notification: "Content Generated! ✨"
- ✅ Navigates to Step 5: Results
- ✅ Shows generated content in tabs
- ✅ Copy/Download buttons work

---

## 🔧 Quick Fixes

### Fix 1: Verify Gemini API Key
```bash
# Check in Supabase Dashboard:
Project Settings → Edge Functions → Secrets
Should see: GEMINI_API_KEY = AIzaSyChm8D_Ne857vBUdiaU0VKmJoUZlH5w04U
```

### Fix 2: Test with Minimal Content
```
Content: "This is a test post about SEO optimization and content marketing strategies."
Platforms: LinkedIn only
No keywords
```

### Fix 3: Clear Cache
```
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear Supabase cache
3. Sign out and sign back in
```

---

## ✅ Success Criteria

You'll know it's working when:
1. ✅ No errors in browser console
2. ✅ "Content Generated!" toast appears
3. ✅ Navigates to Results step
4. ✅ Can see generated content
5. ✅ Can copy/download content
6. ✅ Supabase logs show successful generation

---

**Status:** Function is now deployed with comprehensive error logging. Try generating content and check the console/logs for detailed debugging information.

