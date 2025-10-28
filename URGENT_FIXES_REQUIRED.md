# 🚨 URGENT FIXES REQUIRED

## Console Errors Analysis

You have **4 critical errors** that need immediate attention:

---

## ❌ Error 1 & 2: User Credits (406/403)

```
siwzszmukfbzicjjkxro.supabase.co/rest/v1/user_credits?select=*&user_id=eq.xxx:1  
Failed to load resource: the server responded with a status of 406 ()

siwzszmukfbzicjjkxro.supabase.co/rest/v1/user_credits?select=*:1  
Failed to load resource: the server responded with a status of 403 ()
```

### 🔧 FIX: Run SQL Script

**Action Required:** Run `FIX_RLS_POLICIES.sql` in Supabase SQL Editor

**Steps:**
1. Go to: https://supabase.com/dashboard/project/siwzszmukfbzicjjkxro/sql/new
2. Copy contents of `FIX_RLS_POLICIES.sql`
3. Paste and click "Run"
4. Verify output shows policies created

**What it does:**
- Enables Row Level Security on `user_credits` table
- Creates policies so users can access their own credits
- Grants proper permissions to authenticated users

**Time:** 1 minute

---

## ❌ Error 3: Google Search Console (400)

```
siwzszmukfbzicjjkxro.supabase.co/functions/v1/gsc-query:1  
Failed to load resource: the server responded with a status of 400 ()

Error: No Google access token available. Please sign out and sign in again 
with Google to grant access to Search Console.
```

### 🔧 FIX: Re-authenticate with Google

**Action Required:** Sign out and sign in with Google

**Steps:**
1. Click your profile in the dashboard
2. Click "Sign Out"
3. Go to homepage
4. Click "Sign in with Google"
5. **IMPORTANT:** When Google asks for permissions, make sure to:
   - ✅ Allow access to Google Search Console
   - ✅ Check the box "Allow this app to access your Search Console data"
6. Complete sign-in

**Why this happens:**
- Your current session doesn't have the `provider_token` needed to access Google Search Console API
- This token is only provided during Google OAuth sign-in
- You may have signed in with email/password or the token expired

**Time:** 2 minutes

---

## ❌ Error 4: Gemini AI Chat (400)

```
index-Csx1RIT9.js:963 💥 Chat error: Error: Gemini API error: 400
```

### 🔧 FIX: Check Gemini API Key

**Action Required:** Verify GEMINI_API_KEY in Supabase

**Steps:**
1. Go to: https://supabase.com/dashboard/project/siwzszmukfbzicjjkxro/settings/functions
2. Scroll to "Environment Variables" section
3. Look for `GEMINI_API_KEY`
4. If missing or invalid, add/update it:
   - Name: `GEMINI_API_KEY`
   - Value: Your Gemini API key from https://makersuite.google.com/app/apikey

**Get a Gemini API Key:**
1. Go to: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Add it to Supabase secrets

**Alternative Issue:** If key exists, the error might be due to:
- Invalid request format
- Rate limiting
- API quota exceeded

**Check Logs:**
1. Go to: https://supabase.com/dashboard/project/siwzszmukfbzicjjkxro/functions/seo-ai-chat/logs
2. Look for detailed error messages
3. Check what's being sent to Gemini API

**Time:** 5 minutes

---

## 🎯 Quick Fix Checklist

Do these in order:

### Step 1: Fix Database (1 min) 🔥
- [ ] Run `FIX_RLS_POLICIES.sql` in Supabase SQL Editor
- [ ] Verify policies created (check output)
- [ ] Refresh your app

### Step 2: Re-authenticate (2 min) 🔥
- [ ] Sign out of your app
- [ ] Sign in with Google (not email)
- [ ] Grant Search Console permissions
- [ ] Verify you can see your properties

### Step 3: Check Gemini Key (5 min) ⚠️
- [ ] Go to Supabase → Settings → Edge Functions
- [ ] Verify `GEMINI_API_KEY` exists
- [ ] If missing, create API key and add it
- [ ] Redeploy `seo-ai-chat` function if you change the key

### Step 4: Check Stripe Key (IMPORTANT!) ⚠️
- [ ] Go to Supabase → Settings → Edge Functions
- [ ] Add `STRIPE_SECRET_KEY` (see EDGE_FUNCTIONS_AUDIT_REPORT.md)
- [ ] Deploy Stripe functions:
  ```bash
  npx supabase functions deploy stripe-checkout
  npx supabase functions deploy stripe-webhook
  ```

---

## 🧪 Test After Fixes

### Test 1: Credits Query
Open browser console and run:
```javascript
const { data, error } = await supabase
  .from('user_credits')
  .select('*')
  .eq('user_id', (await supabase.auth.getUser()).data.user.id)
  .single();
console.log('Credits:', data, error);
```

**Expected:** Should show your credits without error

### Test 2: GSC Query
Open browser console and run:
```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Has provider_token:', !!session?.provider_token);
```

**Expected:** Should show `true`

### Test 3: Chat
1. Open the AI chatbot
2. Type "Hello"
3. Send message

**Expected:** AI should respond without errors

---

## 📋 Summary

| Error | Fix | Time | Priority |
|-------|-----|------|----------|
| 406/403 on user_credits | Run SQL script | 1 min | 🔥 Critical |
| 400 on gsc-query | Re-authenticate | 2 min | 🔥 Critical |
| 400 on Gemini API | Check API key | 5 min | ⚠️ High |
| Stripe not working | Add secret key | 2 min | ⚠️ High |

**Total Time:** ~10 minutes

---

## 🆘 Still Having Issues?

### If credits still show 403:
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Try incognito/private window

### If GSC still shows 400:
- Check browser console for `provider_token`
- Try revoking Google access and re-granting:
  - Go to https://myaccount.google.com/permissions
  - Remove "AnotherSEOGuru"
  - Sign in again

### If chat still shows 400:
- Check function logs in Supabase
- Look for detailed error message
- Verify Gemini API quota not exceeded

---

## 📞 Need Help?

Check these files for more details:
- `CONSOLE_ERRORS_FIXES.md` - Detailed analysis
- `FIX_RLS_POLICIES.sql` - Database fix script
- `EDGE_FUNCTIONS_AUDIT_REPORT.md` - All function issues
- `FINAL_IMPLEMENTATION_REPORT.md` - Complete project status

---

**Last Updated:** October 28, 2025  
**Status:** Fixes ready - awaiting execution  
**Priority:** 🔥 CRITICAL - Do these fixes now!

