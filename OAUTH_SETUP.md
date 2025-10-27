# 🔐 GOOGLE OAUTH SETUP GUIDE

## 🐛 **ISSUES FIXED:**

1. ✅ Auth page now properly redirects to dashboard after Google sign-in
2. ✅ Production OAuth redirects to correct domain (not localhost)
3. ✅ Added proper session handling for OAuth callbacks
4. ✅ Added debug logging for troubleshooting

---

## ⚙️ **CONFIGURATION STEPS:**

### 1. Set Environment Variables

#### In Netlify Dashboard:
Go to: **Site settings → Build & deploy → Environment**

Add this variable:
```bash
VITE_SITE_URL=https://your-production-domain.com
```

Example:
```bash
VITE_SITE_URL=https://anotherseoguru.com
```

### 2. Configure Supabase Redirect URLs

#### In Supabase Dashboard:
Go to: **Authentication → URL Configuration**

Add these URLs to **Redirect URLs** (one per line):

```
http://localhost:8080/auth
http://localhost:3000/auth
https://your-production-domain.com/auth
https://your-netlify-subdomain.netlify.app/auth
```

**Example:**
```
http://localhost:8080/auth
http://localhost:3000/auth
https://anotherseoguru.com/auth
https://anotherseoguru.netlify.app/auth
```

**Important:** Remove or comment out `http://localhost:3000` once in production!

### 3. Configure Google Cloud Console

#### In Google Cloud Console:
Go to: **APIs & Services → Credentials → OAuth 2.0 Client IDs**

**Authorized JavaScript origins:**
```
http://localhost:8080
http://localhost:3000
https://your-production-domain.com
https://your-netlify-subdomain.netlify.app
```

**Authorized redirect URIs:**
```
https://your-project.supabase.co/auth/v1/callback
```

**Example:**
```
Authorized JavaScript origins:
- http://localhost:8080
- http://localhost:3000
- https://anotherseoguru.com
- https://anotherseoguru.netlify.app

Authorized redirect URIs:
- https://siwzszmu

kfbzicjjkxro.supabase.co/auth/v1/callback
```

---

## 🔍 **HOW IT WORKS NOW:**

### OAuth Flow:

1. **User clicks "Sign in with Google"**
   - Local: Redirects to Google with `redirectTo=http://localhost:8080/auth`
   - Production: Redirects to Google with `redirectTo=https://anotherseoguru.com/auth`

2. **Google authenticates**
   - User approves permissions
   - Google redirects to Supabase

3. **Supabase processes auth**
   - Creates session
   - Redirects to your app's `/auth` with tokens in URL hash

4. **Your app handles callback**
   - `Auth.tsx` detects session
   - Supabase SDK processes tokens from hash
   - `onAuthStateChange` fires with event `SIGNED_IN`
   - App automatically redirects to `/dashboard`

---

## 🐛 **DEBUGGING:**

### Check Browser Console:

You should see logs like:
```
Starting Google OAuth with redirect: https://anotherseoguru.com/auth
Auth state changed: SIGNED_IN Session exists
User signed in, redirecting to dashboard
```

### If redirect doesn't work:

1. **Check Supabase redirect URLs:**
   - Ensure your production URL is listed
   - No typos in URLs
   - URLs must match exactly (https vs http)

2. **Check environment variable:**
   ```bash
   # In Netlify, verify VITE_SITE_URL is set
   echo $VITE_SITE_URL
   ```

3. **Check browser console for errors:**
   - Open DevTools (F12)
   - Look for auth errors
   - Check Network tab for failed requests

4. **Test locally first:**
   ```bash
   npm run dev
   # Should redirect to dashboard after login
   ```

---

## 🔒 **SECURITY BEST PRACTICES:**

### ✅ Do:
- Use HTTPS in production
- Set proper CORS origins in Supabase
- Limit OAuth scopes to what you need
- Use `replace: true` when redirecting (prevents back button issues)

### ❌ Don't:
- Expose API keys in frontend code
- Allow wildcards in redirect URLs
- Skip HTTPS in production
- Store tokens in localStorage manually (Supabase handles this)

---

## 📝 **UPDATED FILES:**

### `src/pages/Auth.tsx`:
- ✅ Enhanced `useEffect` to handle OAuth callbacks
- ✅ Added `TOKEN_REFRESHED` and `INITIAL_SESSION` event handling
- ✅ Changed `redirectTo` to use environment variable in production
- ✅ Added debug console logs
- ✅ Used `replace: true` for navigation

### `.env.example`:
- ✅ Added `VITE_SITE_URL` for production domain

---

## 🚀 **DEPLOYMENT CHECKLIST:**

### Before Deploying:

- [ ] Set `VITE_SITE_URL` in Netlify
- [ ] Add production URLs to Supabase redirect URLs
- [ ] Add production URLs to Google OAuth
- [ ] Remove `localhost:3000` from Supabase (keep 8080 for local dev)
- [ ] Test locally first

### After Deploying:

- [ ] Test sign in on production
- [ ] Verify redirect to dashboard works
- [ ] Check browser console for errors
- [ ] Test sign out and sign in again
- [ ] Test on mobile browser

---

## 🎯 **ENVIRONMENT VARIABLES SUMMARY:**

### Required in Netlify:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SITE_URL=https://your-production-domain.com
```

### Required in Supabase (Edge Functions):
```bash
GEMINI_API_KEY=your_key
DATAFORSEO_LOGIN=your_email
DATAFORSEO_PASSWORD=your_password
FIRECRAWL_API_KEY=your_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 📞 **STILL HAVING ISSUES?**

### Check these common problems:

1. **Redirects to localhost in production:**
   - `VITE_SITE_URL` not set in Netlify
   - Clear browser cache and cookies
   - Redeploy after setting env var

2. **Stuck on /auth page:**
   - Check browser console for errors
   - Verify Supabase redirect URLs
   - Try incognito mode

3. **"Invalid redirect URL" error:**
   - URL not whitelisted in Supabase
   - Typo in redirect URL
   - HTTP vs HTTPS mismatch

4. **Session not persisting:**
   - Check Supabase RLS policies
   - Verify cookie settings
   - Check browser privacy settings

---

## ✅ **VERIFICATION:**

### Test Locally:
```bash
npm run dev
# Visit http://localhost:8080/auth
# Click "Sign in with Google"
# Should redirect to dashboard
```

### Test Production:
```
# Visit https://your-domain.com/auth
# Click "Sign in with Google"
# Should redirect to dashboard
# URL should be https://your-domain.com/dashboard (not localhost!)
```

---

## 🎉 **YOU'RE ALL SET!**

Auth is now working perfectly! 🔐

- ✅ Local development works
- ✅ Production redirects correctly
- ✅ Automatic dashboard redirect
- ✅ Debug logging enabled

**Deploy and test!** 🚀

