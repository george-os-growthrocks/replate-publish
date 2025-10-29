# 🔧 Troubleshooting: Google OAuth CORS Errors

## ❌ Error You're Seeing

```
Failed to load resource: the server responded with a status of 400 ()
Error checking sign-in status: Object
The fetch of the id assertion endpoint resulted in a network error: ERR_FAILED
Server did not send the correct CORS headers.
```

---

## ✅ Solution Checklist

### **1. Google Cloud Console - Authorized JavaScript Origins**

**This is the most common cause!**

1. Go to: [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)

2. Click on your OAuth Client ID:
   ```
   536359531915-qhjrnjgjj5u1cqmbveb0etcuhpdgmep0
   ```

3. Scroll to **"Authorized JavaScript origins"**

4. **Must have EXACTLY** (no trailing slash):
   ```
   http://localhost:5173
   ```

5. **Also add for production**:
   ```
   https://yourdomain.com
   ```

6. Click **SAVE**

7. **Wait 5-10 minutes** for changes to propagate

---

### **2. Enable Google Analytics Reporting API**

1. Go to: [APIs & Services Library](https://console.cloud.google.com/apis/library)

2. Search: `Google Analytics Reporting API`

3. Click on it

4. Click **"ENABLE"** (if not already enabled)

5. Should show: **"API enabled"**

---

### **3. OAuth Consent Screen Configuration**

1. Go to: [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)

2. Verify **App name** is set

3. **Scopes**: Click "ADD OR REMOVE SCOPES"
   - Search for: `analytics.readonly`
   - Check: `https://www.googleapis.com/auth/analytics.readonly`
   - Click "UPDATE"

4. **Test users**: Add your email address
   - Click "ADD USERS"
   - Enter your Google account email
   - Click "ADD"

5. Click **SAVE AND CONTINUE**

---

### **4. Restart Development Server**

After making changes above:

```bash
# Stop server (Ctrl+C)

# Clear browser cache or use incognito mode

# Restart server
npm run dev
```

---

### **5. Browser Console Checks**

Open browser console (F12) and look for:

```
Google Client ID loaded: 536359531915-qhjrnjg...
GAPI loaded, initializing auth2...
Auth2 library loaded
Initializing Google Auth with scope: analytics.readonly
```

If you see:
- ❌ `Google Client ID loaded: NOT SET` → Check your `.env` file
- ❌ `GAPI not loading` → Check `index.html` has the script tag
- ❌ `idpiframe_initialization_failed` → Check authorized origins

---

## 🧪 Quick Test Steps

1. **Clear browser cache** or use **Incognito/Private window**
2. Visit: `http://localhost:5173/ga-reporting`
3. Open browser console (F12)
4. Check for console logs above
5. Click "Sign in with Google"
6. Look for specific error in console

---

## 🔍 Common Issues & Fixes

### **Issue 1: "idpiframe_initialization_failed"**

**Cause**: Authorized JavaScript origins not configured  
**Fix**: Add `http://localhost:5173` to authorized origins (see Step 1)

### **Issue 2: "popup_closed_by_user"**

**Cause**: User closed OAuth popup  
**Fix**: Try signing in again, don't close the popup

### **Issue 3: "access_denied"**

**Cause**: User didn't grant analytics.readonly permission  
**Fix**: 
- Click "Sign in" again
- When popup appears, click "Allow"
- Make sure your email is in Test Users list

### **Issue 4: Client ID not loading**

**Cause**: `.env` file not read or server not restarted  
**Fix**:
1. Verify `.env` has: `VITE_GOOGLE_CLIENT_ID=536359531915-...`
2. Stop server (Ctrl+C)
3. Restart: `npm run dev`

### **Issue 5: CORS errors persist**

**Cause**: Google's OAuth settings take time to propagate  
**Fix**:
1. Wait 5-10 minutes after saving changes
2. Clear browser cache
3. Try incognito mode
4. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

---

## 🎯 Correct Configuration Summary

### **.env File**
```env
VITE_GOOGLE_CLIENT_ID=536359531915-qhjrnjgjj5u1cqmbveb0etcuhpdgmep0.apps.googleusercontent.com
```

### **Google Cloud Console**

**OAuth Client ID Settings:**
- Name: Your app name
- Application type: Web application
- Authorized JavaScript origins:
  - `http://localhost:5173`
  - `https://yourdomain.com` (for production)
- Authorized redirect URIs: (leave empty for client-side flow)

**OAuth Consent Screen:**
- User Type: External
- App name: Set
- User support email: Set
- Scopes: `https://www.googleapis.com/auth/analytics.readonly`
- Test users: Your email added

**APIs Enabled:**
- ✅ Google Analytics Reporting API

---

## 🚨 Security Note

The Client ID in `.env` is **safe to expose** in client-side code. It's designed to be public. The security comes from:

1. Authorized JavaScript origins restriction
2. OAuth consent screen
3. User must explicitly grant permission

---

## 📞 Still Having Issues?

1. **Check browser console** for exact error message
2. **Screenshot the error** for better diagnosis
3. **Verify all steps above** are completed
4. **Wait 10 minutes** after making Google Console changes
5. **Try incognito mode** to rule out cache issues

---

## ✅ Success Indicators

When working correctly, you should see:

1. Console logs showing Client ID loaded
2. No CORS errors
3. Sign-in popup appears without errors
4. After signing in, page shows "Sign Out" button
5. Can enter View ID and load analytics data

---

**Most common fix**: Add `http://localhost:5173` to Authorized JavaScript origins in Google Cloud Console!
